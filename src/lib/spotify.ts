// ==============================================================================
// Spotify API ヘルパー
// ==============================================================================

import { SpotifyTrack } from '@/types';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=5';
const PLAYER_ENDPOINT = 'https://api.spotify.com/v1/me/player';

// メモリ内トークンキャッシュ
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// メモリ内最近再生した曲キャッシュ
let inMemoryRecentTracks: SpotifyTrack[] = [];

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
 * 最近再生した曲を取得 (API または メモリキャッシュ)
 */
export async function getRecentlyPlayed(): Promise<SpotifyTrack[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return inMemoryRecentTracks;

  try {
    const res = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (res.status === 401) {
      invalidateCachedToken();
      const retryToken = await getAccessToken();
      if (!retryToken) return inMemoryRecentTracks;
      const retryRes = await fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: { Authorization: `Bearer ${retryToken}` },
        cache: 'no-store',
      });
      return parseRecentlyPlayedResponse(retryRes);
    }

    return parseRecentlyPlayedResponse(res);
  } catch (err) {
    console.error('Error fetching recently played tracks:', err);
    return inMemoryRecentTracks;
  }
}

async function parseRecentlyPlayedResponse(res: Response): Promise<SpotifyTrack[]> {
  if (!res.ok) {
    return inMemoryRecentTracks;
  }
  try {
    const data = await res.json();
    if (!data || !data.items || !Array.isArray(data.items)) {
      return inMemoryRecentTracks;
    }

    const apiTracks: SpotifyTrack[] = data.items.map((item: any) => {
      const t = item.track;
      return {
        id: t.id,
        name: t.name,
        artists: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        album: t.album?.name || '',
        albumArtUrl: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url,
        isPlaying: false,
        progressMs: 0,
        durationMs: t.duration_ms || 0,
        uri: t.uri,
        externalUrl: t.external_urls?.spotify,
      };
    });

    // メモリキャッシュと結合し重複排除
    const combined = [...apiTracks, ...inMemoryRecentTracks];
    const unique = combined.filter((t, index, self) =>
      index === self.findIndex((o) => (o.id && o.id === t.id) || (o.name === t.name && o.artists === t.artists))
    );
    inMemoryRecentTracks = unique.slice(0, 10);
    return inMemoryRecentTracks;
  } catch (e) {
    console.error('Failed to parse recently played response:', e);
    return inMemoryRecentTracks;
  }
}

/**
 * 現在再生中の楽曲情報を取得
 */
export async function getNowPlaying() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { status: 'unconfigured' as const, recentTracks: [] };
  }

  const res = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  let result;
  if (res.status === 401) {
    invalidateCachedToken();
    const retryToken = await getAccessToken();
    if (!retryToken) {
      return { status: 'error' as const, error: 'Token refresh failed', recentTracks: inMemoryRecentTracks };
    }
    const retryRes = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${retryToken}`,
      },
      cache: 'no-store',
    });
    result = await parsePlayerResponse(retryRes);
  } else {
    result = await parsePlayerResponse(res);
  }

  // 待機中または再生中問わず、直近の再生履歴を付与
  const recentTracks = await getRecentlyPlayed();

  return {
    ...result,
    recentTracks: recentTracks.slice(0, 5),
  };
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
    const track: SpotifyTrack = {
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
      uri: song.item.uri,
      externalUrl: song.item.external_urls?.spotify,
    };

    // 再生中トラックを直近履歴の先頭に追加
    inMemoryRecentTracks = [
      track,
      ...inMemoryRecentTracks.filter((t) => t.id !== track.id && t.name !== track.name),
    ].slice(0, 10);

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
 * uri を渡すことで特定のトラックを直接再生可能
 */
export async function controlPlayer(command: 'play' | 'pause' | 'next' | 'previous', uri?: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not configured' };
  }

  let endpoint = `${PLAYER_ENDPOINT}/${command}`;
  let method = 'POST';
  let body: string | undefined = undefined;

  if (command === 'play') {
    method = 'PUT';
    if (uri) {
      body = JSON.stringify({ uris: [uri] });
    }
  } else if (command === 'pause') {
    method = 'PUT';
  }

  const makeRequest = async (token: string) => {
    return fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body } : {}),
    });
  };

  try {
    let res = await makeRequest(accessToken);

    if (res.status === 401) {
      invalidateCachedToken();
      const retryToken = await getAccessToken();
      if (retryToken) {
        res = await makeRequest(retryToken);
      }
    }

    return { success: res.ok };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
