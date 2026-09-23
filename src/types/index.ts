// ==============================================================================
// 共通型定義 (Types)
// ==============================================================================

// 画面表示モード (State Machine)
// State A: 統合ダッシュボード (時計・天気・ミニプレイヤー・ヘッドライン)
// State B: Spotify フルフォーカス
// State C: ニュース/RSS フルフォーカス
export type ViewMode = 'A' | 'B' | 'C';

// ------------------------------------------------------------------------------
// 天気データ型 (Open-Meteo)
// ------------------------------------------------------------------------------
export interface HourlyForecast {
  time: string; // "14:00"
  temp: number; // 21.5
  weatherCode: number;
  precipitationProbability: number;
}

export interface DailyForecast {
  date: string; // "9/23 (水)"
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
}

export interface WeatherData {
  cityName: string;
  currentTemp: number;
  apparentTemp: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  tempMax: number;
  tempMin: number;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Spotify データ型
// ------------------------------------------------------------------------------
export type SpotifyStatus =
  | 'loading'
  | 'connected'
  | 'no_device'
  | 'unconfigured'
  | 'error'
  | 'offline';

export interface SpotifyTrack {
  id?: string;
  name: string;
  artists: string;
  album: string;
  albumArtUrl?: string;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  deviceName?: string;
  deviceType?: string;
}

export interface SpotifyApiResponse {
  status: SpotifyStatus;
  track?: SpotifyTrack;
  error?: string;
}

// ------------------------------------------------------------------------------
// RSS / ニュースデータ型
// ------------------------------------------------------------------------------
export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  sourceName: string;
  category: string;
  imageUrl?: string;
  description?: string;
}

export interface RssApiResponse {
  items: NewsItem[];
  sourcesTotal: number;
  sourcesSuccess: number;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// ピクセルシフト座標型 (焼き付き防止)
// ------------------------------------------------------------------------------
export interface PixelShiftOffset {
  x: number;
  y: number;
}

// ------------------------------------------------------------------------------
// SwitchBot 温湿度計データ型
// ------------------------------------------------------------------------------
export interface SwitchBotMeterData {
  temperature: number; // 室温 (℃)
  humidity: number;    // 湿度 (%)
  battery?: number;    // バッテリー残量 (%)
  deviceName?: string; // デバイス名 (例: "デスク温湿度計")
  updatedAt: string;
}

