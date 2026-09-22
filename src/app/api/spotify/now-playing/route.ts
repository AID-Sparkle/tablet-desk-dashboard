import { NextResponse } from 'next/server';
import { getNowPlaying } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getNowPlaying();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { status: 'error', error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
