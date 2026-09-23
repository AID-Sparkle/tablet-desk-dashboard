export type ThemeColorId = 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose' | 'frost';

export interface ThemeColorConfig {
  id: ThemeColorId;
  name: string;
  nameJa: string;
  accent: string;
  accentDim: string;
  accentBorder: string;
  accentGlow: string;
  buttonBg: string;
  badgeText: string;
}

export const THEME_COLORS: Record<ThemeColorId, ThemeColorConfig> = {
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    nameJa: 'サイバーシアン',
    accent: '#22d3ee',
    accentDim: 'rgba(34, 211, 238, 0.15)',
    accentBorder: 'rgba(34, 211, 238, 0.35)',
    accentGlow: 'rgba(34, 211, 238, 0.4)',
    buttonBg: 'bg-cyan-500',
    badgeText: 'text-cyan-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    nameJa: 'エメラルド',
    accent: '#10b981',
    accentDim: 'rgba(16, 185, 129, 0.15)',
    accentBorder: 'rgba(16, 185, 129, 0.35)',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    buttonBg: 'bg-emerald-500',
    badgeText: 'text-emerald-400',
  },
  purple: {
    id: 'purple',
    name: 'Neon Purple',
    nameJa: 'ネオンパープル',
    accent: '#a855f7',
    accentDim: 'rgba(168, 85, 247, 0.15)',
    accentBorder: 'rgba(168, 85, 247, 0.35)',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    buttonBg: 'bg-purple-500',
    badgeText: 'text-purple-400',
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    nameJa: 'サンセットアンバー',
    accent: '#f59e0b',
    accentDim: 'rgba(245, 158, 11, 0.15)',
    accentBorder: 'rgba(245, 158, 11, 0.35)',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    buttonBg: 'bg-amber-500',
    badgeText: 'text-amber-400',
  },
  rose: {
    id: 'rose',
    name: 'Neon Rose',
    nameJa: 'ネオンローズ',
    accent: '#f43f5e',
    accentDim: 'rgba(244, 63, 94, 0.15)',
    accentBorder: 'rgba(244, 63, 94, 0.35)',
    accentGlow: 'rgba(244, 63, 94, 0.4)',
    buttonBg: 'bg-rose-500',
    badgeText: 'text-rose-400',
  },
  frost: {
    id: 'frost',
    name: 'Frost Silver',
    nameJa: 'フロストシルバー',
    accent: '#e2e8f0',
    accentDim: 'rgba(226, 232, 240, 0.15)',
    accentBorder: 'rgba(226, 232, 240, 0.35)',
    accentGlow: 'rgba(226, 232, 240, 0.4)',
    buttonBg: 'bg-slate-200 text-slate-950',
    badgeText: 'text-slate-200',
  },
};

export type BackgroundStyleId = 'orbs' | 'unsplash_daily' | 'nature' | 'city' | 'minimal' | 'custom';

export interface BackgroundPreset {
  id: BackgroundStyleId;
  name: string;
  nameJa: string;
  url?: string;
  isVideo?: boolean;
  previewGradient: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'orbs',
    name: 'Ambient Orbs',
    nameJa: '有機的オーブ（標準）',
    previewGradient: 'from-cyan-950 via-purple-950 to-slate-950',
  },
  {
    id: 'unsplash_daily',
    name: 'Unsplash Daily (Auto)',
    nameJa: '日替わり風景 (Unsplash)',
    previewGradient: 'from-emerald-950 via-teal-950 to-slate-950',
  },
  {
    id: 'nature',
    name: 'Night Mountain (Unsplash)',
    nameJa: '夜の山景 (Unsplash)',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80',
    previewGradient: 'from-blue-950 via-slate-900 to-black',
  },
  {
    id: 'city',
    name: 'Cyber Tokyo (Unsplash)',
    nameJa: 'サイバー夜景 (Unsplash)',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2560&q=80',
    previewGradient: 'from-purple-950 via-pink-950 to-slate-950',
  },
  {
    id: 'minimal',
    name: 'Architecture (Unsplash)',
    nameJa: 'ミニマル建築 (Unsplash)',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2560&q=80',
    previewGradient: 'from-slate-900 via-zinc-900 to-black',
  },
  {
    id: 'custom',
    name: 'Custom (Local MP4 / Image)',
    nameJa: 'ローカル動画一覧 / PC壁紙',
    previewGradient: 'from-slate-800 to-slate-950',
  },
];

/**
 * URLまたはプリセットが動画ファイル（MP4/WebM等）かどうか判定
 */
export const isVideoSource = (url?: string, preset?: BackgroundPreset): boolean => {
  if (preset?.isVideo) return true;
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.ogg')
  );
};
