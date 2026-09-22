'use client';

import React, { useState } from 'react';
import { Newspaper, Filter, RefreshCw } from 'lucide-react';
import { NewsWidget } from './NewsWidget';
import { NewsItem } from '@/types';

interface StateCNewsFocusProps {
  news: NewsItem[];
  isLoading: boolean;
  onRefresh?: () => void;
  language?: 'en' | 'ja';
}

export const StateC_NewsFocus: React.FC<StateCNewsFocusProps> = ({
  news,
  isLoading,
  onRefresh,
  language = 'en',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Tech', 'Gadget', 'Game'];

  const filteredNews =
    selectedCategory === 'All'
      ? news
      : news.filter((item) => item.category === selectedCategory);

  return (
    <div className="h-full w-full flex flex-col justify-between p-2">
      {/* トップバー: タイトル & カテゴリフィルター */}
      <div className="liquid-glass rounded-3xl px-6 py-3 mb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl liquid-glass-pill text-cyan-400">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {language === 'en' ? 'News & Headlines' : 'ニュース & トピックス'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {language === 'en' ? 'Top Tech & Gaming Feeds' : '主要メディア・テクノロジー速報'}
            </p>
          </div>
        </div>

        {/* カテゴリ切り替えボタン群 */}
        <div className="flex items-center gap-1.5 liquid-glass-pill p-1 rounded-2xl">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {cat === 'All' ? (language === 'en' ? 'All' : 'すべて') : cat}
            </button>
          ))}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors ml-1"
              title={language === 'en' ? 'Refresh' : '更新'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* グリッドカード一覧 */}
      <div className="flex-1 overflow-hidden">
        <NewsWidget
          news={filteredNews}
          isLoading={isLoading}
          maxItems={9}
          layout="grid"
          language={language}
        />
      </div>
    </div>
  );
};
