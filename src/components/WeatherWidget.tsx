'use client';

import React from 'react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  ArrowUp,
  ArrowDown,
  Home,
  Thermometer,
} from 'lucide-react';
import { WeatherData, SwitchBotMeterData } from '@/types';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  isLoading?: boolean;
  language?: 'en' | 'ja';
  indoorData?: SwitchBotMeterData | null;
  onOpenSettings?: () => void;
}

// 英語の天候説明マッピング
function getWeatherDescEn(descJa: string): string {
  if (descJa.includes('快晴')) return 'Clear Sky';
  if (descJa.includes('晴れ')) return 'Sunny';
  if (descJa.includes('一部曇り')) return 'Partly Cloudy';
  if (descJa.includes('曇り')) return 'Overcast';
  if (descJa.includes('霧')) return 'Foggy';
  if (descJa.includes('雷雨')) return 'Thunderstorm';
  if (descJa.includes('雪')) return 'Snow';
  if (descJa.includes('小雨')) return 'Light Rain';
  if (descJa.includes('雨')) return 'Rain';
  return descJa;
}

// WMOコードに応じたアイコンの取得
function getWeatherIcon(code: number, isDay: boolean = true) {
  if (code === 0) return <Sun className="w-9 h-9 text-amber-400 animate-spin-slow" />;
  if (code === 1 || code === 2) return <CloudSun className="w-9 h-9 text-amber-300" />;
  if (code === 3) return <Cloud className="w-9 h-9 text-slate-400" />;
  if (code >= 45 && code <= 48) return <CloudFog className="w-9 h-9 text-slate-300" />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="w-9 h-9 text-cyan-400" />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow className="w-9 h-9 text-blue-200" />;
  if (code >= 95) return <CloudLightning className="w-9 h-9 text-yellow-400" />;
  return <Sun className="w-9 h-9 text-amber-400" />;
}

// 時間帯・週間予報用の小さいアイコン
export function getSmallWeatherIcon(code: number) {
  if (code === 0 || code === 1) return <Sun className="w-4 h-4 text-amber-400" />;
  if (code === 2 || code === 3) return <Cloud className="w-4 h-4 text-slate-400" />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="w-4 h-4 text-cyan-400" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="w-4 h-4 text-blue-200" />;
  if (code >= 95) return <CloudLightning className="w-4 h-4 text-yellow-400" />;
  return <CloudSun className="w-4 h-4 text-amber-300" />;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  isLoading = false,
  language = 'en',
  indoorData,
  onOpenSettings,
}) => {
  if (isLoading && !weather) {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col justify-center animate-pulse">
        <div className="h-6 w-24 bg-white/10 rounded-full mb-4"></div>
        <div className="h-12 w-32 bg-white/10 rounded-2xl mb-4"></div>
        <div className="h-8 w-full bg-white/5 rounded-xl"></div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col items-center justify-center text-slate-400">
        <Cloud className="w-8 h-8 text-slate-500 mb-2" />
        <span className="text-xs">{language === 'en' ? 'Fetching weather...' : '天気データを取得中...'}</span>
      </div>
    );
  }

  const weatherText = language === 'en' ? getWeatherDescEn(weather.weatherDescription) : weather.weatherDescription;

  return (
    <div className="liquid-glass rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* 背景の微かな天候グロー */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダー: 地名と天候 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-200 liquid-glass-pill px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
            {weather.cityName}
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {weatherText}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-0.5">
            <ArrowUp className="w-3 h-3 text-rose-400" />
            <span className="font-mono text-slate-100 text-xs">{weather.tempMax}°</span>
          </div>
          <div className="flex items-center gap-0.5">
            <ArrowDown className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-slate-100 text-xs">{weather.tempMin}°</span>
          </div>
        </div>
      </div>

      {/* メイン気温表示 */}
      <div className="flex items-center justify-between my-1">
        <div className="flex items-baseline">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-sm">
            {weather.currentTemp}
          </span>
          <span className="text-xl sm:text-2xl font-light text-cyan-300 ml-1">°C</span>
          <span className="text-[11px] text-slate-400 ml-2 sm:ml-3">
            {language === 'en' ? 'Feels' : '体感'} {weather.apparentTemp}°
          </span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-2xl liquid-glass-pill shadow-inner">
          {getWeatherIcon(weather.weatherCode, weather.isDay)}
        </div>
      </div>

      {/* サブ情報 (降水確率・湿度・風速) */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">
              {language === 'en' ? 'Rain' : '降水確率'}
            </div>
            <div className="font-mono font-bold text-slate-100">{weather.precipitationProbability}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">
              {language === 'en' ? 'Humidity' : '湿度'}
            </div>
            <div className="font-mono font-bold text-slate-100">{weather.humidity}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400">
              {language === 'en' ? 'Wind' : '風速'}
            </div>
            <div className="font-mono font-bold text-slate-100">{weather.windSpeed}m/s</div>
          </div>
        </div>
      </div>

      {/* 時間帯別ミニ予報 */}
      {weather.hourly && weather.hourly.length > 0 && (
        <div className="pt-1.5 flex items-center justify-between gap-1 overflow-x-auto">
          {weather.hourly.slice(0, 5).map((h, i) => (
            <div key={i} className="flex flex-col items-center py-1 px-1.5 rounded-xl liquid-glass-pill text-center min-w-[48px]">
              <span className="text-[10px] text-slate-400 font-mono">{h.time}</span>
              <div className="my-1">{getSmallWeatherIcon(h.weatherCode)}</div>
              <span className="text-xs font-mono font-medium text-slate-200">{Math.round(h.temp)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
