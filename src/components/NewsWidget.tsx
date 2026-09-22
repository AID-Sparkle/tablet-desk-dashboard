'use client';

import React, { useState } from 'react';
import { Newspaper, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { NewsItem } from '@/types';

interface NewsWidgetProps {
  news: NewsItem[];
  isLoading?: boolean;
  maxItems?: number;
  layout?: 'compact-list' | 'grid';
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ソース別のバッジカラー (iOSリキッドガラス調の微光バッジ)
function getSourceBadgeStyle(source: string) {
  if (source.includes('ITmedia')) {
    return 'bg-blue-500/25 text-blue-200 border-blue-400/30';
  }
  if (source.includes('GIZMODO')) {
    return 'bg-pink-500/25 text-pink-200 border-pink-400/30';
  }
  if (source.includes('4Gamer')) {
    return 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30';
  }
  return 'bg-purple-500/25 text-purple-200 border-purple-400/30';
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({
  news,
  isLoading = false,
  maxItems = 4,
  layout = 'compact-list',
}) => {
  const displayItems = news.slice(0, maxItems);

  if (isLoading && news.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 h-full flex flex-col justify-between animate-pulse">
        <div className="h-5 w-28 bg-white/10 rounded-full mb-3"></div>
        <div className="space-y-2.5">
          <div className="h-12 bg-white/5 rounded-2xl"></div>
          <div className="h-12 bg-white/5 rounded-2xl"></div>
          <div className="h-12 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-5 h-full flex flex-col items-center justify-center text-slate-400">
        <Newspaper className="w-7 h-7 text-slate-500 mb-2" />
        <span className="text-xs">ニュースを受信中...</span>
      </div>
    );
  }

  // コンパクトリスト形式 (State A Dashboard 用)
  if (layout === 'compact-list') {
    return (
      <div className="liquid-glass rounded-3xl p-3.5 sm:p-4 flex flex-col h-full overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200">最新ニュース & トピックス</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>リアルタイム速報</span>
          </div>
        </div>

        {/* リスト表示 */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {displayItems.map((item) => (
            <NewsListItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // グリッド形式 (State C News Focus 用)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 h-full overflow-y-auto p-1">
      {displayItems.map((item) => (
        <NewsGridCard key={item.id} item={item} />
      ))}
    </div>
  );
};

// コンパクトリスト内アイテム
const NewsListItem: React.FC<{ item: NewsItem }> = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 py-2 px-1.5 -mx-1.5 rounded-xl hover:bg-white/5 transition-colors"
    >
      {/* サムネイル画像（小さめ: 40x40px）またはドットアクセント */}
      {item.imageUrl && !imgFailed ? (
        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-800/80 border border-white/10">
          <img
            src={item.imageUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      ) : (
        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 group-hover:scale-125 transition-transform shadow-sm shadow-cyan-400/50 ml-1 mr-1" />
      )}

      {/* 記事タイトル & メタ情報 (枠内に収まるように最適化) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${getSourceBadgeStyle(
              item.sourceName
            )}`}
          >
            {item.sourceName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(item.pubDate)}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors leading-tight">
          {item.title}
        </p>
      </div>

      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
};

// グリッド内カード (State C 用: 画像小さめ・タイトルがしっかり入る設計)
const NewsGridCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="liquid-glass group rounded-2xl overflow-hidden flex flex-col justify-between border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all p-3.5 h-full"
    >
      <div className="flex-1 min-h-0">
        {/* 画像エリア (高さを h-24 に抑えてコンパクト化) */}
        {item.imageUrl && !imgFailed ? (
          <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900/60 mb-2.5 border border-white/10">
            <img
              src={item.imageUrl}
              alt=""
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-cyan-400/50 via-blue-500/50 to-transparent mb-2.5" />
        )}

        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getSourceBadgeStyle(
              item.sourceName
            )}`}
          >
            {item.sourceName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(item.pubDate)}
          </span>
        </div>

        {/* 記事タイトル (枠内にしっかり収まる2行表示) */}
        <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-2 leading-snug transition-colors">
          {item.title}
        </h4>
      </div>

      <div className="flex items-center justify-end text-[11px] text-slate-400 group-hover:text-cyan-400 mt-2.5 pt-2 border-t border-white/10 gap-1 transition-colors shrink-0">
        <span>記事を読む</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </a>
  );
};
