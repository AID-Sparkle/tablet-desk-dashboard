'use client';

import React, { useEffect, useState } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
} from 'lucide-react';

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
          // どちらも利用できない場合（非対応デスクトップ等）
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

  // 残量に応じたアイコンとカラーの選択
  const getBatteryIcon = () => {
    if (isCharging) {
      return <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (level <= 20) {
      return <BatteryWarning className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />;
    }
    if (level <= 45) {
      return <BatteryLow className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    }
    if (level <= 75) {
      return <BatteryMedium className="w-3.5 h-3.5 text-slate-200 shrink-0" />;
    }
    return <BatteryFull className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
  };

  const getTextColor = () => {
    if (isCharging) return 'text-emerald-300';
    if (level <= 20) return 'text-rose-300 font-bold';
    if (level <= 45) return 'text-amber-200';
    return 'text-slate-100';
  };

  const tooltipText = language === 'ja'
    ? `バッテリー残量: ${level}%${isCharging ? ' (充電中)' : ''}`
    : `Battery: ${level}%${isCharging ? ' (Charging)' : ''}`;

  return (
    <div
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl liquid-glass-pill border border-white/10 shrink-0 text-xs select-none transition-all ${className}`}
      title={tooltipText}
    >
      {getBatteryIcon()}

      <span className={`font-mono tabular-nums text-[11px] sm:text-xs font-semibold ${getTextColor()}`}>
        {level}%
      </span>

      {isCharging && (
        <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 shrink-0 -ml-0.5 animate-pulse" />
      )}
    </div>
  );
};
