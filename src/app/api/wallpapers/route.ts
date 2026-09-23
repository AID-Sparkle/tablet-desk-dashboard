import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface LocalWallpaperItem {
  name: string;
  url: string;
  type: 'video' | 'image';
  sizeFormatted: string;
  updatedAt: string;
}

const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogg']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json({ wallpapers: [] });
    }

    const items: LocalWallpaperItem[] = [];

    // public フォルダ内のファイルを安全に走査
    const entries = fs.readdirSync(publicDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const isVideo = VIDEO_EXTS.has(ext);
      const isImage = IMAGE_EXTS.has(ext);

      // システムファイルやSVGアイコンは除外
      if (
        entry.name.startsWith('.') ||
        entry.name.endsWith('.svg') ||
        entry.name.endsWith('.json') ||
        entry.name.endsWith('.ico')
      ) {
        continue;
      }

      if (isVideo || isImage) {
        try {
          const filePath = path.join(publicDir, entry.name);
          const stats = fs.statSync(filePath);
          items.push({
            name: entry.name,
            url: `/${entry.name}`,
            type: isVideo ? 'video' : 'image',
            sizeFormatted: formatBytes(stats.size),
            updatedAt: stats.mtime.toISOString(),
          });
        } catch {}
      }
    }

    // 更新日時の新しい順にソート
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ wallpapers: items });
  } catch (error) {
    console.error('Failed to scan wallpapers in public folder:', error);
    return NextResponse.json({ wallpapers: [] }, { status: 500 });
  }
}
