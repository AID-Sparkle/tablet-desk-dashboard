import { NextResponse } from 'next/server';

export interface UnsplashDailyWallpaper {
  date: string;
  url: string;
  title: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

// 厳選された美しい高品質Unsplash写真コレクション（APIキー未設定時の日替わりシード用）
const CURATED_WALLPAPERS = [
  {
    title: 'ヨセミテの静寂と星空',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Bailey Zindel',
    photographerUrl: 'https://unsplash.com/@baileyzindel',
  },
  {
    title: 'サイバーネオンの東京夜景',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Yu Kato',
    photographerUrl: 'https://unsplash.com/@yukato',
  },
  {
    title: '静寂のミニマルモダン建築',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2560&q=80',
    photographer: 'RArchitecture',
    photographerUrl: 'https://unsplash.com/@rarchitecture_melbourne',
  },
  {
    title: '雪山と満点の天の川',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Benjamin Davies',
    photographerUrl: 'https://unsplash.com/@bendavisual',
  },
  {
    title: '霧深き北欧の針葉樹林',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Sebastian Unrau',
    photographerUrl: 'https://unsplash.com/@sebastian_unrau',
  },
  {
    title: '夕暮れのアマルフィ海岸',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Willian Justen de Vasconcellos',
    photographerUrl: 'https://unsplash.com/@willianjusten',
  },
  {
    title: '深海の青と光のカーテン',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Cristian Palmer',
    photographerUrl: 'https://unsplash.com/@cristianpalmer',
  },
  {
    title: '富士山と夕焼けの雲海',
    url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2560&q=80',
    photographer: 'T397',
    photographerUrl: 'https://unsplash.com/@t397',
  },
  {
    title: '静かな湖面に映るオーロラ',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Jonatan Pie',
    photographerUrl: 'https://unsplash.com/@jonatanpie',
  },
  {
    title: '抽象的なミニマルグラデーション',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Milad Fakurian',
    photographerUrl: 'https://unsplash.com/@fakurian',
  },
  {
    title: '雨に濡れる都会のハイウェイ',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Aleksandar Pasaric',
    photographerUrl: 'https://unsplash.com/@apasaric',
  },
  {
    title: '夕暮れの大峡谷キャニオン',
    url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=2560&q=80',
    photographer: 'Luca Bravo',
    photographerUrl: 'https://unsplash.com/@lucabravo',
  },
];

export async function GET() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  // 1. もしUnsplash公式APIキーがあれば公式エンドポイントから取得
  if (accessKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=nature,landscape,dark,minimal&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
          next: { revalidate: 3600 * 12 }, // 12時間キャッシュ
        }
      );
      if (res.ok) {
        const data = await res.json();
        const daily: UnsplashDailyWallpaper = {
          date: dateStr,
          url: data.urls.raw ? `${data.urls.raw}&auto=format&fit=crop&w=2560&q=80` : data.urls.full,
          title: data.description || data.alt_description || 'Unsplash 今日の風景',
          photographer: data.user.name,
          photographerUrl: data.user.links.html,
          unsplashUrl: data.links.html,
        };
        return NextResponse.json(daily);
      }
    } catch (e) {
      console.warn('Unsplash API call failed, falling back to curated daily rotation:', e);
    }
  }

  // 2. APIキー未設定またはエラー時は、日付ハッシュから厳選日替わり写真を選択
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_WALLPAPERS.length;
  const picked = CURATED_WALLPAPERS[index];

  const daily: UnsplashDailyWallpaper = {
    date: dateStr,
    url: picked.url,
    title: picked.title,
    photographer: picked.photographer,
    photographerUrl: picked.photographerUrl,
    unsplashUrl: 'https://unsplash.com',
  };

  return NextResponse.json(daily);
}
