'use client';

import React from 'react';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';
import { SpotifyWidget } from './SpotifyWidget';
import { NewsWidget } from './NewsWidget';
import { WeatherData, SpotifyTrack, SpotifyStatus, NewsItem } from '@/types';

interface StateADashboardProps {
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  spotifyTrack: SpotifyTrack | null;
  spotifyStatus: SpotifyStatus;
  onSpotifyControl: (command: 'play' | 'pause' | 'next' | 'previous') => void;
  isSpotifyControlling: boolean;
  news: NewsItem[];
  isNewsLoading: boolean;
  isOnline: boolean;
  timeFormat?: '12h' | '24h';
  language?: 'en' | 'ja';
}

export const StateA_Dashboard: React.FC<StateADashboardProps> = ({
  weather,
  isWeatherLoading,
  spotifyTrack,
  spotifyStatus,
  onSpotifyControl,
  isSpotifyControlling,
  news,
  isNewsLoading,
  isOnline,
  timeFormat = '12h',
  language = 'en',
}) => {
  return (
    <div className="h-full w-full grid grid-cols-12 gap-5 p-2">
      {/* 左セクション (7カラム): 時計 + 天気 */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-5 justify-between">
        {/* 上部: 時計 */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <ClockWidget
            size="large"
            isOnline={isOnline}
            timeFormat={timeFormat}
            language={language}
          />
        </div>

        {/* 下部: 天気 */}
        <div className="h-56 sm:h-64">
          <WeatherWidget
            weather={weather}
            isLoading={isWeatherLoading}
            language={language}
          />
        </div>
      </div>

      {/* 右セクション (5カラム): Spotify + ニュース */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 justify-between">
        {/* 上部: Spotifyプレイヤー */}
        <div className="h-56 sm:h-64">
          <SpotifyWidget
            track={spotifyTrack}
            status={spotifyStatus}
            onControl={onSpotifyControl}
            isControlling={isSpotifyControlling}
            language={language}
          />
        </div>

        {/* 下部: ニュースリスト */}
        <div className="flex-1 min-h-[260px]">
          <NewsWidget
            news={news}
            isLoading={isNewsLoading}
            maxItems={4}
            layout="compact-list"
            language={language}
          />
        </div>
      </div>
    </div>
  );
};
