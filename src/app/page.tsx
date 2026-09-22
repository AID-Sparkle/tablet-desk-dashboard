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
} from 'lucide-react';
import { PixelShifter } from '@/components/PixelShifter';
import { StateA_Dashboard } from '@/components/StateA_Dashboard';
import { StateB_SpotifyFocus } from '@/components/StateB_SpotifyFocus';
import { StateC_NewsFocus } from '@/components/StateC_NewsFocus';
import { DASHBOARD_CONFIG } from '@/config/dashboard';
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
  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch('/api/weather');
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

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

    // 天気: 10分
    const weatherTimer = setInterval(fetchWeather, DASHBOARD_CONFIG.weather.refreshIntervalMs);
    // RSS: 15分
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
  // 5. 画面自動ローテーション (State A -> State B -> State C -> State A...)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!isAutoRotationActive) return;

    const timer = setInterval(() => {
      setViewMode((prev) => {
        let next: ViewMode = 'A';
        if (prev === 'A') next = 'B';
        else if (prev === 'B') next = 'C';
        else if (prev === 'C') next = 'A';
        return next;
      });
      // 画面切り替え時にピクセルシフトを微小移動
      applyNextPixelShift();
    }, DASHBOARD_CONFIG.rotationIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoRotationActive, applyNextPixelShift]);

  // 手動で画面を切り替えた時のハンドラ
  const handleManualSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    applyNextPixelShift();
  };

  // ----------------------------------------------------------------------------
  // レンダリング
  // ----------------------------------------------------------------------------
  return (
    <main className="relative h-screen w-screen bg-[#060810] text-slate-100 overflow-hidden flex flex-col justify-between select-none">
      {/* ========================================================================
          背景: 有機的アンビエントオーブ (iOSリキッドガラスの深みを生む光球)
      ======================================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/15 blur-[120px] animate-orb-1" />
        <div className="absolute top-[20%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[130px] animate-orb-2" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/10 blur-[140px]" />
      </div>

      {/* ========================================================================
          メインコンテンツ (焼き付き防止ピクセルシフター & 滑らかなクロスフェード)
      ======================================================================== */}
      <PixelShifter offset={pixelOffset} className="relative z-10 flex-1 w-full h-[calc(100vh-62px)] p-3 sm:p-4 overflow-hidden">
        {/* State A: 統合ダッシュボード (絶対配置でクロスフェード) */}
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
          />
        </div>

        {/* State B: Spotify フルフォーカス (絶対配置でクロスフェード) */}
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
          />
        </div>

        {/* State C: ニュース/RSS フルフォーカス (絶対配置でクロスフェード) */}
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
              title="クリックでSpotify大画面に切り替え"
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
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {spotifyTrack.artists}
                </p>
              </div>

              {/* イコライザーバー */}
              {spotifyTrack.isPlaying && (
                <div className="hidden sm:flex items-end gap-0.5 h-3.5 px-1 shrink-0">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-1" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-2" />
                  <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-3" />
                </div>
              )}

              {/* ミニ操作ボタン */}
              <div
                className="flex items-center gap-1 shrink-0 ml-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleSpotifyControl(spotifyTrack.isPlaying ? 'pause' : 'play')}
                  disabled={isSpotifyControlling}
                  className="p-1 rounded-full text-slate-200 hover:text-white hover:bg-white/15 transition-all"
                  title={spotifyTrack.isPlaying ? '一時停止' : '再生'}
                >
                  {spotifyTrack.isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSpotifyControl('next')}
                  disabled={isSpotifyControlling}
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all"
                  title="次の曲"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          ) : (
            /* 通常システムステータス */
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                {isOnline ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 liquid-glass-pill px-2.5 py-1 rounded-full">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline font-mono text-[10px] font-semibold">ONLINE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-300 liquid-glass-pill px-2.5 py-1 rounded-full bg-amber-500/20 border-amber-400/30">
                    <WifiOff className="w-3 h-3 animate-pulse" />
                    <span className="font-mono text-[10px] font-semibold">OFFLINE</span>
                  </div>
                )}
              </div>

              {/* 焼き付き防止インジケーター */}
              <div
                className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-300 liquid-glass-pill px-2.5 py-1 rounded-full"
                title={`ピクセルシフト: x=${pixelOffset.x}px, y=${pixelOffset.y}px`}
              >
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Shift ({pixelOffset.x}, {pixelOffset.y})</span>
              </div>
            </div>
          )}
        </div>

        {/* 中央: 画面切り替えタブ (iOSリキッドガラスピル) */}
        <div className="flex items-center gap-1.5 liquid-glass-pill p-1 rounded-2xl shadow-lg">
          <button
            onClick={() => handleManualSwitch('A')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'A'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>メイン</span>
          </button>

          <button
            onClick={() => handleManualSwitch('B')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'B'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Spotify</span>
          </button>

          <button
            onClick={() => handleManualSwitch('C')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'C'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>ニュース</span>
          </button>
        </div>

        {/* 右側: 自動ローテーショントグル & 設定 */}
        <div className="flex items-center gap-2">
          {/* 自動回転 一時停止/再開 */}
          <button
            onClick={() => setIsAutoRotationActive(!isAutoRotationActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAutoRotationActive
                ? 'liquid-glass-pill text-cyan-300 border-cyan-400/30'
                : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
            }`}
            title={isAutoRotationActive ? '自動回転を一時停止' : '自動回転を再開'}
          >
            {isAutoRotationActive ? (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">30s 自動切替</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">固定中</span>
              </>
            )}
          </button>

          {/* 設定・ヘルプモーダルを開く */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="設定・APIキー確認"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ========================================================================
          設定 & APIキーガイドモーダル (iOSリキッドガラス調)
      ======================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="liquid-glass max-w-2xl w-full rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl liquid-glass-pill text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">ダッシュボード設定 & ガイド</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm text-slate-300">
              {/* 天気設定状況 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">🌤 天気設定 (Open-Meteo)</span>
                  <span className="text-xs text-emerald-400 font-mono font-medium">稼働中（APIキー不要）</span>
                </div>
                <p className="text-xs text-slate-400">
                  地域: <strong>宇都宮市</strong> (36.5658, 139.8836)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  地域を変更したい場合は <code>.env.local</code> の <code>WEATHER_LATITUDE</code>, <code>WEATHER_LONGITUDE</code>, <code>WEATHER_CITY_NAME</code> を書き換えてください。
                </p>
              </div>

              {/* Spotify連携状況 */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">🎵 Spotify連携</span>
                  <span className="text-xs font-mono text-emerald-400 font-medium">
                    状態: {spotifyStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  連携完了済みです。曲を再生すると自動的にタイトル・ジャケットが表示され、画面下部ミニプレイヤーやフル画面プレイヤーで操作できます。
                </p>
                <a
                  href="/api/spotify/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                >
                  <span>トークン再取得・ログイン</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 給電制御 (SwitchBot) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">🔌 SwitchBot 給電プロキシ</span>
                  <span className="text-xs text-slate-400 font-mono">/api/switchbot</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Xiaomi Pad 5のMacroDroidから <code>https://[ドメイン]/api/switchbot?state=on</code> または <code>off</code> をヘッダー <code>x-api-key</code> 付きで送信することで、20%〜80%ヒステリシス充電を実行できます。
                </p>
              </div>

              {/* PC連動 (Fully Kiosk) */}
              <div className="p-4 rounded-2xl liquid-glass-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">💻 PC連動 (画面ON/OFF)</span>
                  <span className="text-xs text-slate-400 font-mono">scripts/screen-control.ps1</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Windows PCのログオン・ロック時に、タブレットのFully Kiosk Browser REST APIを叩いて画面を自動点灯・消灯させます。詳細は <code>docs/SETUP_GUIDE.md</code> をご覧ください。
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
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
