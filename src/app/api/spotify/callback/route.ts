import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${proto}://${host}/api/spotify/callback`;

  if (error || !code) {
    return new NextResponse(
      `<html><body style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px;">
        <h2 style="color: #ef4444;">認証がキャンセルされたか失敗しました</h2>
        <p>エラー: ${error || 'コードが見つかりません'}</p>
        <p><a href="/" style="color: #38bdf8;">ダッシュボードに戻る</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return new NextResponse(
        `<html><body style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px;">
          <h2 style="color: #ef4444;">トークン交換エラー (${tokenRes.status})</h2>
          <pre style="background: #1e293b; padding: 15px; border-radius: 8px;">${errorText}</pre>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const tokenData = await tokenRes.json();
    const refreshToken = tokenData.refresh_token;

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="utf-8">
        <title>Spotify認証成功</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 {
            color: #10b981;
            font-size: 24px;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          p {
            color: #94a3b8;
            line-height: 1.6;
          }
          .token-box {
            background: #0f172a;
            border: 1px solid #334155;
            padding: 14px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            color: #38bdf8;
            word-break: break-all;
            margin: 16px 0;
            user-select: all;
          }
          button {
            background: #10b981;
            color: #fff;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          button:hover {
            background: #059669;
          }
          .guide {
            margin-top: 24px;
            background: rgba(245, 158, 11, 0.1);
            border-left: 4px solid #f59e0b;
            padding: 12px;
            border-radius: 4px;
            font-size: 14px;
            color: #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ Spotify 連携トークン取得完了</h1>
          <p>以下のリフレッシュトークンをコピーし、<code>.env.local</code> の <code>SPOTIFY_REFRESH_TOKEN</code> に貼り付けてください。</p>
          
          <div class="token-box" id="token">${refreshToken}</div>
          <button onclick="copyToken()">トークンをコピー</button>
          
          <div class="guide">
            <strong>次のステップ:</strong><br>
            1. 上記のボタンでトークンをコピー<br>
            2. プロジェクトの <code>.env.local</code> を開き、<code>SPOTIFY_REFRESH_TOKEN="${refreshToken}"</code> と入力して保存<br>
            3. 開発サーバー（またはVercel）を再起動すると、ダッシュボードで音楽の再生表示・操作が可能になります！
          </div>

          <p style="margin-top: 24px;"><a href="/" style="color: #38bdf8; text-decoration: none;">← ダッシュボード画面へ戻る</a></p>
        </div>

        <script>
          function copyToken() {
            const token = document.getElementById('token').innerText;
            navigator.clipboard.writeText(token).then(() => {
              alert('リフレッシュトークンをクリップボードにコピーしました！');
            });
          }
        </script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err: any) {
    return new NextResponse(
      `<html><body style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 40px;">
        <h2 style="color: #ef4444;">エラーが発生しました</h2>
        <p>${err.message}</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
