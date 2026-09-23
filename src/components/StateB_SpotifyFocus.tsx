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
  Volume2,
  Sparkles,
} from 'lucide-react';
import { SpotifyTrack, SpotifyStatus } from '@/types';

interface StateBSpotifyFocusProps {
  track: SpotifyTrack | null;
  status: SpotifyStatus;
  onControl: (command: 'play' | 'pause' | 'next' | 'previous') => void;
  isControlling: boolean;
  language?: 'en' | 'ja';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const StateB_SpotifyFocus: React.FC<StateBSpotifyFocusProps> = ({
  track,
  status,
  onControl,
  isControlling,
  language = 'en',
}) => {
  const [imgError, setImgError] = useState(false);

  // 未設定時
  if (status === 'unconfigured') {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="liquid-glass max-w-md w-full rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl liquid-glass-pill flex items-center justify-center mb-4 text-emerald-400">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {language === 'en' ? 'Spotify Not Connected' : 'Spotify 未連携'}
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {language === 'en'
              ? 'Please login and authenticate your Spotify account to enjoy full screen playback.'
              : 'Spotify Developer AppのClient IDを設定し、ログイン認証を行うとここで迫力のフル画面プレイヤーが利用できます。'}
          </p>
          <a
            href="/api/spotify/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-98"
          >
            <span>{language === 'en' ? 'Connect Spotify' : 'Spotify 認証を開始'}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 待機中または曲情報なし
  if (status === 'no_device' || !track) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="liquid-glass max-w-md w-full rounded-3xl p-8 text-center">
          <Disc3 className="w-16 h-16 mx-auto text-slate-400 animate-spin-slow mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {language === 'en' ? 'Waiting for Playback' : '再生待機中'}
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            {language === 'en'
              ? 'Play music on your PC, smartphone, or tablet Spotify app.'
              : 'PCやスマートフォンでSpotifyの再生を開始してください。'}
          </p>
          <button
            onClick={() => onControl('play')}
            disabled={isControlling}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl liquid-glass-pill hover:bg-white/10 text-slate-100 text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{language === 'en' ? 'Resume Playback' : '前回の再生を再開'}</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = track.durationMs > 0 ? (track.progressMs / track.durationMs) * 100 : 0;

  return (
    <div className="h-full w-full relative overflow-hidden rounded-3xl p-3.5 sm:p-6 md:p-8 flex flex-col justify-between">
      {/* 背景の超美麗アンビエントグラデーション＆アルバムアートブラー */}
      {track.albumArtUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${track.albumArtUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      {/* トップバー: デバイス情報 & 再生ステータス */}
      <div className="relative z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full liquid-glass-pill">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] sm:text-xs font-medium text-slate-200">
            {track.deviceName || 'Spotify Connect'}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono">
            {track.deviceType || 'Device'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full liquid-glass-pill text-emerald-300 text-[11px] sm:text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Now Playing</span>
        </div>
      </div>

      {/* センター: 特大アルバムアート + メタデータ (タブレット向けレスポンシブスケール) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-center my-auto min-h-0 py-2">
        {/* 特大アルバムアート */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group shrink-0">
            {track.albumArtUrl && !imgError ? (
              <img
                src={track.albumArtUrl}
                alt={track.name}
                onError={() => setImgError(true)}
                className={`w-full h-full object-cover transition-transform duration-700 ${track.isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                <Music className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>

        {/* 楽曲タイトル & アーティスト & イコライザー */}
        <div className="md:col-span-7 flex flex-col justify-center text-left min-w-0">
          {/* イコライザーバー */}
          <div className="flex items-end gap-1.5 h-6 sm:h-7 mb-2 sm:mb-3">
            <span className={`w-1.5 bg-emerald-400 rounded-full ${track.isPlaying ? 'animate-eq-1' : 'h-2'}`} />
            <span className={`w-1.5 bg-emerald-400 rounded-full ${track.isPlaying ? 'animate-eq-2' : 'h-3'}`} />
            <span className={`w-1.5 bg-cyan-400 rounded-full ${track.isPlaying ? 'animate-eq-3' : 'h-1.5'}`} />
            <span className={`w-1.5 bg-cyan-400 rounded-full ${track.isPlaying ? 'animate-eq-4' : 'h-2.5'}`} />
            <span className={`w-1.5 bg-emerald-400 rounded-full ${track.isPlaying ? 'animate-eq-2' : 'h-2'}`} />
            <span className={`w-1.5 bg-cyan-400 rounded-full ${track.isPlaying ? 'animate-eq-1' : 'h-1.5'}`} />
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
            {track.name}
          </h1>

          <p className="text-sm sm:text-lg md:text-xl font-semibold text-emerald-400 mt-1 sm:mt-1.5 line-clamp-1">
            {track.artists}
          </p>

          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5 line-clamp-1">
            {track.album}
          </p>
        </div>
      </div>

      {/* フッター: シークバー & フルコントロール */}
      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-2.5 sm:space-y-3 shrink-0">
        {/* シーク進行バー */}
        <div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 sm:h-2 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
            <span>{formatDuration(track.progressMs)}</span>
            <span>{formatDuration(track.durationMs)}</span>
          </div>
        </div>

        {/* コントロールボタン群 */}
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <button
            onClick={() => onControl('previous')}
            disabled={isControlling}
            className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
            title="前の曲"
          >
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>

          <button
            onClick={() => onControl(track.isPlaying ? 'pause' : 'play')}
            disabled={isControlling}
            className="p-3.5 sm:p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-xl shadow-emerald-500/30 active:scale-95 transform hover:scale-105 cursor-pointer"
            title={track.isPlaying ? '一時停止' : '再生'}
          >
            {track.isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onControl('next')}
            disabled={isControlling}
            className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
            title="次の曲"
          >
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
