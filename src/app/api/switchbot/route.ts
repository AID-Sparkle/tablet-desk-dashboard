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
// GET: SwitchBot 温湿度計から室温・湿度ステータス & 操作可能デバイス一覧を取得
// ------------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const token = process.env.SWITCHBOT_TOKEN;
  const secret = process.env.SWITCHBOT_SECRET;

  if (!token || !secret) {
    return NextResponse.json({
      configured: false,
      error: 'SwitchBot credentials (TOKEN / SECRET) not configured in .env.local',
      data: null,
      devices: [],
    });
  }

  const searchParams = req.nextUrl.searchParams;
  let meterDeviceId =
    searchParams.get('deviceId') ||
    process.env.SWITCHBOT_METER_DEVICE_ID;

  let deviceName = '室内';
  const controllableDevices: any[] = [];

  try {
    // 1. 登録デバイス一覧を取得
    const devicesRes = await fetch('https://api.switch-bot.com/v1.1/devices', {
      headers: generateSwitchBotHeaders(token, secret),
      cache: 'no-store',
    });

    if (devicesRes.ok) {
      const devicesData = await devicesRes.json();
      const rawList = devicesData.body?.deviceList || [];

      // 操作可能デバイス (プラグ、ライト、ボット、カーテン等) を抽出
      const CONTROLLABLE_TYPES = new Set([
        'Plug',
        'Plug Mini (JP)',
        'Plug Mini (US)',
        'Bot',
        'Color Bulb',
        'Strip Light',
        'Ceiling Light',
        'Ceiling Light Pro',
        'Curtain',
        'Curtain 3',
        'Blind Tilt',
      ]);

      for (const d of rawList) {
        if (CONTROLLABLE_TYPES.has(d.deviceType)) {
          controllableDevices.push({
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            powerState: 'unknown',
          });
        }
      }

      // 温湿度計系デバイスを自動探索 (未指定時)
      if (!meterDeviceId) {
        const found = rawList.find((d: any) =>
          ['Meter', 'MeterPlus', 'WoIOSensor', 'Hub 2', 'MeterPro', 'MeterPro(CO2)'].includes(
            d.deviceType
          ) || (d.deviceName && d.deviceName.includes('温湿度'))
        );
        if (found) {
          meterDeviceId = found.deviceId;
          deviceName = found.deviceName || '室内';
        }
      }
    }

    // もし指定デバイスIDも探索結果もない場合は、デフォルトデバイスIDを使用
    if (!meterDeviceId) {
      meterDeviceId = process.env.SWITCHBOT_DEVICE_ID;
    }

    let meterData = null;

    // 2. 温湿度計のステータスを取得
    if (meterDeviceId) {
      try {
        const statusRes = await fetch(
          `https://api.switch-bot.com/v1.1/devices/${meterDeviceId}/status`,
          {
            headers: generateSwitchBotHeaders(token, secret),
            cache: 'no-store',
          }
        );

        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          if (statusJson.statusCode === 100 && statusJson.body) {
            const b = statusJson.body;
            if (typeof b.temperature === 'number' && typeof b.humidity === 'number') {
              meterData = {
                temperature: b.temperature,
                humidity: b.humidity,
                battery: typeof b.battery === 'number' ? b.battery : undefined,
                deviceName,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch meter status:', err);
      }
    }

    return NextResponse.json({
      configured: true,
      data: meterData,
      devices: controllableDevices,
    });
  } catch (error: any) {
    console.error('SwitchBot Fetch Error:', error);
    return NextResponse.json(
      { configured: true, error: error.message, data: null, devices: [] },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------------------
// POST: SwitchBot デバイス操作 (ON/OFF / 任意のコマンド)
// ------------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const token = process.env.SWITCHBOT_TOKEN;
  const secret = process.env.SWITCHBOT_SECRET;

  if (!token || !secret) {
    return NextResponse.json(
      { error: 'SwitchBot credentials not configured in environment variables' },
      { status: 503 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const targetDeviceId = body.deviceId || process.env.SWITCHBOT_DEVICE_ID;
  const command = body.command || (body.state === 'on' ? 'turnOn' : body.state === 'off' ? 'turnOff' : 'turnOn');
  const parameter = body.parameter || 'default';
  const commandType = body.commandType || 'command';

  if (!targetDeviceId) {
    return NextResponse.json(
      { error: 'Device ID is required to execute SwitchBot command' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${targetDeviceId}/commands`, {
      method: 'POST',
      headers: generateSwitchBotHeaders(token, secret),
      body: JSON.stringify({
        command,
        parameter,
        commandType,
      }),
    });

    const result = await res.json();
    return NextResponse.json({
      success: result.statusCode === 100,
      deviceId: targetDeviceId,
      command,
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

