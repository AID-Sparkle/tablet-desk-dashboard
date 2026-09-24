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
      // 充電中: 鮮やかなエメラルドガラス（親コンテナは点滅させず数字を安定点灯）
      return 'bg-emerald-950/90 border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)]';
    }
    if (level <= 20) {
      return 'bg-rose-950/85 border-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.4)] animate-pulse';
    }
    if (level <= 45) {
      return 'bg-amber-950/70 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
    }
    // 通常時: 黒ベースの画面でもハッキリと輪郭が浮き出る高コントラストガラス（静止・ソリッド）
    return 'bg-slate-800/90 hover:bg-slate-700/90 border-white/35 shadow-md shadow-black/40';
  };

  const isLowBattery = !isCharging && level <= 20;
  const isMidBattery = !isCharging && level <= 45 && level > 20;

  // ゲージバーの背景スタイル（テーマカラー連動 or 警告色 or 充電緑）
  const getGaugeBarStyle = () => {
    if (isCharging) {
      return { backgroundColor: '#34d399' }; // emerald-400
    }
    if (isLowBattery) {
      return { backgroundColor: '#f43f5e' }; // rose-500
    }
    if (isMidBattery) {
      return { backgroundColor: '#fbbf24' }; // amber-400
    }
    // 通常時: アプリ設定のテーマカラー（--theme-accent）に自動連動！
    return { backgroundColor: 'var(--theme-accent, #22d3ee)' };
  };

  // 外枠のスタイル（テーマカラー連動 or 警告色 or 充電緑）
  const getOuterBorderStyle = () => {
    if (isCharging) {
      return { borderColor: 'rgba(52, 211, 153, 0.9)' };
    }
    if (isLowBattery) {
      return { borderColor: 'rgba(244, 63, 94, 0.9)' };
    }
    if (isMidBattery) {
      return { borderColor: 'rgba(251, 191, 36, 0.9)' };
    }
    // 通常時: テーマカラー枠
    return { borderColor: 'var(--theme-accent, #22d3ee)' };
  };

  // 端子突起のスタイル
  const getTerminalStyle = () => {
    if (isCharging) {
      return { backgroundColor: 'rgba(52, 211, 153, 0.9)' };
    }
    if (isLowBattery) {
      return { backgroundColor: 'rgba(244, 63, 94, 0.9)' };
    }
    if (isMidBattery) {
      return { backgroundColor: 'rgba(251, 191, 36, 0.9)' };
    }
    return { backgroundColor: 'var(--theme-accent, #22d3ee)' };
  };

  const tooltipText = language === 'ja'
    ? `バッテリー残量: ${level}%${isCharging ? ' (⚡ 充電中)' : ''}`
    : `Battery: ${level}%${isCharging ? ' (⚡ Charging)' : ''}`;

  return (
    <div
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md shrink-0 select-none transition-all duration-300 ${getContainerStyle()} ${className}`}
      style={{ forcedColorAdjust: 'none' }}
      title={tooltipText}
    >
      {/* 充電中の呼吸グロー光彩（背後でパルス発光させ、文字や数字は一切点滅させない） */}
      {isCharging && (
        <div className="absolute -inset-0.5 rounded-xl bg-emerald-400/20 blur-xs animate-pulse pointer-events-none" />
      )}

      {/* iOS風ミニバッテリーグラフィックゲージ (面で残量がわかる高視認性) */}
      <div className="relative z-10 flex items-center shrink-0 mr-0.5" style={{ forcedColorAdjust: 'none' }}>
        {/* バッテリー本体外枠 */}
        <div
          className="relative w-[23px] h-[12px] rounded-[3.5px] border-[1.5px] p-[1px] flex items-center overflow-hidden"
          style={getOuterBorderStyle()}
        >
          {/* 残量ゲージバー (スムーズ伸縮) */}
          <div
            className="h-full rounded-[1px] transition-all duration-500"
            style={{
              width: `${Math.max(10, Math.min(100, level))}%`,
              ...getGaugeBarStyle(),
              forcedColorAdjust: 'none',
            }}
          />

          {/* 【色以外の充電中判別ギミック1】充電中のみゲージ中央に白く刻印される⚡シンボル (実機スマホ仕様) */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Zap className="w-2.5 h-2.5 text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
            </div>
          )}
        </div>

        {/* バッテリー先端の端子突起 */}
        <div
          className="w-[2px] h-[5px] rounded-r-[1px] -ml-[0.5px]"
          style={getTerminalStyle()}
        />
      </div>

      {/* 残量パーセント (純白・高コントラスト・太字フォント: 充電中でも絶対に点滅しない安定表示) */}
      <span className="relative z-10 font-mono tabular-nums text-xs font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {level}%
      </span>

      {/* 【色以外の充電中判別ギミック2】充電中のみ数字の横に鮮やかなイエローの⚡マークがパルス点滅 */}
      {isCharging && (
        <Zap className="relative z-10 w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
      )}
    </div>
  );
};
