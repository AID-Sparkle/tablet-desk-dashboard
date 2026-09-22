'use client';

import React from 'react';
import { PixelShiftOffset } from '@/types';

interface PixelShifterProps {
  offset: PixelShiftOffset;
  children: React.ReactNode;
  className?: string;
}

/**
 * 焼き付き防止（Pixel Shifter）ラッパーコンポーネント
 * ローテーション毎に渡される微小オフセット (±10~15px) に基づき、
 * 視覚的な違和感を与えずに要素の位置を微妙にシフトさせます。
 */
export const PixelShifter: React.FC<PixelShifterProps> = ({ offset, children, className = '' }) => {
  return (
    <div
      className={`transition-transform duration-1000 ease-out will-change-transform ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
    >
      {children}
    </div>
  );
};
