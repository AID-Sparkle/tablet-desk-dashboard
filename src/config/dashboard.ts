// ==============================================================================
// ダッシュボード共通設定
// ==============================================================================

export const DASHBOARD_CONFIG = {
  // 画面自動ローテーション間隔（ミリ秒）
  rotationIntervalMs: Number(process.env.NEXT_PUBLIC_ROTATION_INTERVAL) || 30_000,

  // 焼き付き防止ピクセルシフトの最大オフセット量（px）
  pixelShiftPx: Number(process.env.NEXT_PUBLIC_PIXEL_SHIFT_PX) || 12,

  // 天気予報のデフォルト位置情報（栃木県宇都宮市）
  weather: {
    latitude: process.env.WEATHER_LATITUDE || '36.5658',
    longitude: process.env.WEATHER_LONGITUDE || '139.8836',
    cityName: process.env.WEATHER_CITY_NAME || '宇都宮',
    // フロントエンド再取得間隔 (10分)
    refreshIntervalMs: 10 * 60 * 1000,
  },

  // Spotify ポーリング間隔
  spotify: {
    activePollingMs: 5_000,   // 再生中 (5秒)
    idlePollingMs: 25_000,    // 停止中・未再生 (25秒)
  },

  // RSS ニュース再取得間隔 (15分)
  rss: {
    refreshIntervalMs: 15 * 60 * 1000,
  },
};
