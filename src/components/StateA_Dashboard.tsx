import React from 'react';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';
import { SpotifyWidget } from './SpotifyWidget';
import { NewsWidget } from './NewsWidget';
import { SwitchBotWidget } from './SwitchBotWidget';
import {
  WeatherData,
  SpotifyTrack,
  SpotifyStatus,
  NewsItem,
  SwitchBotMeterData,
  SwitchBotDevice,
} from '@/types';

interface StateADashboardProps {
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  spotifyTrack: SpotifyTrack | null;
  spotifyStatus: SpotifyStatus;
  recentTracks?: SpotifyTrack[];
  onSpotifyControl: (command: 'play' | 'pause' | 'next' | 'previous', uri?: string) => void;
  isSpotifyControlling: boolean;
  news: NewsItem[];
  isNewsLoading: boolean;
  isOnline: boolean;
  timeFormat?: '12h' | '24h';
  language?: 'en' | 'ja';
  indoorData?: SwitchBotMeterData | null;
  switchBotDevices?: SwitchBotDevice[];
  onControlSwitchBotDevice?: (deviceId: string, command: 'turnOn' | 'turnOff') => Promise<boolean>;
  onOpenSettings?: () => void;
}

export const StateA_Dashboard: React.FC<StateADashboardProps> = ({
  weather,
  isWeatherLoading,
  spotifyTrack,
  spotifyStatus,
  recentTracks = [],
  onSpotifyControl,
  isSpotifyControlling,
  news,
  isNewsLoading,
  isOnline,
  timeFormat = '12h',
  language = 'en',
  indoorData,
  switchBotDevices = [],
  onControlSwitchBotDevice,
  onOpenSettings,
}) => {
  return (
    <div className="h-full w-full flex flex-col gap-2.5 sm:gap-3 p-0.5 sm:p-1 overflow-hidden">
      {/* 上段: 時計 (7カラム) + Spotifyプレイヤー (5カラム) */}
      <div className="flex-1 grid grid-cols-12 gap-2.5 sm:gap-3 min-h-0">
        {/* 時計 */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-7 liquid-glass rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-center relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <ClockWidget
            size="large"
            isOnline={isOnline}
            timeFormat={timeFormat}
            language={language}
          />
        </div>

        {/* Spotifyプレイヤー */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-5 h-full min-h-0">
          <SpotifyWidget
            track={spotifyTrack}
            status={spotifyStatus}
            onControl={onSpotifyControl}
            isControlling={isSpotifyControlling}
            language={language}
            recentTracks={recentTracks}
          />
        </div>
      </div>

      {/* 下段: 天気 (4カラム) + SwitchBot室温・デバイス (4カラム) + ニュース (4カラム) */}
      <div className="h-[195px] sm:h-[215px] md:h-[235px] grid grid-cols-12 gap-2.5 sm:gap-3 shrink-0">
        {/* 天気 */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-0">
          <WeatherWidget
            weather={weather}
            isLoading={isWeatherLoading}
            language={language}
            indoorData={indoorData}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* SwitchBot 室内環境 & スマートデバイス操作 (天気の真横！) */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-0">
          <SwitchBotWidget
            meterData={indoorData}
            devices={switchBotDevices}
            onControlDevice={onControlSwitchBotDevice}
            onOpenSettings={onOpenSettings}
            language={language}
          />
        </div>

        {/* ニュースリスト (Spotifyと同等サイズにコンパクト化) */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-0">
          <NewsWidget
            news={news}
            isLoading={isNewsLoading}
            maxItems={3}
            layout="compact-list"
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

