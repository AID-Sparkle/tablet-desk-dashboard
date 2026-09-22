// ==============================================================================
// Spotify API ヘルパー
// ==============================================================================

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const PLAYER_ENDPOINT = 'https://api.spotify.com/v1/me/player';

// メモリ内トークンキャッシュ
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Basic認証ヘッダーを取得
 */
function getBasicAuthHeader(): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

/**
 * リフレッシュトークンを使用してアクセストークンを取得・更新
 */
export async function getAccessToken(): Promise<string | null> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return null;
  }

  // キャッシュが有効な場合はキャッシュを返す（期限切れの60秒前まで有効とみなす）
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${getBasicAuthHeader()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh Spotify token:', response.status, errorText);
      cachedAccessToken = null;
      return null;
    }

    const data = await response.json();
    cachedAccessToken = data.access_token;
    // 有効期限 (秒) を現在時刻に加算
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    return cachedAccessToken;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    cachedAccessToken = null;
    return null;
  }
}

/**
 * キャッシュされたトークンを無効化（401発生時のリセット用）
 */
export function invalidateCachedToken(): void {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}

/**
 * 現在再生中の楽曲情報を取得
 */
export async function getNowPlaying() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { status: 'unconfigured' as const };
  }

  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  // 401 Unauthorized の場合はトークンを再取得して一度だけリトライ
  if (res.status === 401) {
    invalidateCachedToken();
    const retryToken = await getAccessToken();
    if (!retryToken) {
      return { status: 'error' as const, error: 'Token refresh failed' };
    }
    const retryRes = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${retryToken}`,
      },
      cache: 'no-store',
    });
    return parsePlayerResponse(retryRes);
  }

  return parsePlayerResponse(res);
}

/**
 * Spotifyのレスポンスを整形
 */
async function parsePlayerResponse(res: Response) {
  if (res.status === 204 || res.status > 400) {
    // 204: 再生中の曲なし（デバイスが停止または非アクティブ）
    return { status: 'no_device' as const };
  }

  try {
    const song = await res.json();
    if (!song || !song.item) {
      return { status: 'no_device' as const };
    }

    const isPlaying = song.is_playing;
    const track = {
      id: song.item.id,
      name: song.item.name,
      artists: song.item.artists?.map((_artist: any) => _artist.name).join(', ') || 'Unknown Artist',
      album: song.item.album?.name || '',
      albumArtUrl: song.item.album?.images?.[0]?.url || song.item.album?.images?.[1]?.url,
      isPlaying,
      progressMs: song.progress_ms || 0,
      durationMs: song.item.duration_ms || 0,
      deviceName: song.device?.name,
      deviceType: song.device?.type,
    };

    return {
      status: 'connected' as const,
      track,
    };
  } catch (err) {
    console.error('Error parsing Spotify response:', err);
    return { status: 'error' as const, error: 'JSON parse error' };
  }
}

/**
 * プレイヤー操作（play, pause, next, previous）
 */
export async function controlPlayer(command: 'play' | 'pause' | 'next' | 'previous') {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not configured' };
  }

  let endpoint = `${PLAYER_ENDPOINT}/${command}`;
  let method = 'POST';

  if (command === 'play' || command === 'pause') {
    method = 'PUT';
  }

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      invalidateCachedToken();
      const retryToken = await getAccessToken();
      if (retryToken) {
        await fetch(endpoint, {
          method,
          headers: { Authorization: `Bearer ${retryToken}` },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
