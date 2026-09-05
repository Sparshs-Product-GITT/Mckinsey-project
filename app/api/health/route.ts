import { NextResponse } from 'next/server';
import { isGeminiConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      ok: isGeminiConfigured(),
    });
  }

  return NextResponse.json({
    ok: isGeminiConfigured(),
    gemini: isGeminiConfigured(),
  });
}
