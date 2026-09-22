// ==============================================================================
// RSS / ニュースフィード設定
// ==============================================================================

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: 'Tech' | 'Game' | 'Gadget' | 'General';
  accentColor: string; // バッジやアクセントカラー
}

export const RSS_FEEDS: FeedSource[] = [
  {
    id: 'itmedia',
    name: 'ITmedia',
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    category: 'Tech',
    accentColor: '#3b82f6', // blue-500
  },
  {
    id: 'gizmodo',
    name: 'GIZMODO',
    url: 'https://www.gizmodo.jp/index.xml',
    category: 'Gadget',
    accentColor: '#ec4899', // pink-500
  },
  {
    id: '4gamer',
    name: '4Gamer',
    url: 'https://www.4gamer.net/rss/index.xml',
    category: 'Game',
    accentColor: '#10b981', // emerald-500
  },
  {
    id: 'google-tech',
    name: 'Google News (IT)',
    url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ja&gl=JP&ceid=JP:ja',
    category: 'Tech',
    accentColor: '#8b5cf6', // purple-500
  },
];
