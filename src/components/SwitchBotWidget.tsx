'use client';

import React, { useState } from 'react';
import {
  Home,
  Thermometer,
  Droplets,
  Zap,
  Lightbulb,
  Power,
  RotateCw,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SwitchBotMeterData, SwitchBotDevice } from '@/types';

interface SwitchBotWidgetProps {
  meterData?: SwitchBotMeterData | null;
  devices?: SwitchBotDevice[];
  isLoading?: boolean;
  onControlDevice?: (deviceId: string, command: 'turnOn' | 'turnOff') => Promise<boolean>;
  onOpenSettings?: () => void;
  language?: 'en' | 'ja';
}

function getComfortStatus(temp: number, humidity: number, lang: 'en' | 'ja'): { label: string; color: string } {
  if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 60) {
    return { label: lang === 'en' ? 'Comfortable' : '快適', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/30' };
  }
  if (temp > 28) {
    return { label: lang === 'en' ? 'Hot' : '高温注意', color: 'text-rose-400 bg-rose-500/10 border-rose-400/30' };
  }
  if (temp < 18) {
    return { label: lang === 'en' ? 'Cold' : '低温注意', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-400/30' };
  }
  if (humidity < 40) {
    return { label: lang === 'en' ? 'Dry' : '乾燥気味', color: 'text-amber-400 bg-amber-500/10 border-amber-400/30' };
  }
  if (humidity > 65) {
    return { label: lang === 'en' ? 'Humid' : '多湿', color: 'text-blue-400 bg-blue-500/10 border-blue-400/30' };
  }
  return { label: lang === 'en' ? 'Normal' : '標準', color: 'text-slate-300 bg-white/5 border-white/10' };
}

function getDeviceIcon(deviceType: string) {
  const type = deviceType.toLowerCase();
  if (type.includes('plug')) return <Zap className="w-4 h-4 text-amber-400" />;
  if (type.includes('light') || type.includes('bulb')) return <Lightbulb className="w-4 h-4 text-yellow-300" />;
  return <Power className="w-4 h-4 text-cyan-400" />;
}

export const SwitchBotWidget: React.FC<SwitchBotWidgetProps> = ({
  meterData,
  devices = [],
  isLoading = false,
  onControlDevice,
  onOpenSettings,
  language = 'ja',
}) => {
  const [controllingId, setControllingId] = useState<string | null>(null);
  const [deviceStates, setDeviceStates] = useState<Record<string, 'on' | 'off'>>({});

  const handleToggle = async (device: SwitchBotDevice) => {
    if (!onControlDevice) return;
    const currentState = deviceStates[device.deviceId] || 'off';
    const nextCommand = currentState === 'on' ? 'turnOff' : 'turnOn';

    setControllingId(device.deviceId);
    try {
      const ok = await onControlDevice(device.deviceId, nextCommand);
      if (ok) {
        setDeviceStates((prev) => ({
          ...prev,
          [device.deviceId]: nextCommand === 'turnOn' ? 'on' : 'off',
        }));
      }
    } finally {
      setControllingId(null);
    }
  };

  const comfort = meterData
    ? getComfortStatus(meterData.temperature, meterData.humidity, language)
    : null;

  return (
    <div className="liquid-glass rounded-3xl p-5 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* 背景の微かなグロー */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-emerald-300 liquid-glass-pill px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-400/20">
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'INDOOR' : '室内環境'}</span>
          </span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
            {meterData?.deviceName || 'SwitchBot'}
          </span>
        </div>

        {comfort ? (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${comfort.color} animate-fadeIn`}>
            {comfort.label}
          </span>
        ) : (
          onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full liquid-glass-pill transition-all cursor-pointer"
            >
              連携設定
            </button>
          )
        )}
      </div>

      {/* メイン温湿度表示 (特大でくっきり) */}
      {meterData ? (
        <div className="my-2 flex items-center justify-between">
          {/* 室温 */}
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-tight drop-shadow-sm">
              {meterData.temperature.toFixed(1)}
            </span>
            <span className="text-2xl sm:text-3xl font-light text-emerald-300 ml-1">°C</span>
          </div>

          {/* 湿度 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl liquid-glass-pill border border-white/10">
            <Droplets className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {language === 'en' ? 'Humidity' : '湿度'}
              </span>
              <span className="font-mono text-xl font-bold text-slate-100">
                {meterData.humidity}
                <span className="text-xs font-normal text-slate-400 ml-0.5">%</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-3 py-3 px-4 rounded-2xl liquid-glass-subtle border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Thermometer className="w-5 h-5 text-amber-400/80" />
            <span className="text-xs">
              {isLoading ? '温湿度データを取得中...' : '温湿度計が未連携です'}
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs px-3 py-1 rounded-xl liquid-glass font-semibold text-cyan-300 hover:text-white transition-all cursor-pointer"
            >
              設定する
            </button>
          )}
        </div>
      )}

      {/* 下部: 操作可能デバイス一覧 または サブステータス */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{language === 'en' ? 'Smart Devices' : 'スマートデバイス操作'}</span>
          </span>
          {meterData?.battery !== undefined && (
            <span className="text-[10px] font-mono text-slate-400">
              🔋 {meterData.battery}%
            </span>
          )}
        </div>

        {devices.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 max-h-[72px] overflow-y-auto pr-0.5">
            {devices.map((device) => {
              const isToggled = deviceStates[device.deviceId] === 'on';
              const isBusy = controllingId === device.deviceId;
              return (
                <button
                  key={device.deviceId}
                  onClick={() => handleToggle(device)}
                  disabled={isBusy}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                    isToggled
                      ? 'liquid-glass bg-amber-500/15 border-amber-400/40 text-white shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {getDeviceIcon(device.deviceType)}
                    <span className="text-xs font-medium truncate">{device.deviceName}</span>
                  </div>
                  <div
                    className={`w-6 h-3.5 rounded-full p-0.5 transition-colors shrink-0 ml-1.5 flex items-center ${
                      isToggled ? 'bg-amber-400 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full bg-slate-950 transition-all ${isBusy ? 'animate-pulse' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-1 px-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>操作可能デバイス（プラグ・照明等）</span>
            <span className="text-[10px] text-slate-500 font-mono">
              {meterData ? '登録なし' : '未検出'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
