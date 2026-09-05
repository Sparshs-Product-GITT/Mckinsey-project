import { NextRequest, NextResponse } from 'next/server';
import { requireGemini } from '@/lib/apiGuard';
import { analyzeCase } from '@/lib/gemini';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const geminiError = requireGemini();
    if (geminiError) return geminiError;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 15MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64PDF = buffer.toString('base64');

    const phase1 = await analyzeCase(base64PDF);

    return NextResponse.json({ phase1 });
  } catch (error) {
    console.error('Analyze case error:', error);

    const isGeminiError = error instanceof Error && error.name === 'GeminiUserError';
    const statusCode = isGeminiError && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
    const message = isGeminiError
      ? (error as Error).message
      : 'An unexpected error occurred while analyzing the case. Please try again.';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
