import { NextResponse } from 'next/server';
import { getMissingConfig, isGeminiConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    gemini: isGeminiConfigured(),
    missing: getMissingConfig(),
  });
}
