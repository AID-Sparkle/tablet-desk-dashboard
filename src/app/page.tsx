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
} from 'lucide-react';
import { PixelShifter } from '@/components/PixelShifter';
import { StateA_Dashboard } from '@/components/StateA_Dashboard';
import { StateB_SpotifyFocus } from '@/components/StateB_SpotifyFocus';
import { StateC_NewsFocus } from '@/components/StateC_NewsFocus';
import { DASHBOARD_CONFIG } from '@/config/dashboard';
import {
  THEME_COLORS,
  ThemeColorId,
  BACKGROUND_PRESETS,
  BackgroundStyleId,
} from '@/config/theme';
import {
  ViewMode,
  WeatherData,
  SpotifyTrack,
  SpotifyStatus,
  NewsItem,
  PixelShiftOffset,
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

  // ----------------------------------------------------------------------------
  // データステート
  // ----------------------------------------------------------------------------
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);

  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>('loading');
  const [isSpotifyControlling, setIsSpotifyControlling] = useState<boolean>(false);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // 再生割り込み検知用の前状態記録
  const prevIsPlayingRef = useRef<boolean>(false);
  const prevTrackIdRef = useRef<string | undefined>(undefined);
  const isFirstLoadRef = useRef<boolean>(true);

  // 自動回転タイマー管理用Ref
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        const currentTrack = data.track || null;
        setSpotifyTrack(currentTrack);

        // 【再生割り込み検知】
        const nowPlaying = currentTrack?.isPlaying ?? false;
        const nowTrackId = currentTrack?.id;

        // 初回ロード時は状態保存のみ行い、State Aの初期表示を維持
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
          prevIsPlayingRef.current = nowPlaying;
          prevTrackIdRef.current = nowTrackId;
          return;
        }

        // 停止中から再生開始された瞬間、または再生中に曲が変わった瞬間にState Bへ遷移
        const isStarted = !prevIsPlayingRef.current && nowPlaying;
        const isTrackChanged = nowPlaying && nowTrackId && prevTrackIdRef.current && nowTrackId !== prevTrackIdRef.current;

        if (isStarted || isTrackChanged) {
          setViewMode('B');
          applyNextPixelShift();
        }

        prevIsPlayingRef.current = nowPlaying;
        prevTrackIdRef.current = nowTrackId;
      }
    } catch (e) {
      console.error('Spotify fetch error:', e);
      setSpotifyStatus('error');
    }
  }, [applyNextPixelShift]);

  // Spotify操作 (play, pause, next, previous)
  const handleSpotifyControl = async (command: 'play' | 'pause' | 'next' | 'previous') => {
    setIsSpotifyControlling(true);
    try {
      await fetch('/api/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
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

  // ----------------------------------------------------------------------------
  // 4. 初回取得 & 定期ポーリング
  // ----------------------------------------------------------------------------
  useEffect(() => {
    fetchWeather();
    fetchNews();
    fetchSpotifyNowPlaying();

    const weatherTimer = setInterval(() => fetchWeather(), DASHBOARD_CONFIG.weather.refreshIntervalMs);
    const newsTimer = setInterval(fetchNews, DASHBOARD_CONFIG.rss.refreshIntervalMs);

    return () => {
      clearInterval(weatherTimer);
      clearInterval(newsTimer);
    };
  }, [fetchWeather, fetchNews, fetchSpotifyNowPlaying]);

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
  const resetRotationSchedule = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }
    if (!isAutoRotationActive) return;

    rotationTimerRef.current = setInterval(() => {
      setViewMode((prev) => {
        let next: ViewMode = 'A';
        if (prev === 'A') next = 'B';
        else if (prev === 'B') next = 'C';
        else if (prev === 'C') next = 'A';
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

  // アクティブな背景プリセット
  const activeBgPreset = BACKGROUND_PRESETS.find((p) => p.id === backgroundStyle);
  const activeWallpaperUrl =
    backgroundStyle === 'custom' ? customWallpaperUrl : activeBgPreset?.url;

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
          背景: 壁紙画像 (Unsplash/カスタム) + 遮光オーバーレイ + 有機的アンビエントオーブ
      ======================================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* 背景画像レイヤー */}
        {activeWallpaperUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
            style={{ backgroundImage: `url(${activeWallpaperUrl})` }}
          />
        )}

        {/* 遮光オーバーレイ (背景写真がある場合は暗さを重ねて前面テキストの可読性を確保) */}
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
            onSpotifyControl={handleSpotifyControl}
            isSpotifyControlling={isSpotifyControlling}
            news={news}
            isNewsLoading={isNewsLoading}
            isOnline={isOnline}
            timeFormat={timeFormat}
            language={language}
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
      <footer className="relative z-30 h-[62px] liquid-glass border-x-0 border-b-0 border-t border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0">
        {/* 左側: 再生中Spotifyミニプレイヤー (State B 以外のときに表示) またはステータス */}
        <div className="flex items-center gap-3 min-w-0 max-w-[45%]">
          {spotifyTrack && viewMode !== 'B' ? (
            /* Spotify 再生中ミニプレイヤー (タップでState Bへ遷移) */
            <div
              onClick={() => handleManualSwitch('B')}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl liquid-glass-pill hover:bg-white/10 cursor-pointer transition-all max-w-full group"
              title={language === 'en' ? 'Click to open Spotify full view' : 'クリックでSpotify大画面に切り替え'}
            >
              {/* サムネイル */}
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/15">
                {spotifyTrack.albumArtUrl ? (
                  <img
                    src={spotifyTrack.albumArtUrl}
                    alt=""
                    className={`w-full h-full object-cover ${spotifyTrack.isPlaying ? 'scale-105' : 'scale-100'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Music className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* 曲名 & アーティスト */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors leading-tight">
                  {spotifyTrack.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  {spotifyTrack.artists}
                </p>
              </div>

              {/* イコライザーバー (再生中のみ) */}
              {spotifyTrack.isPlaying && (
                <div className="hidden sm:flex items-end gap-0.5 h-3 shrink-0 ml-1">
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
                className="p-1 rounded-lg hover:bg-white/15 text-slate-200 hover:text-white transition-all ml-1 shrink-0"
              >
                {spotifyTrack.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>

              {/* 次の曲 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpotifyControl('next');
                }}
                disabled={isSpotifyControlling}
                className="p-1 rounded-lg hover:bg-white/15 text-slate-200 hover:text-white transition-all shrink-0"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* 非再生時のデスク情報ステータス */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 liquid-glass-pill px-3 py-1 rounded-full">
                {isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline font-mono">ONLINE</span>
                    <Wifi className="w-3 h-3 text-emerald-400 sm:hidden" />
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="hidden sm:inline font-mono text-rose-300">OFFLINE</span>
                    <WifiOff className="w-3 h-3 text-rose-400 sm:hidden" />
                  </>
                )}
              </div>

              {/* 焼き付き防止インジケーター */}
              <div
                className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-300 liquid-glass-pill px-2.5 py-1 rounded-full"
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

        {/* 中央: 画面切り替えタブ (英語 / 日本語対応 & テーマカラー連動) */}
        <div className="flex items-center gap-1.5 liquid-glass-pill p-1 rounded-2xl shadow-lg">
          <button
            id="tab-main"
            onClick={() => handleManualSwitch('A')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'C'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'NEWS' : 'ニュース'}</span>
          </button>
        </div>

        {/* 右側: 自動ローテーショントグル & 設定 */}
        <div className="flex items-center gap-2">
          {/* 自動回転 一時停止/再開 (設定秒数にリアルタイム連動) */}
          <button
            onClick={() => setIsAutoRotationActive(!isAutoRotationActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAutoRotationActive
                ? 'liquid-glass-pill text-cyan-300 border-cyan-400/30'
                : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
            }`}
            title={isAutoRotationActive ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isAutoRotationActive ? (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{language === 'en' ? '30s Auto' : '30s 自動切替'}</span>
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
            title={language === 'en' ? 'Settings & Preferences' : '設定・カスタマイズ'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ========================================================================
          設定 & カスタマイズモーダル (iOSリキッドガラス調)
      ======================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="liquid-glass max-w-2xl w-full rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/15">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl liquid-glass-pill text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'en' ? 'Dashboard Settings' : 'ダッシュボード設定'}
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                        {language === 'en' ? 'Auto-Rotation Interval' : '画面自動切り替え秒数'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {language === 'en'
                          ? 'Duration before switching views (A ⇄ B ⇄ C)'
                          : '各画面（メイン・Spotify・ニュース）の滞在秒数'}
                      </span>
                    </div>
                  </div>
                  <span
                    className="font-mono text-sm font-bold px-3 py-1 rounded-xl liquid-glass-pill"
                    style={{ color: 'var(--theme-accent, #22d3ee)' }}
                  >
                    {autoRotationInterval} {language === 'en' ? 'sec' : '秒'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">10s</span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={autoRotationInterval}
                    onChange={(e) => handleUpdateInterval(parseInt(e.target.value, 10))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                    style={{ accentColor: 'var(--theme-accent, #22d3ee)' }}
                  />
                  <span className="text-xs text-slate-400 font-mono">120s</span>
                </div>

                {/* クイック選択プリセット */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-slate-400">{language === 'en' ? 'Presets:' : 'プリセット:'}</span>
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
                      {sec}s
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
                        {language === 'en' ? 'Liquid Glass Transparency' : 'リキッドガラスの透過率'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {language === 'en'
                          ? 'Glass panel background opacity (lower = more transparent)'
                          : 'すりガラスの濃さ（低いほど背景が透け、高いほど文字重視）'}
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
                  <span className="text-xs text-slate-400 font-mono">20% ({language === 'en' ? 'Clear' : '透明'})</span>
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
                  <span className="text-xs text-slate-400 font-mono">85% ({language === 'en' ? 'Solid' : '濃密'})</span>
                </div>

                {/* クイック選択プリセット */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-slate-400">{language === 'en' ? 'Style:' : 'スタイル:'}</span>
                  {[
                    { label: language === 'en' ? '30% Transparent' : '30% クリア', val: 30 },
                    { label: language === 'en' ? '52% Balanced' : '52% 標準', val: 52 },
                    { label: language === 'en' ? '70% High Contrast' : '70% くっきり', val: 70 },
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
                      {language === 'en' ? 'Theme Accent Color' : 'アプリのテーマカラー'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {language === 'en'
                        ? 'Select accent color for clocks, indicators & buttons'
                        : '時計、秒針、インジケーター等のアクセントカラーを変更'}
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
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                          style={{
                            backgroundColor: theme.accent,
                            boxShadow: `0 0 8px ${theme.accentGlow}`,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs block truncate">
                            {language === 'en' ? theme.name : theme.nameJa}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 背景壁紙スタイル (Unsplash / PC壁紙 / オーブ) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl liquid-glass-pill" style={{ color: 'var(--theme-accent, #22d3ee)' }}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      {language === 'en' ? 'Background Wallpaper Style' : '背景スタイル (壁紙設定)'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {language === 'en'
                        ? 'Enhance frosted glass with Unsplash photography or custom wallpaper'
                        : 'Unsplash高精細写真やPC壁紙で、すりガラスの立体感をさらに向上'}
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
                        <span className="text-xs">
                          {language === 'en' ? preset.name : preset.nameJa}
                        </span>
                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-full shadow-sm"
                            style={{ backgroundColor: 'var(--theme-accent, #22d3ee)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* カスタムURL入力欄 (custom選択時) */}
                {backgroundStyle === 'custom' && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <label className="text-xs text-slate-300 block mb-1.5">
                      {language === 'en' ? 'Custom Wallpaper Image URL:' : 'カスタム壁紙画像のURL (PC壁紙等):'}
                    </label>
                    <input
                      type="url"
                      value={customWallpaperUrl}
                      onChange={(e) => handleUpdateCustomWallpaper(e.target.value)}
                      placeholder="https://example.com/wallpaper.jpg"
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'en'
                        ? 'Direct image URL (jpg, png, webp). It will be dimmed for readability.'
                        : '画像の直リンクURLを入力してください。前面文字が読めるよう自動で適度に遮光されます。'}
                    </p>
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
                      {language === 'en' ? 'Time Format' : '時刻表示形式'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {language === 'en' ? 'Toggle 12-hour (AM/PM) or 24-hour' : '12時間（AM/PM）または24時間表示'}
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
                    12h
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
                    24h
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
                      {language === 'en' ? 'Interface Language' : '表示言語'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {language === 'en' ? 'English (articles remain Japanese) or Japanese' : 'UI表記の言語切り替え'}
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

              {/* 7. 天気の地点変更 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl liquid-glass-pill text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      {language === 'en' ? 'Weather Location' : '天気の地点設定'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {language === 'en' ? 'Enter city name (e.g. 宇都宮, Tokyo, Osaka)' : '地名を入力するだけで即座に天気が切り替わります'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder={language === 'en' ? 'City name...' : '地名を入力...'}
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
                    <span>{isSearchingCity ? '...' : language === 'en' ? 'Apply' : '適用'}</span>
                  </button>
                </div>
                {citySearchError && (
                  <p className="text-xs text-rose-400 mt-1.5">{citySearchError}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  {language === 'en' ? 'Current:' : '現在の地点:'} <strong className="text-slate-200">{currentCityName}</strong>
                </p>
              </div>

              {/* 8. Spotify連携情報 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">🎵 Spotify</span>
                  <span className="text-xs font-mono text-emerald-400 font-medium">
                    Status: {spotifyStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  {language === 'en'
                    ? 'Connected. Now Playing track is displayed in bottom bar & full view.'
                    : '連携完了済みです。曲を再生すると自動表示されます。'}
                </p>
                <a
                  href="/api/spotify/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                >
                  <span>{language === 'en' ? 'Re-authenticate' : 'トークン再取得'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md"
                style={{ backgroundColor: 'var(--theme-accent, #22d3ee)' }}
              >
                {language === 'en' ? 'Close' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
