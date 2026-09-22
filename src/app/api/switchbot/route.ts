import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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

  // 4. SwitchBot API v1.1 HMAC-SHA256署名生成
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const data = token + t + nonce;
  const sign = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest()
    .toString('base64');

  const command = state === 'on' ? 'turnOn' : 'turnOff';

  try {
    const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/commands`, {
      method: 'POST',
      headers: {
        Authorization: token,
        sign,
        nonce,
        t,
        'Content-Type': 'application/json; charset=utf8',
      },
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
