import { NextResponse } from 'next/server';
import { getConfigErrorMessage, isGeminiConfigured } from '@/lib/env';

export function requireGemini(): NextResponse | null {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: getConfigErrorMessage() }, { status: 503 });
  }
  return null;
}
