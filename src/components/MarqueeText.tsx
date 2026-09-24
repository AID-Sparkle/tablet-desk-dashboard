'use client';

import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // 1秒あたりの移動ピクセル数 (デフォルト: 26px/s)
  gradientMask?: boolean;
}

/**
 * 電光掲示板風ティッカースクロールコンポーネント (高精度ResizeObserver＆オフスクリーン計測)
 * テキストがコンテナ表示枠を0.5pxでも超えた場合、即座に電光掲示板のように滑らかなシームレススライドを開始します。
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  speed = 26,
  gradientMask = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [duration, setDuration] = useState(8);

  useEffect(() => {
    const updateOverflow = () => {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const textWidth = measureRef.current.getBoundingClientRect().width;

      // 0.5pxでもコンテナ幅を超えていれば即座に電光掲示板スライドを発動
      const overflow = textWidth > containerWidth + 0.5;
      setIsOverflow(overflow);

      if (overflow) {
        // テキスト幅 + 間の余白(24px) を移動速度で割って快適な秒数を算出
        const totalDistance = textWidth + 24;
        const calculatedDuration = Math.max(5, Math.min(25, totalDistance / speed));
        setDuration(calculatedDuration);
      }
    };

    updateOverflow();

    // 画面リサイズや親要素の幅変化をリアルタイム監視
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateOverflow();
      });
      resizeObserver.observe(containerRef.current);
    }

    const t1 = setTimeout(updateOverflow, 60);
    const t2 = setTimeout(updateOverflow, 200);
    const t3 = setTimeout(updateOverflow, 600);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [text, speed]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative whitespace-nowrap select-none w-full min-w-0 max-w-full ${className}`}
      style={
        isOverflow && gradientMask
          ? {
              maskImage:
                'linear-gradient(to right, transparent 0%, black 8px, black calc(100% - 8px), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 8px, black calc(100% - 8px), transparent 100%)',
            }
          : undefined
      }
      title={text}
    >
      {/* 画面外で常に正確なテキスト自然長を計測する非表示span (スタイリングを親と完全同期) */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="opacity-0 pointer-events-none whitespace-nowrap inline-block shrink-0"
        style={{
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      >
        {text}
      </span>

      {isOverflow ? (
        <div
          className="inline-flex marquee-track"
          style={{
            animation: `marquee-scroll ${duration}s linear infinite`,
          }}
        >
          <span className="pr-6 inline-block shrink-0">{text}</span>
          <span className="pr-6 inline-block shrink-0" aria-hidden="true">
            {text}
          </span>
        </div>
      ) : (
        <span className="inline-block truncate w-full">{text}</span>
      )}
    </div>
  );
};
