import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateSwitchBotHeaders(token: string, secret: string) {
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const data = token + t + nonce;
  const sign = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest()
    .toString('base64');

  return {
    Authorization: token,
    sign,
    nonce,
    t,
    'Content-Type': 'application/json; charset=utf8',
  };
}

// ------------------------------------------------------------------------------
// GET: SwitchBot 温湿度計から室温・湿度ステータスを取得
// ------------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const token = process.env.SWITCHBOT_TOKEN;
  const secret = process.env.SWITCHBOT_SECRET;

  if (!token || !secret) {
    return NextResponse.json({
      configured: false,
      error: 'SwitchBot credentials (TOKEN / SECRET) not configured in .env.local',
    });
  }

  // クエリまたは環境変数から温湿度計のデバイスIDを取得
  const searchParams = req.nextUrl.searchParams;
  let deviceId =
    searchParams.get('deviceId') ||
    process.env.SWITCHBOT_METER_DEVICE_ID ||
    process.env.SWITCHBOT_DEVICE_ID;

  let deviceName = '室内';

  try {
    // もしデバイスIDが明示されていない、または自動探索したい場合
    if (!deviceId) {
      // 登録デバイス一覧を取得して温湿度計（Meter, MeterPlus, Hub 2等）を探索
      const devicesRes = await fetch('https://api.switch-bot.com/v1.1/devices', {
        headers: generateSwitchBotHeaders(token, secret),
        cache: 'no-store',
      });

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        const deviceList = [
          ...(devicesData.body?.deviceList || []),
          ...(devicesData.body?.infraredRemoteList || []),
        ];

        // 温湿度計系デバイスを優先検索
        const meterDevice = deviceList.find((d: any) =>
          ['Meter', 'MeterPlus', 'WoIOSensor', 'Hub 2', 'MeterPro', 'MeterPro(CO2)'].includes(
            d.deviceType
          ) || (d.deviceName && d.deviceName.includes('温湿度'))
        );

        if (meterDevice) {
          deviceId = meterDevice.deviceId;
          deviceName = meterDevice.deviceName || '室内';
        }
      }
    }

    if (!deviceId) {
      return NextResponse.json({
        configured: true,
        foundMeter: false,
        error: 'No SwitchBot meter device found. Please specify SWITCHBOT_METER_DEVICE_ID in .env.local',
      });
    }

    // デバイスステータス取得
    const statusRes = await fetch(
      `https://api.switch-bot.com/v1.1/devices/${deviceId}/status`,
      {
        headers: generateSwitchBotHeaders(token, secret),
        cache: 'no-store',
      }
    );

    if (!statusRes.ok) {
      return NextResponse.json({
        configured: true,
        error: `SwitchBot status request failed with status: ${statusRes.status}`,
      });
    }

    const statusData = await statusRes.json();

    if (statusData.statusCode !== 100 || !statusData.body) {
      return NextResponse.json({
        configured: true,
        error: statusData.message || 'Failed to get device status',
        statusData,
      });
    }

    const body = statusData.body;
    const temperature = typeof body.temperature === 'number' ? body.temperature : null;
    const humidity = typeof body.humidity === 'number' ? body.humidity : null;
    const battery = typeof body.battery === 'number' ? body.battery : undefined;

    if (temperature === null || humidity === null) {
      return NextResponse.json({
        configured: true,
        error: 'Selected device does not have temperature/humidity readings',
        body,
      });
    }

    return NextResponse.json({
      configured: true,
      data: {
        temperature,
        humidity,
        battery,
        deviceName,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('SwitchBot Status Fetch Error:', error);
    return NextResponse.json(
      { configured: true, error: error.message || 'Network error fetching SwitchBot status' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------------------
// POST: SwitchBot 給電制御 (ON/OFF コマンド)
// ------------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. APIキー検証 (不正アクセス防止)
  const clientKey = req.headers.get('x-api-key');
  const internalSecret = process.env.INTERNAL_SWITCHBOT_KEY || 'secret_local_key';

  if (!clientKey || clientKey !== internalSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. パラメータ取得 (on または off)
  const searchParams = req.nextUrl.searchParams;
  let state = searchParams.get('state')?.toLowerCase();

  if (!state) {
    try {
      const body = await req.json();
      state = body.state?.toLowerCase();
    } catch {
      // no body
    }
  }

  if (state !== 'on' && state !== 'off') {
    return NextResponse.json(
      { error: "Invalid state. Use 'on' or 'off'" },
      { status: 400 }
    );
  }

  // 3. SwitchBot設定確認
  const token = process.env.SWITCHBOT_TOKEN;
  const secret = process.env.SWITCHBOT_SECRET;
  const deviceId = process.env.SWITCHBOT_DEVICE_ID;

  if (!token || !secret || !deviceId) {
    return NextResponse.json(
      { error: 'SwitchBot credentials not configured in environment variables' },
      { status: 503 }
    );
  }

  const command = state === 'on' ? 'turnOn' : 'turnOff';

  try {
    const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/commands`, {
      method: 'POST',
      headers: generateSwitchBotHeaders(token, secret),
      body: JSON.stringify({
        command,
        parameter: 'default',
        commandType: 'command',
      }),
    });

    const result = await res.json();
    return NextResponse.json({
      success: result.statusCode === 100,
      state,
      switchBotResponse: result,
    });
  } catch (error: any) {
    console.error('SwitchBot API Error:', error);
    return NextResponse.json(
      { error: error.message || 'SwitchBot execution failed' },
      { status: 500 }
    );
  }
}

