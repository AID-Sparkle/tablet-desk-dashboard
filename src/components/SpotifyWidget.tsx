'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Disc3,
  ExternalLink,
  Radio,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SpotifyTrack, SpotifyStatus } from '@/types';

interface SpotifyWidgetProps {
  track: SpotifyTrack | null;
  status: SpotifyStatus;
  onControl: (command: 'play' | 'pause' | 'next' | 'previous') => void;
  isControlling?: boolean;
  language?: 'en' | 'ja';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({
  track,
  status,
  onControl,
  isControlling = false,
  language = 'en',
}) => {
  const [imgError, setImgError] = useState(false);

  // 1. 未設定ステータス（Client IDやRefresh Tokenがまだ設定されていない場合）
  if (status === 'unconfigured') {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 liquid-glass-pill px-3 py-1 rounded-full">
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'Spotify Not Connected' : 'Spotify 未設定'}</span>
          </div>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl liquid-glass-pill flex items-center justify-center mb-2">
            <Radio className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-100">
            {language === 'en' ? 'Connect Spotify Account' : 'Spotifyアカウントと連携'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Display now playing track and control playback'
              : '再生中の楽曲表示や曲送り等の操作が可能になります'}
          </p>
        </div>

        <a
          href="/api/spotify/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-2xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-98"
        >
          <span>{language === 'en' ? 'Login with Spotify' : 'Spotifyでログインして連携'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 2. デバイス待機中（Spotify起動していない、または再生が停止して長時間経過）
  if (status === 'no_device' || !track) {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300 liquid-glass-pill px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <span>{language === 'en' ? 'Spotify Idle' : 'Spotify 待機中'}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'en' ? 'Ready on PC / Phone' : 'PC / スマホで再生待機'}
          </span>
        </div>

        <div className="my-auto text-center py-3">
          <Disc3 className="w-12 h-12 mx-auto text-slate-500 animate-spin-slow mb-2" />
          <p className="text-sm font-semibold text-slate-200">
            {language === 'en' ? 'No track playing' : '再生中の曲はありません'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Play music on your device to display here'
              : 'PCやスマートフォンで曲を再生すると自動表示されます'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => onControl('play')}
            disabled={isControlling}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'en' ? 'Resume' : '再開'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. エラー時
  if (status === 'error') {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col justify-between border-rose-500/20">
        <div className="flex items-center gap-2 text-xs font-medium text-rose-300 liquid-glass-pill px-3 py-1 rounded-full bg-rose-500/20 border-rose-400/30">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{language === 'en' ? 'Connection Error' : 'Spotify 通信エラー'}</span>
        </div>
        <p className="text-xs text-slate-300 my-auto text-center">
          {language === 'en' ? 'Connection failed. Retrying...' : '通信に失敗しました。自動再試行中...'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-cyan-300 hover:underline text-center"
        >
          {language === 'en' ? 'Reload' : '再読み込み'}
        </button>
      </div>
    );
  }

  // 4. 再生中または一時停止中のメイン表示
  const progressPercent = track.durationMs > 0 ? (track.progressMs / track.durationMs) * 100 : 0;

  return (
    <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* 背景のアルバムアートぼかし */}
      {track.albumArtUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${track.albumArtUrl})` }}
        />
      )}

      {/* ヘッダー: ステータス & イコライザー */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-emerald-300 text-xs font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${track.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
            <span>
              {track.isPlaying
                ? language === 'en'
                  ? 'Now Playing'
                  : '再生中'
                : language === 'en'
                ? 'Paused'
                : '一時停止'}
            </span>
          </div>
          {track.deviceName && (
            <span className="text-[11px] text-slate-300 max-w-[120px] truncate">
              {track.deviceName}
            </span>
          )}
        </div>

        {/* イコライザーアニメーション (再生中のみ) */}
        {track.isPlaying ? (
          <div className="flex items-end gap-1 h-4">
            <span className="w-1 bg-emerald-400 rounded-full animate-eq-1" />
            <span className="w-1 bg-emerald-400 rounded-full animate-eq-2" />
            <span className="w-1 bg-emerald-400 rounded-full animate-eq-3" />
            <span className="w-1 bg-emerald-400 rounded-full animate-eq-4" />
          </div>
        ) : (
          <Disc3 className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* メイン: アルバムアート + 曲名 + アーティスト */}
      <div className="relative z-10 flex items-center gap-4 my-1">
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-slate-800">
          {track.albumArtUrl && !imgError ? (
            <img
              src={track.albumArtUrl}
              alt={track.name}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 ${track.isPlaying ? 'scale-105' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
              <Music className="w-7 h-7" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-white truncate drop-shadow-sm">
            {track.name}
          </p>
          <p className="text-xs font-semibold text-emerald-300 truncate mt-0.5">
            {track.artists}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {track.album}
          </p>
        </div>
      </div>

      {/* プログレスバー & 再生時間 */}
      <div className="relative z-10">
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-cyan-300 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-300 mt-1">
          <span>{formatDuration(track.progressMs)}</span>
          <span>{formatDuration(track.durationMs)}</span>
        </div>
      </div>

      {/* 再生コントロール */}
      <div className="relative z-10 flex items-center justify-center gap-5 pt-1">
        <button
          onClick={() => onControl('previous')}
          disabled={isControlling}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 active:scale-95"
          title="前の曲"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={() => onControl(track.isPlaying ? 'pause' : 'play')}
          disabled={isControlling}
          className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/25 active:scale-95"
          title={track.isPlaying ? '一時停止' : '再生'}
        >
          {track.isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onControl('next')}
          disabled={isControlling}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 active:scale-95"
          title="次の曲"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
