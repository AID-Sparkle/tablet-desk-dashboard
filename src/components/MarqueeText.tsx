'use client';

import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // 1ループあたりの秒数 (未指定時は文字長から自動計算)
  gradientMask?: boolean;
}

/**
 * 電光掲示板風ティッカースクロールコンポーネント
 * テキストがコンテナ幅に収まる場合は通常表示（静止）、
 * はみ出る場合のみ滑らかな無限スライドアニメーションを発動します。
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  speed,
  gradientMask = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [duration, setDuration] = useState(8);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const overflow = textWidth > containerWidth + 2;
        setIsOverflow(overflow);

        if (overflow) {
          // テキスト幅に応じた自然なスクロール速度（1秒あたり約28px）
          const calculatedDuration = Math.max(6, Math.min(22, textWidth / 28));
          setDuration(speed || calculatedDuration);
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    // レンダリング直後やフォント反映後の微小ズレ対策
    const timer1 = setTimeout(checkOverflow, 100);
    const timer2 = setTimeout(checkOverflow, 400);

    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [text, speed]);

  if (!isOverflow) {
    return (
      <div ref={containerRef} className={`truncate ${className}`} title={text}>
        <span ref={textRef}>{text}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative whitespace-nowrap select-none ${className}`}
      style={
        gradientMask
          ? {
              maskImage:
                'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)',
            }
          : undefined
      }
      title={text}
    >
      <div
        className="inline-flex marquee-track"
        style={{
          animation: `marquee-scroll ${duration}s linear infinite`,
        }}
      >
        <span ref={textRef} className="pr-6 inline-block shrink-0">
          {text}
        </span>
        <span className="pr-6 inline-block shrink-0" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
};
