'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Music,
  Newspaper,
  Pause,
  PauseCircle,
  Play,
  PlayCircle,
  Settings,
  ShieldCheck,
  SkipForward,
  Wifi,
  WifiOff,
  X,
  ExternalLink,
  MapPin,
  Clock,
  Languages,
  Search,
  Sliders,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Film,
  FolderOpen,
  RefreshCw,
  Check,
  Home,
  BatteryCharging,
} from 'lucide-react';
import { PixelShifter } from '@/components/PixelShifter';
import { StateA_Dashboard } from '@/components/StateA_Dashboard';
import { StateB_SpotifyFocus } from '@/components/StateB_SpotifyFocus';
import { StateC_NewsFocus } from '@/components/StateC_NewsFocus';
import { BatteryIndicator } from '@/components/BatteryIndicator';
import { MarqueeText } from '@/components/MarqueeText';
import { getSmallWeatherIcon } from '@/components/WeatherWidget';
import { DASHBOARD_CONFIG } from '@/config/dashboard';
import {
  THEME_COLORS,
  ThemeColorId,
  BACKGROUND_PRESETS,
  BackgroundStyleId,
  isVideoSource,
} from '@/config/theme';
import type { LocalWallpaperItem } from '@/app/api/wallpapers/route';
import type { UnsplashDailyWallpaper } from '@/app/api/unsplash-daily/route';
import {
  ViewMode,
  WeatherData,
  SpotifyTrack,
  SpotifyStatus,
  NewsItem,
  PixelShiftOffset,
  SwitchBotMeterData,
  SwitchBotDevice,
} from '@/types';

export default function DashboardPage() {
  // ----------------------------------------------------------------------------
  // State Machine
  // ----------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>('A');
  const [isAutoRotationActive, setIsAutoRotationActive] = useState<boolean>(true);
  const [pixelOffset, setPixelOffset] = useState<PixelShiftOffset>({ x: 0, y: 0 });

  // ----------------------------------------------------------------------------
  // ユーザー設定 (localStorage永続化)
  // ----------------------------------------------------------------------------
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [language, setLanguage] = useState<'en' | 'ja'>('en');
  const [cityInput, setCityInput] = useState<string>('宇都宮');
  const [currentCityName, setCurrentCityName] = useState<string>('宇都宮');
  const [citySearchError, setCitySearchError] = useState<string | null>(null);
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);

  // 新機能: 自動切り替わり秒数 (デフォルト: 30秒)
  const [autoRotationInterval, setAutoRotationInterval] = useState<number>(30);
  // 新機能: リキッドガラス透過率 / 不透明度 (デフォルト: 52%)
  const [glassOpacity, setGlassOpacity] = useState<number>(52);
  // 新機能: テーマカラー (デフォルト: cyan)
  const [themeColor, setThemeColor] = useState<ThemeColorId>('cyan');
  // 新機能: 背景スタイル (デフォルト: orbs)
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyleId>('orbs');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>('');

  // 新機能: バッテリー残量表示 (デフォルト: true)
  const [showBatteryIndicator, setShowBatteryIndicator] = useState<boolean>(true);

  // 新機能: Unsplash日替わり写真データ
  const [unsplashDaily, setUnsplashDaily] = useState<UnsplashDailyWallpaper | null>(null);

  // 新機能: public/ 内の動画・壁紙ファイル一覧
  const [localWallpapers, setLocalWallpapers] = useState<LocalWallpaperItem[]>([]);
  const [isLoadingLocalWallpapers, setIsLoadingLocalWallpapers] = useState<boolean>(false);

  // 画面下部ミニ時計用
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMiniTime = () => {
    if (!currentTime) return '--:--';
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    if (timeFormat === '12h') {
      const isPM = hours >= 12;
      const h12 = (hours % 12 || 12).toString().padStart(2, '0');
      return `${h12}:${minutes} ${isPM ? 'PM' : 'AM'}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // 新機能: SwitchBot 室内温湿度データ & 操作可能デバイス一覧
  const [switchBotMeter, setSwitchBotMeter] = useState<SwitchBotMeterData | null>(null);
  const [switchBotDevices, setSwitchBotDevices] = useState<SwitchBotDevice[]>([]);
  const [isSwitchBotConfigured, setIsSwitchBotConfigured] = useState<boolean>(false);
  const [isSwitchBotLoading, setIsSwitchBotLoading] = useState<boolean>(false);

  // ----------------------------------------------------------------------------
  // データステート
  // ----------------------------------------------------------------------------
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);

  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>('loading');
  const [isSpotifyControlling, setIsSpotifyControlling] = useState<boolean>(false);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // 自動回転タイマー管理用Ref & 最新Spotify再生状態保持Ref
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpotifyPlayingRef = useRef<boolean>(false);

  // ----------------------------------------------------------------------------
  // 0. ローカルストレージ設定の読み込み
  // ----------------------------------------------------------------------------
  useEffect(() => {
    try {
      const savedTimeFormat = localStorage.getItem('desk_time_format');
      if (savedTimeFormat === '12h' || savedTimeFormat === '24h') {
        setTimeFormat(savedTimeFormat);
      }
      const savedLang = localStorage.getItem('desk_language');
      if (savedLang === 'en' || savedLang === 'ja') {
        setLanguage(savedLang);
      }
      const savedCity = localStorage.getItem('desk_city_name');
      if (savedCity) {
        setCityInput(savedCity);
        setCurrentCityName(savedCity);
      }
      const savedInterval = localStorage.getItem('desk_rotation_interval');
      if (savedInterval) {
        const val = parseInt(savedInterval, 10);
        if (!isNaN(val) && val >= 5 && val <= 300) {
          setAutoRotationInterval(val);
        }
      }
      const savedOpacity = localStorage.getItem('desk_glass_opacity');
      if (savedOpacity) {
        const val = parseInt(savedOpacity, 10);
        if (!isNaN(val) && val >= 10 && val <= 95) {
          setGlassOpacity(val);
        }
      }
      const savedTheme = localStorage.getItem('desk_theme_color');
      if (savedTheme && savedTheme in THEME_COLORS) {
        setThemeColor(savedTheme as ThemeColorId);
      }
      const savedBg = localStorage.getItem('desk_background_style');
      if (savedBg) {
        setBackgroundStyle(savedBg as BackgroundStyleId);
      }
      const savedCustomBg = localStorage.getItem('desk_custom_wallpaper');
      if (savedCustomBg) {
        setCustomWallpaperUrl(savedCustomBg);
      }
      const savedBattery = localStorage.getItem('desk_show_battery');
      if (savedBattery !== null) {
        setShowBatteryIndicator(savedBattery === 'true');
      }
      const savedRecent = localStorage.getItem('desk_spotify_recent_tracks');
      if (savedRecent) {
        try {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) {
            setRecentTracks(parsed);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ----------------------------------------------------------------------------
  // 0.1 CSS変数のリアルタイム適用 (リキッドガラス透過率 & テーマカラー)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // リキッドガラス不透明度 (0.15 〜 0.90)
    root.style.setProperty('--glass-opacity', (glassOpacity / 100).toFixed(2));

    // テーマカラー
    const config = THEME_COLORS[themeColor] || THEME_COLORS.cyan;
    root.style.setProperty('--theme-accent', config.accent);
    root.style.setProperty('--theme-accent-dim', config.accentDim);
    root.style.setProperty('--theme-accent-border', config.accentBorder);
    root.style.setProperty('--theme-accent-glow', config.accentGlow);
  }, [glassOpacity, themeColor]);

  // ----------------------------------------------------------------------------
  // 1. オフライン / オンライン監視
  // ----------------------------------------------------------------------------
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ----------------------------------------------------------------------------
  // 2. ピクセルシフト更新関数（焼き付き防止: ±10〜12pxのランダム微小移動）
  // ----------------------------------------------------------------------------
  const applyNextPixelShift = useCallback(() => {
    const maxPx = DASHBOARD_CONFIG.pixelShiftPx;
    const x = Math.floor(Math.random() * (maxPx * 2 + 1)) - maxPx;
    const y = Math.floor(Math.random() * (maxPx * 2 + 1)) - maxPx;
    setPixelOffset({ x, y });
  }, []);

  // ----------------------------------------------------------------------------
  // 3. データフェッチ関数群
  // ----------------------------------------------------------------------------
  // 天気取得 (Open-Meteo)
  const fetchWeather = useCallback(async (cityNameQuery?: string) => {
    const targetCity = cityNameQuery || currentCityName;
    try {
      const url = targetCity
        ? `/api/weather?searchCity=${encodeURIComponent(targetCity)}`
        : '/api/weather';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [currentCityName]);

  // 地名変更のハンドラ
  const handleApplyCity = async () => {
    if (!cityInput.trim()) return;
    setIsSearchingCity(true);
    setCitySearchError(null);
    try {
      const res = await fetch(`/api/weather?searchCity=${encodeURIComponent(cityInput.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data.cityName) {
        setWeather(data);
        setCurrentCityName(data.cityName);
        try {
          localStorage.setItem('desk_city_name', data.cityName);
        } catch {}
      }
    } catch (e: any) {
      setCitySearchError(language === 'en' ? 'Location not found' : '地点が見つかりませんでした');
    } finally {
      setIsSearchingCity(false);
    }
  };

  // ニュース取得 (RSS)
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/rss');
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setNews(data.items);
        }
      }
    } catch (e) {
      console.error('News fetch error:', e);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  // Spotify再生状況取得
  const fetchSpotifyNowPlaying = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/now-playing');
      if (res.ok) {
        const data = await res.json();
        setSpotifyStatus(data.status);
        const currentTrack: SpotifyTrack | null = data.track || null;
        setSpotifyTrack(currentTrack);

        // APIから返された最近再生した曲リストがあればマージ
        const apiRecent: SpotifyTrack[] = data.recentTracks || [];
        setRecentTracks((prev) => {
          let merged = [...prev];
          // もし再生中の曲があれば、先頭に最新曲として追加
          if (currentTrack) {
            merged = [
              currentTrack,
              ...merged.filter((t) => t.id !== currentTrack.id && t.name !== currentTrack.name),
            ];
          }
          // APIからの履歴を追加（未登録のもの）
          for (const item of apiRecent) {
            if (!merged.some((m) => m.id === item.id || (m.name === item.name && m.artists === item.artists))) {
              merged.push(item);
            }
          }
          const sliced = merged.slice(0, 10);
          try {
            localStorage.setItem('desk_spotify_recent_tracks', JSON.stringify(sliced));
          } catch {
            // ignore
          }
          return sliced;
        });
      }
    } catch (e) {
      console.error('Spotify fetch error:', e);
      setSpotifyStatus('error');
    }
  }, []);

  // Spotify操作 (play, pause, next, previous) または特定曲URI再生
  const handleSpotifyControl = async (
    command: 'play' | 'pause' | 'next' | 'previous',
    uri?: string
  ) => {
    setIsSpotifyControlling(true);
    try {
      await fetch('/api/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, uri }),
      });
      // 操作直後に最新状態を即時反映（イベント駆動）
      setTimeout(() => {
        fetchSpotifyNowPlaying();
      }, 350);
    } catch (e) {
      console.error('Spotify control failed:', e);
    } finally {
      setIsSpotifyControlling(false);
    }
  };

  // Unsplash日替わり写真の取得
  const fetchUnsplashDaily = useCallback(async () => {
    try {
      const res = await fetch('/api/unsplash-daily');
      if (res.ok) {
        const data = await res.json();
        setUnsplashDaily(data);
      }
    } catch (e) {
      console.error('Failed to fetch Unsplash daily wallpaper:', e);
    }
  }, []);

  // ローカル動画・壁紙一覧の取得 (public/ フォルダ内をスキャン)
  const fetchLocalWallpapers = useCallback(async () => {
    setIsLoadingLocalWallpapers(true);
    try {
      const res = await fetch('/api/wallpapers');
      if (res.ok) {
        const data = await res.json();
        setLocalWallpapers(data.wallpapers || []);
      }
    } catch (e) {
      console.error('Failed to fetch local wallpapers:', e);
    } finally {
      setIsLoadingLocalWallpapers(false);
    }
  }, []);

  // SwitchBot 室内温湿度データ & 操作可能デバイス一覧の取得
  const fetchSwitchBotMeter = useCallback(async () => {
    setIsSwitchBotLoading(true);
    try {
      const res = await fetch('/api/switchbot');
      if (res.ok) {
        const json = await res.json();
        setIsSwitchBotConfigured(json.configured ?? false);
        if (json.data) {
          setSwitchBotMeter(json.data);
        }
        if (json.devices && Array.isArray(json.devices)) {
          setSwitchBotDevices(json.devices);
        }
      }
    } catch (e) {
      console.warn('SwitchBot fetch error:', e);
    } finally {
      setIsSwitchBotLoading(false);
    }
  }, []);

  // SwitchBot デバイス操作 (プラグ/ボット/照明など)
  const handleControlSwitchBotDevice = async (
    deviceId: string,
    command: 'turnOn' | 'turnOff'
  ): Promise<boolean> => {
    try {
      // 楽観的UI更新（powerStateの即時切り替え）
      setSwitchBotDevices((prev) =>
        prev.map((d) => {
          if (d.deviceId === deviceId) {
            const nextPower: 'on' | 'off' = command === 'turnOn' ? 'on' : 'off';
            return { ...d, powerState: nextPower };
          }
          return d;
        })
      );

      const res = await fetch('/api/switchbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, command }),
      });

      if (res.ok) {
        // デバイス側の反映ラグを考慮し1秒後に最新状態を取得
        setTimeout(() => {
          fetchSwitchBotMeter();
        }, 1000);
        return true;
      }
      return false;
    } catch (e) {
      console.error('SwitchBot device control error:', e);
      return false;
    }
  };

  // ----------------------------------------------------------------------------
  // 4. 初回取得 & 定期ポーリング
  // ----------------------------------------------------------------------------
  useEffect(() => {
    fetchWeather();
    fetchNews();
    fetchSpotifyNowPlaying();
    fetchUnsplashDaily();
    fetchLocalWallpapers();
    fetchSwitchBotMeter();

    const weatherTimer = setInterval(() => fetchWeather(), DASHBOARD_CONFIG.weather.refreshIntervalMs);
    const newsTimer = setInterval(fetchNews, DASHBOARD_CONFIG.rss.refreshIntervalMs);
    const switchBotTimer = setInterval(fetchSwitchBotMeter, 60000); // 60秒ポーリング

    return () => {
      clearInterval(weatherTimer);
      clearInterval(newsTimer);
      clearInterval(switchBotTimer);
    };
  }, [fetchWeather, fetchNews, fetchSpotifyNowPlaying, fetchUnsplashDaily, fetchLocalWallpapers, fetchSwitchBotMeter]);

  // Spotifyポーリング（再生中: 5秒、停止中: 25秒）
  useEffect(() => {
    const isPlaying = spotifyTrack?.isPlaying ?? false;
    const interval = isPlaying
      ? DASHBOARD_CONFIG.spotify.activePollingMs
      : DASHBOARD_CONFIG.spotify.idlePollingMs;

    const timer = setInterval(() => {
      fetchSpotifyNowPlaying();
    }, interval);

    return () => clearInterval(timer);
  }, [spotifyTrack?.isPlaying, fetchSpotifyNowPlaying]);

  // ----------------------------------------------------------------------------
  // 5. 画面自動ローテーション (設定秒数きっちり維持するタイマー管理)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    isSpotifyPlayingRef.current = Boolean(spotifyTrack && spotifyTrack.isPlaying);
  }, [spotifyTrack?.isPlaying]);

  const resetRotationSchedule = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    if (!isAutoRotationActive) return;

    rotationTimerRef.current = setInterval(() => {
      setViewMode((prev) => {
        let next: ViewMode = 'A';
        const isPlaying = isSpotifyPlayingRef.current;
        // Spotifyで再生中の曲がない場合はState Bをスキップし、A ⇄ C のみ自動切替
        if (prev === 'A') {
          next = isPlaying ? 'B' : 'C';
        } else if (prev === 'B') {
          next = 'C';
        } else if (prev === 'C') {
          next = 'A';
        }
        return next;
      });
      applyNextPixelShift();
    }, autoRotationInterval * 1000);
  }, [isAutoRotationActive, autoRotationInterval, applyNextPixelShift]);

  useEffect(() => {
    resetRotationSchedule();
    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [resetRotationSchedule]);

  // 手動で画面を切り替えた時のハンドラ (※切り替えから設定秒数きっちり維持)
  const handleManualSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    applyNextPixelShift();
    // タイマーを即時リセットし、今からきっちり指定秒数後に次の切り替えをスケジュール
    resetRotationSchedule();
  };

  // 設定保存ハンドラ群
  const handleToggleTimeFormat = (format: '12h' | '24h') => {
    setTimeFormat(format);
    try {
      localStorage.setItem('desk_time_format', format);
    } catch {}
  };

  const handleToggleLanguage = (lang: 'en' | 'ja') => {
    setLanguage(lang);
    try {
      localStorage.setItem('desk_language', lang);
    } catch {}
  };

  const handleToggleBattery = (show: boolean) => {
    setShowBatteryIndicator(show);
    try {
      localStorage.setItem('desk_show_battery', String(show));
    } catch {}
  };

  // アクティブな背景プリセット
  const activeBgPreset = BACKGROUND_PRESETS.find((p) => p.id === backgroundStyle);
  const activeWallpaperUrl =
    backgroundStyle === 'custom'
      ? customWallpaperUrl
      : backgroundStyle === 'unsplash_daily'
      ? (unsplashDaily?.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80')
      : activeBgPreset?.url;

  const handleUpdateInterval = (sec: number) => {
    setAutoRotationInterval(sec);
    try {
      localStorage.setItem('desk_rotation_interval', sec.toString());
    } catch {}
  };

  const handleUpdateGlassOpacity = (val: number) => {
    setGlassOpacity(val);
    try {
      localStorage.setItem('desk_glass_opacity', val.toString());
    } catch {}
  };

  const handleUpdateThemeColor = (themeId: ThemeColorId) => {
    setThemeColor(themeId);
    try {
      localStorage.setItem('desk_theme_color', themeId);
    } catch {}
  };

  const handleUpdateBackgroundStyle = (bgId: BackgroundStyleId) => {
    setBackgroundStyle(bgId);
    try {
      localStorage.setItem('desk_background_style', bgId);
    } catch {}
  };

  const handleUpdateCustomWallpaper = (url: string) => {
    setCustomWallpaperUrl(url);
    try {
      localStorage.setItem('desk_custom_wallpaper', url);
    } catch {}
  };

  // ----------------------------------------------------------------------------
  // レンダリング
  // ----------------------------------------------------------------------------
  return (
    <main className="relative h-screen w-screen bg-[#060810] text-slate-100 overflow-hidden flex flex-col justify-between select-none">
      {/* ========================================================================
          背景: 壁紙画像 / MP4動画ループ (Unsplash/カスタム) + 遮光オーバーレイ + 有機的アンビエントオーブ
      ======================================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* 動画壁紙レイヤー (MP4 / WebM ループ再生) */}
        {activeWallpaperUrl && isVideoSource(activeWallpaperUrl, activeBgPreset) ? (
          <video
            key={activeWallpaperUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105"
          >
            <source src={activeWallpaperUrl} type="video/mp4" />
          </video>
        ) : activeWallpaperUrl ? (
          /* 静止画壁紙レイヤー (Unsplash / カスタム画像) */
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
            style={{ backgroundImage: `url(${activeWallpaperUrl})` }}
          />
        ) : null}

        {/* 遮光オーバーレイ (背景写真・動画がある場合は暗さを重ねて前面テキストの可読性を確保) */}
        {activeWallpaperUrl && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] transition-all duration-1000" />
        )}

        {/* 有機的アンビエントオーブ (写真の上でもほのかに輝き、リキッドガラスのすりガラス感を最大化) */}
        <div
          className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
            activeWallpaperUrl ? 'opacity-35' : 'opacity-100'
          }`}
        >
          <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/15 blur-[120px] animate-orb-1" />
          <div className="absolute top-[20%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[130px] animate-orb-2" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/10 blur-[140px]" />
        </div>
      </div>

      {/* ========================================================================
          メインコンテンツ (焼き付き防止ピクセルシフター & 滑らかな1000msクロスフェード)
      ======================================================================== */}
      <PixelShifter offset={pixelOffset} className="relative z-10 flex-1 w-full h-[calc(100vh-62px)] p-3 sm:p-4 overflow-hidden">
        {/* State A: 統合ダッシュボード */}
        <div
          className={`absolute inset-3 sm:inset-4 transition-all duration-1000 ease-in-out ${
            viewMode === 'A'
              ? 'opacity-100 scale-100 pointer-events-auto z-10'
              : 'opacity-0 scale-[0.985] pointer-events-none z-0'
          }`}
        >
          <StateA_Dashboard
            weather={weather}
            isWeatherLoading={isWeatherLoading}
            spotifyTrack={spotifyTrack}
            spotifyStatus={spotifyStatus}
            recentTracks={recentTracks}
            onSpotifyControl={handleSpotifyControl}
            isSpotifyControlling={isSpotifyControlling}
            news={news}
            isNewsLoading={isNewsLoading}
            isOnline={isOnline}
            timeFormat={timeFormat}
            language={language}
            indoorData={switchBotMeter}
            switchBotDevices={switchBotDevices}
            onControlSwitchBotDevice={handleControlSwitchBotDevice}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        </div>

        {/* State B: Spotify フルフォーカス */}
        <div
          className={`absolute inset-3 sm:inset-4 transition-all duration-1000 ease-in-out ${
            viewMode === 'B'
              ? 'opacity-100 scale-100 pointer-events-auto z-10'
              : 'opacity-0 scale-[0.985] pointer-events-none z-0'
          }`}
        >
          <StateB_SpotifyFocus
            track={spotifyTrack}
            status={spotifyStatus}
            onControl={handleSpotifyControl}
            isControlling={isSpotifyControlling}
            language={language}
          />
        </div>

        {/* State C: ニュース/RSS フルフォーカス */}
        <div
          className={`absolute inset-3 sm:inset-4 transition-all duration-1000 ease-in-out ${
            viewMode === 'C'
              ? 'opacity-100 scale-100 pointer-events-auto z-10'
              : 'opacity-0 scale-[0.985] pointer-events-none z-0'
          }`}
        >
          <StateC_NewsFocus
            news={news}
            isLoading={isNewsLoading}
            onRefresh={fetchNews}
            language={language}
          />
        </div>
      </PixelShifter>

      {/* ========================================================================
          画面下部: iOSリキッドガラス ナビゲーション & 再生中ミニプレイヤーバー (固定高さ 62px)
      ======================================================================== */}
      <footer className="relative z-30 h-[62px] liquid-glass border-x-0 border-b-0 border-t border-white/10 px-2.5 sm:px-5 grid grid-cols-[1fr_auto_1fr] items-center shrink-0">
        {/* 左側: 再生中Spotifyミニプレイヤー または ミニ時計＆天気ピル */}
        <div className="flex items-center w-full min-w-0 h-full overflow-hidden">
          {/* Spotify 再生中ミニプレイヤー (State B 以外のときに表示) */}
          {spotifyTrack && viewMode !== 'B' && (
            <div
              onClick={() => handleManualSwitch('B')}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pr-1.5 sm:pr-2 rounded-2xl liquid-glass-pill hover:bg-white/10 cursor-pointer transition-all w-[135px] sm:w-[165px] lg:w-[185px] group shrink-0"
              title={language === 'en' ? 'Click to open Spotify full view' : 'クリックでSpotify大画面に切り替え'}
            >
              {/* サムネイル */}
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/15">
                {spotifyTrack.albumArtUrl ? (
                  <img
                    src={spotifyTrack.albumArtUrl}
                    alt=""
                    className={`w-full h-full object-cover ${spotifyTrack.isPlaying ? 'scale-105' : 'scale-100'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* 曲名 & アーティスト (入りきらない場合は電光掲示板のようにシームレススライド) */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <MarqueeText
                  text={spotifyTrack.name}
                  className="text-[11px] sm:text-xs font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight"
                />
                <MarqueeText
                  text={spotifyTrack.artists}
                  className="text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5"
                />
              </div>

              {/* イコライザーバー (再生中のみ・大画面のみ表示してタブレットの曲名領域を確保) */}
              {spotifyTrack.isPlaying && (
                <div className="hidden xl:flex items-end gap-0.5 h-3 shrink-0 ml-0.5">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-1" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-3" />
                </div>
              )}

              {/* 一時停止 / 再開ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpotifyControl(spotifyTrack.isPlaying ? 'pause' : 'play');
                }}
                disabled={isSpotifyControlling}
                className="p-1 rounded-lg hover:bg-white/15 text-slate-200 hover:text-white transition-all shrink-0"
              >
                {spotifyTrack.isPlaying ? (
                  <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                ) : (
                  <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                )}
              </button>

              {/* 次の曲 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpotifyControl('next');
                }}
                disabled={isSpotifyControlling}
                className="hidden sm:block p-1 rounded-lg hover:bg-white/15 text-slate-200 hover:text-white transition-all shrink-0"
              >
                <SkipForward className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </button>
            </div>
          )}

          {/* NEWSタブでSpotify再生UIと時間天気UIが両方ある場合の均等スペーサー 1 */}
          {spotifyTrack && viewMode === 'C' && (
            <div className="flex-1 min-w-2" />
          )}

          {/* 【新機能】Spotify (State B) や NEWS (State C) 画面用: 下部ミニ時間＆天気・気温表示 (見切れ完全防止スリム設計) */}
          {(viewMode === 'B' || viewMode === 'C') && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl liquid-glass-pill border border-white/10 shrink-0 shadow-sm animate-fadeIn">
              {/* 時計 (12h/24h対応) */}
              <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold text-white shrink-0">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--theme-accent, #22d3ee)' }} />
                <span>{formatMiniTime()}</span>
              </div>

              {/* 区切りバー */}
              <span className="w-px h-3 bg-white/20 shrink-0" />

              {/* 天気アイコン & 気温 */}
              {weather ? (
                <div className="flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
                  {getSmallWeatherIcon(weather.weatherCode)}
                  <span className="font-semibold text-slate-100 tabular-nums">
                    {weather.currentTemp.toFixed(1)}°
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 shrink-0">--°</span>
              )}

              {/* SwitchBot 室内温度 (ワイド画面のみ追加表示、タブレット等では見切れ防止のため非表示) */}
              {switchBotMeter && (
                <div
                  className="hidden xl:flex items-center gap-1 text-[11px] text-emerald-300 shrink-0"
                  title={`室内: ${switchBotMeter.temperature}°C / ${switchBotMeter.humidity}%`}
                >
                  <span className="w-px h-3 bg-white/20 mr-0.5" />
                  <Home className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold tabular-nums text-white">
                    {switchBotMeter.temperature.toFixed(1)}°
                  </span>
                </div>
              )}
            </div>
          )}

          {/* NEWSタブでSpotify再生UIと時間天気UIが両方ある場合の均等スペーサー 2 (中央タブとの間隔をスペーサー1と完全一致させる) */}
          {spotifyTrack && viewMode === 'C' && (
            <div className="flex-1 min-w-2" />
          )}

          {/* State A かつ Spotify非再生時: ネットワーク・ピクセルシフト情報 */}
          {viewMode === 'A' && !spotifyTrack && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 liquid-glass-pill px-2.5 py-1 rounded-full">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline font-mono text-[11px]">ONLINE</span>
                    <Wifi className="w-3 h-3 text-emerald-400 sm:hidden" />
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span className="hidden sm:inline font-mono text-[11px] text-rose-300">OFFLINE</span>
                    <WifiOff className="w-3 h-3 text-rose-400 sm:hidden" />
                  </>
                )}
              </div>

              <div
                className="hidden xl:flex items-center gap-1.5 text-[10px] text-slate-300 liquid-glass-pill px-2.5 py-1 rounded-full"
                title={`Pixel Shift: x=${pixelOffset.x}px, y=${pixelOffset.y}px`}
              >
                <ShieldCheck
                  className="w-3 h-3"
                  style={{ color: 'var(--theme-accent, #22d3ee)' }}
                />
                <span>Shift ({pixelOffset.x}, {pixelOffset.y})</span>
              </div>
            </div>
          )}
        </div>

        {/* 中央: 画面切り替えタブ (中央固定・スリム化で左右との衝突を完全防止) */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 liquid-glass-pill p-1 rounded-2xl shadow-lg z-20 shrink-0">
          <button
            id="tab-main"
            onClick={() => handleManualSwitch('A')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'A'
                ? 'text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
            style={
              viewMode === 'A'
                ? {
                    backgroundColor: 'var(--theme-accent, #22d3ee)',
                    boxShadow: '0 4px 14px var(--theme-accent-glow, rgba(34, 211, 238, 0.4))',
                  }
                : {}
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'MAIN' : 'メイン'}</span>
          </button>

          <button
            id="tab-spotify"
            onClick={() => handleManualSwitch('B')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'B'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'SPOTIFY' : 'Spotify'}</span>
          </button>

          <button
            id="tab-news"
            onClick={() => handleManualSwitch('C')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'C'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'NEWS' : 'ニュース'}</span>
          </button>
        </div>

        {/* 右側: 自動ローテーショントグル & バッテリー & 設定 */}
        <div className="flex items-center gap-1.5 sm:gap-2 z-10 w-full min-w-0 justify-end">
          {/* バッテリー残量インジケーター (対応端末でのみ表示) */}
          {showBatteryIndicator && (
            <BatteryIndicator language={language} />
          )}

          {/* 自動回転 一時停止/再開 (設定秒数にリアルタイム連動) */}
          <button
            onClick={() => setIsAutoRotationActive(!isAutoRotationActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAutoRotationActive
                ? 'liquid-glass-pill'
                : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
            }`}
            style={
              isAutoRotationActive
                ? {
                    color: 'var(--theme-accent, #22d3ee)',
                    borderColor: 'var(--theme-accent-border, rgba(34, 211, 238, 0.35))',
                  }
                : {}
            }
            title={isAutoRotationActive ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isAutoRotationActive ? (
              <>
                <PauseCircle
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--theme-accent, #22d3ee)' }}
                />
                <span className="hidden sm:inline">
                  {language === 'en' ? `${autoRotationInterval}s Auto` : `${autoRotationInterval}s 自動切換`}
                </span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Fixed' : '固定中'}</span>
              </>
            )}
          </button>

          {/* 設定・ヘルプモーダルを開く */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="設定・カスタマイズ"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ========================================================================
          設定 & カスタマイズモーダル (言語設定に関わらず常に完全日本語で分かりやすく表示)
      ======================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="liquid-glass max-w-2xl w-full rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/15">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  ダッシュボード設定
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* モーダル本体 (常に日本語表示) */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm text-slate-200 pr-1">
              {/* 1. 自動切り替わり秒数の変更スライダー */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">
                        画面自動切り替え秒数
                      </span>
                      <span className="text-xs text-slate-400">
                        各画面（メイン・Spotify・ニュース）の滞在秒数
                      </span>
                    </div>
                  </div>
                  <span
                    className="font-mono text-sm font-bold px-3 py-1 rounded-xl liquid-glass-pill"
                    style={{ color: 'var(--theme-accent, #22d3ee)' }}
                  >
                    {autoRotationInterval} 秒
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">10秒</span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={autoRotationInterval}
                    onChange={(e) => handleUpdateInterval(parseInt(e.target.value, 10))}
                    className="flex-1 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                    style={{ accentColor: 'var(--theme-accent, #22d3ee)' }}
                  />
                  <span className="text-xs text-slate-400 font-mono">120秒</span>
                </div>

                {/* クイック選択プリセット */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-slate-400">プリセット:</span>
                  {[15, 30, 45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => handleUpdateInterval(sec)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        autoRotationInterval === sec
                          ? 'text-slate-950 font-bold shadow-sm'
                          : 'liquid-glass-pill text-slate-300 hover:text-white'
                      }`}
                      style={
                        autoRotationInterval === sec
                          ? { backgroundColor: 'var(--theme-accent, #22d3ee)' }
                          : {}
                      }
                    >
                      {sec}秒
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. リキッドガラスの透過率変更スライダー */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">
                        リキッドガラスの透過率
                      </span>
                      <span className="text-xs text-slate-400">
                        すりガラスの濃さ（低いほど背景が透け、高いほど文字重視）
                      </span>
                    </div>
                  </div>
                  <span
                    className="font-mono text-sm font-bold px-3 py-1 rounded-xl liquid-glass-pill"
                    style={{ color: 'var(--theme-accent, #22d3ee)' }}
                  >
                    {glassOpacity}%
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">20% (透明)</span>
                  <input
                    type="range"
                    min={20}
                    max={85}
                    step={5}
                    value={glassOpacity}
                    onChange={(e) => handleUpdateGlassOpacity(parseInt(e.target.value, 10))}
                    className="flex-1 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                    style={{ accentColor: 'var(--theme-accent, #22d3ee)' }}
                  />
                  <span className="text-xs text-slate-400 font-mono">85% (濃密)</span>
                </div>

                {/* クイック選択プリセット */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-slate-400">スタイル:</span>
                  {[
                    { label: '30% クリア', val: 30 },
                    { label: '52% 標準', val: 52 },
                    { label: '70% くっきり', val: 70 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => handleUpdateGlassOpacity(p.val)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                        glassOpacity === p.val
                          ? 'text-slate-950 font-bold shadow-sm'
                          : 'liquid-glass-pill text-slate-300 hover:text-white'
                      }`}
                      style={
                        glassOpacity === p.val
                          ? { backgroundColor: 'var(--theme-accent, #22d3ee)' }
                          : {}
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. アプリのテーマカラーの変更設定 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      アプリのテーマカラー
                    </span>
                    <span className="text-xs text-slate-400">
                      時計、秒針、インジケーター等のアクセントカラーを変更
                    </span>
                  </div>
                </div>

                {/* カラーパレット選択 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(THEME_COLORS) as ThemeColorId[]).map((id) => {
                    const theme = THEME_COLORS[id];
                    const isSelected = themeColor === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleUpdateThemeColor(id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all border text-left cursor-pointer ${
                          isSelected
                            ? 'liquid-glass font-bold shadow-lg scale-102'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: theme.accent,
                                boxShadow: `0 0 16px ${theme.accentGlow}`,
                              }
                            : {}
                        }
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-white/25"
                          style={{
                            backgroundColor: theme.accent,
                            boxShadow: `0 0 8px ${theme.accentGlow}`,
                            forcedColorAdjust: 'none',
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs block truncate">
                            {theme.nameJa}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 背景壁紙スタイル (Unsplash / PC壁紙 / MP4動画 / オーブ) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      背景スタイル (壁紙・MP4動画ループ)
                    </span>
                    <span className="text-xs text-slate-400">
                      Unsplash写真やMP4動画ループで、すりガラスの立体感をさらに向上
                    </span>
                  </div>
                </div>

                {/* プリセット選択ボタン一覧 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BACKGROUND_PRESETS.map((preset) => {
                    const isSelected = backgroundStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleUpdateBackgroundStyle(preset.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'liquid-glass text-white font-bold shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--theme-accent, #22d3ee)',
                                boxShadow: '0 0 12px var(--theme-accent-glow, rgba(34, 211, 238, 0.4))',
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {preset.id === 'custom' ? (
                            <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : preset.id === 'unsplash_daily' ? (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span
                              className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${preset.previewGradient} shrink-0 border border-white/20`}
                            />
                          )}
                          <span className="text-xs truncate">
                            {preset.nameJa}
                          </span>
                        </div>
                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: 'var(--theme-accent, #22d3ee)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 1. Unsplash日替わり写真 情報カード (unsplash_daily選択時) */}
                {backgroundStyle === 'unsplash_daily' && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        本日のUnsplash日替わり風景
                      </span>
                      <button
                        onClick={fetchUnsplashDaily}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] liquid-glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="日替わり壁紙を更新"
                      >
                        <RefreshCw className="w-3 h-3 text-emerald-400" />
                        <span>更新</span>
                      </button>
                    </div>

                    {unsplashDaily ? (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-white/15">
                          <img
                            src={unsplashDaily.url}
                            alt={unsplashDaily.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {unsplashDaily.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Photo by{' '}
                            <span className="text-emerald-300 font-medium">
                              {unsplashDaily.photographer}
                            </span>{' '}
                            on Unsplash
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            毎日深夜0時に自動で新しい風景に切り替わります
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">本日の壁紙を読み込み中...</p>
                    )}
                  </div>
                )}

                {/* 2. ローカル動画・画像一覧 (custom選択時: 一覧から選ぶだけで適用) */}
                {backgroundStyle === 'custom' && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-semibold text-white">
                          ローカル動画・壁紙一覧 (public/ フォルダ内)
                        </span>
                      </div>
                      <button
                        onClick={fetchLocalWallpapers}
                        disabled={isLoadingLocalWallpapers}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] liquid-glass-pill text-cyan-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        title="フォルダ内を再スキャン"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingLocalWallpapers ? 'animate-spin' : ''}`} />
                        <span>再スキャン</span>
                      </button>
                    </div>

                    {/* ファイル一覧リスト（クリックするだけで即座に選択） */}
                    {localWallpapers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {localWallpapers.map((file) => {
                          const isSelected = customWallpaperUrl === file.url;
                          return (
                            <button
                              key={file.url}
                              onClick={() => handleUpdateCustomWallpaper(file.url)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group ${
                                isSelected
                                  ? 'liquid-glass text-white font-bold shadow-md'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: 'var(--theme-accent, #22d3ee)',
                                      boxShadow: '0 0 12px var(--theme-accent-glow, rgba(34, 211, 238, 0.4))',
                                    }
                                  : {}
                              }
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className="p-1.5 rounded-lg shrink-0"
                                  style={{
                                    backgroundColor: isSelected
                                      ? 'var(--theme-accent-dim, rgba(34, 211, 238, 0.15))'
                                      : 'rgba(255,255,255,0.06)',
                                    color: isSelected ? 'var(--theme-accent, #22d3ee)' : 'inherit',
                                  }}
                                >
                                  {file.type === 'video' ? (
                                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-mono truncate">{file.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {file.type === 'video' ? 'MP4動画 (ループ)' : '画像'} • {file.sizeFormatted}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1.5"
                                  style={{ backgroundColor: 'var(--theme-accent, #22d3ee)', color: '#000' }}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-1">
                        <p className="text-slate-300 font-semibold">📁 動画・画像ファイルがまだ見つかりません</p>
                        <p className="text-[11px] leading-relaxed">
                          PCのWallpaper Engine録画動画（MP4）や画像を、以下のフォルダに置くと自動でここに表示されます：
                        </p>
                        <code className="block bg-black/40 p-1.5 rounded text-[10px] text-cyan-300 font-mono select-all">
                          c:\school\tablet-desk-dashboard\public\
                        </code>
                      </div>
                    )}

                    {/* 手動URL入力欄 */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <label className="text-[11px] text-slate-400 block">
                        または 外部URL/直接パスを指定:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customWallpaperUrl}
                          onChange={(e) => handleUpdateCustomWallpaper(e.target.value)}
                          placeholder="/my-wallpaper.mp4 または https://.../wallpaper.mp4"
                          className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                        {customWallpaperUrl && (
                          <button
                            onClick={() => handleUpdateCustomWallpaper('')}
                            className="px-2.5 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                          >
                            クリア
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. 時計フォーマット切り替え (12h / 24h) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      時刻表示形式
                    </span>
                    <span className="text-xs text-slate-400">
                      12時間（AM/PM）または24時間表示
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-xl">
                  <button
                    onClick={() => handleToggleTimeFormat('12h')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      timeFormat === '12h'
                        ? 'text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    style={
                      timeFormat === '12h'
                        ? { backgroundColor: 'var(--theme-accent, #22d3ee)' }
                        : {}
                    }
                  >
                    12時間
                  </button>
                  <button
                    onClick={() => handleToggleTimeFormat('24h')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      timeFormat === '24h'
                        ? 'text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    style={
                      timeFormat === '24h'
                        ? { backgroundColor: 'var(--theme-accent, #22d3ee)' }
                        : {}
                    }
                  >
                    24時間
                  </button>
                </div>
              </div>

              {/* 6. 言語切り替え (English / 日本語) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl liquid-glass-pill text-purple-400">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      表示言語 (メインUI)
                    </span>
                    <span className="text-xs text-slate-400">
                      メイン画面のタブや日付表記の言語を切り替えます
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-xl">
                  <button
                    onClick={() => handleToggleLanguage('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      language === 'en'
                        ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/25'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleToggleLanguage('ja')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      language === 'ja'
                        ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/25'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    日本語
                  </button>
                </div>
              </div>

              {/* 6.5. バッテリー残量の表示切替 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl liquid-glass-pill text-emerald-400">
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      バッテリー残量の表示
                    </span>
                    <span className="text-xs text-slate-400">
                      画面右下にタブレットの残バッテリー（%）と充電状態を表示
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-xl">
                  <button
                    onClick={() => handleToggleBattery(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      showBatteryIndicator
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => handleToggleBattery(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      !showBatteryIndicator
                        ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* 7. 天気の地点設定 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl liquid-glass-pill text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      天気の地点設定
                    </span>
                    <span className="text-xs text-slate-400">
                      地名を入力するだけで即座に天気が切り替わります
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="地名を入力 (例: 宇都宮, Tokyo, Osaka)..."
                    className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCity();
                    }}
                  />
                  <button
                    onClick={handleApplyCity}
                    disabled={isSearchingCity}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-50"
                    style={{ backgroundColor: 'var(--theme-accent, #22d3ee)' }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingCity ? '...' : '適用'}</span>
                  </button>
                </div>
                {citySearchError && (
                  <p className="text-xs text-rose-400 mt-1.5">{citySearchError}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  現在の地点: <strong className="text-slate-200">{currentCityName}</strong>
                </p>
              </div>

              {/* 8. Spotify連携情報 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">🎵 Spotify 連携情報</span>
                  <span className="text-xs font-mono text-emerald-400 font-medium">
                    ステータス: {spotifyStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  連携完了済みです。曲を再生すると自動表示されます。
                </p>
                <a
                  href="/api/spotify/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>トークン再取得</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 9. SwitchBot 温湿度計 連携情報 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl liquid-glass-pill text-emerald-400">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">
                        SwitchBot 温湿度計 連携
                      </span>
                      <span className="text-xs text-slate-400">
                        お部屋の室温・湿度をリアルタイム取得して表示
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={fetchSwitchBotMeter}
                    disabled={isSwitchBotLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs text-emerald-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSwitchBotLoading ? 'animate-spin' : ''}`} />
                    <span>再取得</span>
                  </button>
                </div>

                {/* ステータス表示 */}
                {switchBotMeter ? (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {switchBotMeter.deviceName || 'SwitchBot 温湿度計'} 連動中
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(switchBotMeter.updatedAt).toLocaleTimeString()} 更新
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-sm font-bold">
                      <span className="text-emerald-300">{switchBotMeter.temperature.toFixed(1)}°C</span>
                      <span className="text-slate-300">{switchBotMeter.humidity}%</span>
                      {switchBotMeter.battery !== undefined && (
                        <span className="text-[10px] text-slate-400 font-normal">🔋{switchBotMeter.battery}%</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>{isSwitchBotConfigured ? '温湿度計デバイスを探索中または応答なし' : 'SwitchBot API 未設定'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      お部屋のSwitchBot温湿度計と連動させるには、プロジェクトの <code className="text-cyan-200 bg-white/10 px-1 py-0.5 rounded font-mono">.env.local</code> に SwitchBotの Token と Secret を記入してください。
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/40 font-mono text-[10px] text-slate-300 space-y-1">
                      <p className="text-slate-400"># .env.local に記入する項目:</p>
                      <p className="text-emerald-300">SWITCHBOT_TOKEN=&quot;あなたのトークン&quot;</p>
                      <p className="text-emerald-300">SWITCHBOT_SECRET=&quot;あなたのシークレット&quot;</p>
                      <p className="text-slate-500"># デバイスIDは自動探索されるため空欄でもOK</p>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      ※TokenとSecretの取得方法: SwitchBotスマホアプリ ＞「プロフィール」＞「設定」＞「アプリバージョン」を10回連打して「開発者向けオプション」を表示
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md"
                style={{ backgroundColor: 'var(--theme-accent, #22d3ee)' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
