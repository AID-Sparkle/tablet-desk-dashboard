'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface BatteryIndicatorProps {
  language?: 'en' | 'ja';
  className?: string;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => void) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => void) | null;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  language = 'ja',
  className = '',
}) => {
  const [level, setLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    let batteryInstance: BatteryManager | null = null;
    let isCancelled = false;

    // 1. Web標準 Battery Status API の試行
    const initWebBattery = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
          const battery = await (navigator as unknown as { getBattery: () => Promise<BatteryManager> }).getBattery();
          if (isCancelled) return;

          batteryInstance = battery;
          setLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          const updateLevel = () => {
            if (!isCancelled) setLevel(Math.round(battery.level * 100));
          };
          const updateCharging = () => {
            if (!isCancelled) setIsCharging(battery.charging);
          };

          battery.addEventListener('levelchange', updateLevel);
          battery.addEventListener('chargingchange', updateCharging);

          return () => {
            battery.removeEventListener('levelchange', updateLevel);
            battery.removeEventListener('chargingchange', updateCharging);
          };
        }
      } catch (err) {
        console.warn('Battery Status API not available:', err);
      }
      return null;
    };

    // 2. Fully Kiosk Browser 独自 JavaScript Interface (フォールバック)
    const checkFullyKiosk = () => {
      if (typeof window !== 'undefined' && (window as unknown as { fully?: { getBatteryLevel?: () => number; isPlugged?: () => boolean } }).fully) {
        const fully = (window as unknown as { fully: { getBatteryLevel?: () => number; isPlugged?: () => boolean } }).fully;
        if (typeof fully.getBatteryLevel === 'function') {
          const fLevel = fully.getBatteryLevel();
          const fCharging = typeof fully.isPlugged === 'function' ? fully.isPlugged() : false;
          setLevel(fLevel);
          setIsCharging(fCharging);
          return true;
        }
      }
      return false;
    };

    let cleanupWebListener: (() => void) | null = null;

    initWebBattery().then((cleanup) => {
      if (cleanup) {
        cleanupWebListener = cleanup;
      } else {
        const hasFully = checkFullyKiosk();
        if (!hasFully) {
          setIsSupported(false);
        }
      }
    });

    // Fully Kiosk の場合は定期更新（30秒毎）
    const intervalId = setInterval(() => {
      if (!batteryInstance) {
        checkFullyKiosk();
      }
    }, 30000);

    return () => {
      isCancelled = true;
      if (cleanupWebListener) cleanupWebListener();
      clearInterval(intervalId);
    };
  }, []);

  // サポートされていない、または初期値取得前は非表示
  if (!isSupported || level === null) {
    return null;
  }

  // 残量・充電状態に応じたスタイル設計 (黒背景でも圧倒的に見やすい高コントラスト設計)
  const getContainerStyle = () => {
    if (isCharging) {
      return 'bg-emerald-950/80 border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]';
    }
    if (level <= 20) {
      return 'bg-rose-950/80 border-rose-400/70 shadow-[0_0_14px_rgba(244,63,94,0.4)] animate-pulse';
    }
    if (level <= 45) {
      return 'bg-amber-950/70 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
    }
    // 通常時: 黒ベースの画面でもハッキリと輪郭が浮き出る高コントラストガラス
    return 'bg-slate-800/90 hover:bg-slate-700/90 border-white/35 shadow-md shadow-black/40';
  };

  const getGaugeColor = () => {
    if (isCharging) return 'bg-emerald-400';
    if (level <= 20) return 'bg-rose-500';
    if (level <= 45) return 'bg-amber-400';
    // 通常時: Androidのダークモードで黒反転されない鮮やかな発光シアン
    return 'bg-cyan-400';
  };

  const getGaugeBorderColor = () => {
    if (isCharging) return 'border-emerald-400/80';
    if (level <= 20) return 'border-rose-400/80';
    if (level <= 45) return 'border-amber-400/80';
    // 通常時: シアン枠
    return 'border-cyan-400/75';
  };

  const getTerminalColor = () => {
    if (isCharging) return 'bg-emerald-400/80';
    if (level <= 20) return 'bg-rose-400/80';
    if (level <= 45) return 'bg-amber-400/80';
    return 'bg-cyan-400/75';
  };

  const tooltipText = language === 'ja'
    ? `バッテリー残量: ${level}%${isCharging ? ' (充電中)' : ''}`
    : `Battery: ${level}%${isCharging ? ' (Charging)' : ''}`;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md shrink-0 select-none transition-all duration-300 ${getContainerStyle()} ${className}`}
      style={{ forcedColorAdjust: 'none' }}
      title={tooltipText}
    >
      {/* iOS風ミニバッテリーグラフィックゲージ (面で残量がわかる高視認性) */}
      <div className="relative flex items-center shrink-0 mr-0.5" style={{ forcedColorAdjust: 'none' }}>
        {/* バッテリー本体外枠 */}
        <div className={`relative w-[21px] h-[11px] rounded-[3px] border-[1.5px] p-[1px] flex items-center ${getGaugeBorderColor()}`}>
          {/* 残量ゲージバー (Android反転防止) */}
          <div
            className={`h-full rounded-[1px] transition-all duration-500 ${getGaugeColor()}`}
            style={{ width: `${Math.max(10, Math.min(100, level))}%`, forcedColorAdjust: 'none' }}
          />
        </div>
        {/* バッテリー先端の端子突起 */}
        <div className={`w-[2px] h-[5px] rounded-r-[1px] -ml-[0.5px] ${getTerminalColor()}`} />
      </div>

      {/* 残量パーセント (純白・高コントラスト・太字フォント) */}
      <span className="font-mono tabular-nums text-xs font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {level}%
      </span>

      {/* 充電中の稲妻マーク (鮮やかなイエローで点滅) */}
      {isCharging && (
        <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse" />
      )}
    </div>
  );
};
