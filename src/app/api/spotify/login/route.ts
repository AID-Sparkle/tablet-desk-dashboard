import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId || clientId.includes('ここに')) {
    return new NextResponse(
      `<html>
        <head><meta charset="utf-8"><title>Spotify設定エラー</title></head>
        <body style="font-family: sans-serif; padding: 40px; background: #121212; color: #fff; line-height: 1.6;">
          <h2 style="color: #ef4444;">Spotify Client ID が未設定です</h2>
          <p>まずは <code>.env.local</code> の <code>SPOTIFY_CLIENT_ID</code> と <code>SPOTIFY_CLIENT_SECRET</code> に、Spotify Developer Dashboardで取得した値を設定してください。</p>
          <p>設定後、開発サーバーを再起動して再度このページにアクセスしてください。</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // リクエストヘッダーから実際のHostを取得 (127.0.0.1:3000 等)
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  
  // SPOTIFY_REDIRECT_URI が明示設定されていればそれを最優先、なければリクエスト元から算出
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${proto}://${host}/api/spotify/callback`;

  console.log(`[Spotify OAuth] Redirect URI being sent to Spotify: ${redirectUri}`);

  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('show_dialog', 'true');

  return NextResponse.redirect(authUrl.toString());
}
