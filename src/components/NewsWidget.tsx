'use client';

import React, { useState } from 'react';
import { Newspaper, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { NewsItem } from '@/types';

interface NewsWidgetProps {
  news: NewsItem[];
  isLoading?: boolean;
  maxItems?: number;
  layout?: 'compact-list' | 'grid';
  language?: 'en' | 'ja';
}

function timeAgo(dateString: string, language: 'en' | 'ja' = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (language === 'en') {
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

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
  language = 'en',
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
        <span className="text-xs">
          {language === 'en' ? 'Receiving news feeds...' : 'ニュースを受信中...'}
        </span>
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
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
              {language === 'en' ? 'Latest News & Topics' : '最新ニュース & トピックス'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{language === 'en' ? 'Live Feed' : 'リアルタイム速報'}</span>
          </div>
        </div>

        {/* リスト表示 */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {displayItems.map((item) => (
            <NewsListItem key={item.id} item={item} language={language} />
          ))}
        </div>
      </div>
    );
  }

  // グリッド形式 (State C News Focus 用)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 h-full overflow-y-auto p-0.5">
      {displayItems.map((item) => (
        <NewsGridCard key={item.id} item={item} language={language} />
      ))}
    </div>
  );
};

// コンパクトリスト内アイテム (State A 用)
const NewsListItem: React.FC<{ item: NewsItem; language: 'en' | 'ja' }> = ({
  item,
  language,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 py-1.5 px-1.5 -mx-1.5 rounded-xl hover:bg-white/5 transition-colors"
    >
      {/* サムネイル画像（小さめ: 40x40px）- 画像がある場合のみ表示 */}
      {item.imageUrl && !imgFailed && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg overflow-hidden bg-slate-800/80 border border-white/10">
          <img
            src={item.imageUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
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
            {timeAgo(item.pubDate, language)}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors leading-[1.35]">
          {item.title}
        </p>
      </div>

      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
};

// グリッド内カード (State C 用: サムネイルとテキストの横並びスリム設計でタイトル見切れゼロ)
const NewsGridCard: React.FC<{ item: NewsItem; language: 'en' | 'ja' }> = ({
  item,
  language,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="liquid-glass group rounded-2xl overflow-hidden flex items-center gap-3 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all p-2.5 sm:p-3 h-full min-h-[88px]"
    >
      {/* サムネイル画像 (画像がある場合のみ左側に表示、ない場合はアイコンも非表示) */}
      {item.imageUrl && !imgFailed && (
        <div className="relative w-24 sm:w-28 h-full min-h-[68px] max-h-[82px] rounded-xl overflow-hidden bg-slate-900/60 shrink-0 border border-white/10">
          <img
            src={item.imageUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* 右側テキストエリア: バッジ、時間、記事タイトル (画像がない場合は全幅) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <div className="flex items-center gap-2 mb-1 shrink-0">
          <span
            className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getSourceBadgeStyle(
              item.sourceName
            )}`}
          >
            {item.sourceName}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(item.pubDate, language)}
          </span>
        </div>

        {/* 記事タイトル: 1行目は絶対に文字の下が見切れず、2行目も美しく表示 */}
        <h4 className="text-xs sm:text-[13px] font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-2 leading-[1.35] transition-colors break-words">
          {item.title}
        </h4>
      </div>
    </a>
  );
};
