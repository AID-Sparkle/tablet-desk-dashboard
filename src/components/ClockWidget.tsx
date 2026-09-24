'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Clock as ClockIcon } from 'lucide-react';

interface ClockWidgetProps {
  size?: 'large' | 'compact';
  isOnline?: boolean;
  timeFormat?: '12h' | '24h';
  language?: 'en' | 'ja';
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({
  size = 'large',
  isOnline = true,
  timeFormat = '12h',
  language = 'en',
}) => {
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
      <div className={size === 'large' ? 'h-48 flex items-center justify-center' : 'h-10'}>
        <span className="text-slate-600 animate-pulse text-2xl font-mono">--:--</span>
      </div>
    );
  }

  const rawHours = time.getHours();
  const rawMinutes = time.getMinutes();
  const rawSeconds = time.getSeconds();

  const isPM = rawHours >= 12;
  const ampm = isPM ? 'PM' : 'AM';

  let displayHours = rawHours;
  if (timeFormat === '12h') {
    displayHours = rawHours % 12 || 12;
  }
  const hoursStr = displayHours.toString().padStart(2, '0');
  const minutesStr = rawMinutes.toString().padStart(2, '0');
  const secondsStr = rawSeconds.toString().padStart(2, '0');

  // 日付・曜日のフォーマット
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const year = time.getFullYear();

  const daysJa = ['日', '月', '火', '水', '木', '金', '土'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysEnShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthsEnShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const dayOfWeek = time.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // コンパクト表示
  if (size === 'compact') {
    const compactDateStr =
      language === 'en'
        ? `${monthsEnShort[month - 1]} ${date} (${daysEnShort[dayOfWeek]})`
        : `${month}/${date} (${daysJa[dayOfWeek]})`;

    return (
      <div className="flex items-center gap-3">
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
            <WifiOff className="w-3 h-3" />
            <span>{language === 'en' ? 'Offline' : 'オフライン'}</span>
          </div>
        )}
        <div className="flex items-baseline gap-1 font-mono text-slate-200">
          {timeFormat === '12h' && (
            <span className="text-[10px] font-bold text-cyan-400 mr-1">{ampm}</span>
          )}
          <span className="text-xl font-bold tracking-tight">{hoursStr}:{minutesStr}</span>
          <span className="text-xs text-slate-400 font-medium">:{secondsStr}</span>
        </div>
        <div className="text-xs text-slate-400 font-medium border-l border-white/10 pl-3">
          {compactDateStr}
        </div>
      </div>
    );
  }

  // 大画面表示 (State A Dashboard)
  // 日付文字列
  const fullDateStr =
    language === 'en'
      ? `${daysEn[dayOfWeek]}, ${monthsEn[month - 1]} ${date}, ${year}`
      : `${year}年${month}月${date}日`;

  const dayLabel = language === 'en' ? daysEnShort[dayOfWeek] : `${daysJa[dayOfWeek]}曜日`;

  // アナログ時計の角度計算
  // 秒針: 1秒で6度 (360 / 60)
  const secondDeg = rawSeconds * 6;
  // 分針: 1分で6度 + 秒の端数
  const minuteDeg = rawMinutes * 6 + (rawSeconds / 60) * 6;
  // 時針: 1時間で30度 (360 / 12) + 分の端数
  const hourDeg = (rawHours % 12) * 30 + (rawMinutes / 60) * 30;

  // 今日の進捗率 (Day Progress: 0%〜100%)
  const secondsToday = rawHours * 3600 + rawMinutes * 60 + rawSeconds;
  const dayProgressPercent = Math.round((secondsToday / 86400) * 100);

  return (
    <div className="relative flex items-center justify-between w-full h-full gap-6">
      {/* 左側: デジタル時計 & 日付 */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        {/* オフライン警告バッジ */}
        {!isOnline && (
          <div className="inline-flex items-center gap-2 self-start mb-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium backdrop-blur-md">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>{language === 'en' ? 'Network Disconnected (Local Clock)' : 'ネットワーク切断 (ローカル刻時中)'}</span>
          </div>
        )}

        {/* 12h表記時の AM/PM バッジ (時間の上に小さくスタイリッシュに配置) */}
        {timeFormat === '12h' && (
          <div className="mb-1">
            <span
              className="text-[11px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-md liquid-glass-pill shadow-sm"
              style={{
                color: 'var(--theme-accent, #22d3ee)',
                borderColor: 'var(--theme-accent-border, rgba(34, 211, 238, 0.35))',
              }}
            >
              {ampm}
            </span>
          </div>
        )}

        {/* 巨大デジタル時分秒 (bg-clip-textの反転バグを解消し、常に純白で鮮明に発光) */}
        <div className="flex items-baseline tracking-tight select-none">
          <span className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]">
            {hoursStr}
          </span>
          <span
            className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mx-1 sm:mx-2 animate-pulse select-none"
            style={{ color: 'var(--theme-accent, #22d3ee)' }}
          >
            :
          </span>
          <span className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]">
            {minutesStr}
          </span>
          <div className="ml-2.5 sm:ml-4 flex flex-col items-start font-mono">
            <span
              className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums"
              style={{ color: 'var(--theme-accent, #22d3ee)' }}
            >
              {secondsStr}
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
              SEC
            </span>
          </div>
        </div>

        {/* 日付・曜日 */}
        <div className="mt-1.5 sm:mt-2.5 flex items-center gap-2.5 text-xs sm:text-sm md:text-base font-medium text-slate-300">
          <span>{fullDateStr}</span>
          <span
            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
              isWeekend
                ? dayOfWeek === 0
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30'
                  : 'bg-blue-500/25 text-blue-300 border border-blue-500/30'
                : 'liquid-glass-pill text-slate-200'
            }`}
          >
            {dayLabel}
          </span>
        </div>
      </div>

      {/* 右側: iOSリキッドガラス アナログ時計 & Day Progress (タブレットの高さに合わせて最適化) */}
      <div className="hidden sm:flex flex-col items-center justify-center shrink-0 pl-3 md:pl-4 border-l border-white/10">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full liquid-glass flex items-center justify-center shadow-xl border border-white/15" style={{ forcedColorAdjust: 'none' }}>
          {/* 文字盤 12箇所のアワーマーカー */}
          {[...Array(12)].map((_, i) => {
            const rot = i * 30;
            const isQuarter = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute inset-0 flex justify-center p-1.5 pointer-events-none"
                style={{ transform: `rotate(${rot}deg)`, forcedColorAdjust: 'none' }}
              >
                <div
                  className="rounded-full shadow-xs"
                  style={{
                    width: isQuarter ? '4px' : '2px',
                    height: isQuarter ? '12px' : '6px',
                    backgroundColor: isQuarter
                      ? 'var(--theme-accent, #22d3ee)'
                      : 'rgba(203, 213, 225, 0.75)',
                    forcedColorAdjust: 'none',
                  }}
                />
              </div>
            );
          })}

          {/* 時針 */}
          <div
            className="absolute w-1.5 h-10 md:h-12 rounded-full origin-bottom shadow-lg border border-black/20"
            style={{
              bottom: '50%',
              transform: `rotate(${hourDeg}deg)`,
              transformOrigin: '50% 100%',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: '#f8fafc',
              forcedColorAdjust: 'none',
            }}
          />

          {/* 分針 */}
          <div
            className="absolute w-1 h-14 md:h-16 rounded-full origin-bottom shadow-lg border border-black/20"
            style={{
              bottom: '50%',
              transform: `rotate(${minuteDeg}deg)`,
              transformOrigin: '50% 100%',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: '#e2e8f0',
              forcedColorAdjust: 'none',
            }}
          />

          {/* 秒針 (テーマカラーアクセント・スイープ風) */}
          <div
            className="absolute w-0.5 h-16 md:h-18 rounded-full origin-bottom shadow-sm"
            style={{
              bottom: '50%',
              transform: `rotate(${secondDeg}deg)`,
              transformOrigin: '50% 100%',
              transition: 'transform 0.15s cubic-bezier(0.4, 2, 0.3, 1)',
              backgroundColor: 'var(--theme-accent, #22d3ee)',
              boxShadow: '0 0 8px var(--theme-accent-glow, rgba(34, 211, 238, 0.4))',
              forcedColorAdjust: 'none',
            }}
          />

          {/* 針の中心ピボット */}
          <div
            className="relative z-10 w-3 h-3 rounded-full shadow-md border border-slate-900"
            style={{
              backgroundColor: 'var(--theme-accent, #22d3ee)',
              forcedColorAdjust: 'none',
            }}
          />
        </div>

        {/* 下部: 1日の進捗ゲージ (Day Progress) */}
        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <ClockIcon
            className="w-3 h-3"
            style={{ color: 'var(--theme-accent, #22d3ee)' }}
          />
          <span>DAY {dayProgressPercent}%</span>
        </div>
      </div>
    </div>
  );
};
