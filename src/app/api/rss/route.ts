import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { RSS_FEEDS } from '@/config/rss';
import { NewsItem, RssApiResponse } from '@/types';

// HTMLタグの除去
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

// サムネイル画像URLの抽出
function extractImageUrl(item: any): string | undefined {
  // 1. media:content
  if (item['media:content']?.['@_url']) {
    return item['media:content']['@_url'];
  }
  // 2. enclosure
  if (item.enclosure?.['@_url'] && item.enclosure['@_type']?.startsWith('image/')) {
    return item.enclosure['@_url'];
  }
  // 3. media:thumbnail
  if (item['media:thumbnail']?.['@_url']) {
    return item['media:thumbnail']['@_url'];
  }
  // 4. description や content:encoded 内の <img> タグ
  const content = item['content:encoded'] || item.description || item.summary || '';
  if (typeof content === 'string') {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      // 1x1 トラッキングピクセル等は除外
      if (!match[1].includes('feedburner') && !match[1].includes('1x1')) {
        return match[1];
      }
    }
  }
  return undefined;
}

export async function GET() {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  // 各フィードを並列で取得 (Promise.allSettled)
  const fetchPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeskDashboard/1.0',
        },
        next: { revalidate: 1800 }, // 30分キャッシュ
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${feed.name}`);
      }

      const xmlText = await response.text();
      const jsonObj = parser.parse(xmlText);

      // RSS 2.0 (rss.channel.item) または Atom (feed.entry)
      const rawItems =
        jsonObj.rss?.channel?.item ||
        jsonObj.feed?.entry ||
        jsonObj['rdf:RDF']?.item ||
        [];

      const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

      const parsedItems: NewsItem[] = itemsArray.slice(0, 10).map((raw: any, idx: number) => {
        const title = typeof raw.title === 'string' ? stripHtml(raw.title) : raw.title?.['#text'] || '無題';
        const link = typeof raw.link === 'string' ? raw.link : raw.link?.['@_href'] || '#';
        const pubDateRaw = raw.pubDate || raw.published || raw.updated || raw['dc:date'] || new Date().toISOString();
        const descriptionRaw = raw.description || raw.summary || '';
        const description = typeof descriptionRaw === 'string' ? stripHtml(descriptionRaw).slice(0, 120) : '';
        const imageUrl = extractImageUrl(raw);

        return {
          id: `${feed.id}-${idx}-${Date.now()}`,
          title,
          link,
          pubDate: new Date(pubDateRaw).toISOString(),
          sourceName: feed.name,
          category: feed.category,
          imageUrl,
          description: description.length > 0 ? description : undefined,
        };
      });

      return { feed, items: parsedItems };
    } catch (err) {
      console.warn(`[RSS Error] ${feed.name} failed:`, err);
      throw err;
    }
  });

  const settledResults = await Promise.allSettled(fetchPromises);

  const allItems: NewsItem[] = [];
  let successfulFeeds = 0;

  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      successfulFeeds++;
      allItems.push(...result.value.items);
    }
  }

  // 日付の新しい順にソート
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const response: RssApiResponse = {
    items: allItems.slice(0, 30), // 最大30件
    sourcesTotal: RSS_FEEDS.length,
    sourcesSuccess: successfulFeeds,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
