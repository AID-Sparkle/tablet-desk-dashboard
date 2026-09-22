'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

interface ClockWidgetProps {
  size?: 'large' | 'compact';
  isOnline?: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ size = 'large', isOnline = true }) => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className={size === 'large' ? 'h-40 flex items-center justify-center' : 'h-10'}>
        <span className="text-slate-600 animate-pulse text-2xl font-mono">--:--</span>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const year = time.getFullYear();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = days[time.getDay()];

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-3">
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
            <WifiOff className="w-3 h-3" />
            <span>オフライン動作中</span>
          </div>
        )}
        <div className="flex items-baseline gap-1 font-mono text-slate-200">
          <span className="text-xl font-bold tracking-tight">{hours}:{minutes}</span>
          <span className="text-xs text-slate-400 font-medium">:{seconds}</span>
        </div>
        <div className="text-xs text-slate-400 font-medium border-l border-slate-700 pl-3">
          {month}/{date} ({dayName})
        </div>
      </div>
    );
  }

  // 大画面表示 (State A Dashboard)
  const isWeekend = time.getDay() === 0 || time.getDay() === 6;

  return (
    <div className="relative flex flex-col justify-center">
      {/* オフライン警告バッジ */}
      {!isOnline && (
        <div className="inline-flex items-center gap-2 self-start mb-3 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>ネットワーク切断 (ローカル刻時中)</span>
        </div>
      )}

      {/* メインデジタル時計 */}
      <div className="flex items-baseline tracking-tight select-none">
        <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 drop-shadow-sm">
          {hours}
        </span>
        <span className="font-mono text-6xl sm:text-7xl md:text-8xl font-light text-cyan-400/80 mx-1 sm:mx-2 animate-pulse">
          :
        </span>
        <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 drop-shadow-sm">
          {minutes}
        </span>
        <div className="ml-3 sm:ml-4 flex flex-col items-start font-mono">
          <span className="text-2xl sm:text-3xl font-bold text-cyan-400/90 tabular-nums">
            {seconds}
          </span>
          <span className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">
            SEC
          </span>
        </div>
      </div>

      {/* 日付・曜日 */}
      <div className="mt-2 sm:mt-3 flex items-center gap-3 text-base sm:text-lg font-medium text-slate-300">
        <span>{year}年{month}月{date}日</span>
        <span
          className={`px-2.5 py-0.5 rounded-md text-sm font-semibold ${
            isWeekend
              ? time.getDay() === 0
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
          }`}
        >
          {dayName}曜日
        </span>
      </div>
    </div>
  );
};
