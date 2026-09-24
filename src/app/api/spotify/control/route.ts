import { NextRequest, NextResponse } from 'next/server';
import { controlPlayer } from '@/lib/spotify';

export async function POST(req: NextRequest) {
  try {
    const { command, uri } = await req.json();

    if (!['play', 'pause', 'next', 'previous'].includes(command)) {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    const result = await controlPlayer(command, uri);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
