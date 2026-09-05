import { NextRequest, NextResponse } from 'next/server';
import { requireGemini } from '@/lib/apiGuard';
import { solveCaseWithContext } from '@/lib/gemini';
import type { ClarifyingAnswer, Phase1Result } from '@/types/case';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const geminiError = requireGemini();
    if (geminiError) return geminiError;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const phase1Raw = formData.get('phase1') as string | null;
    const answersRaw = formData.get('clarifyingAnswers') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required. Please re-upload the case.' },
        { status: 400 }
      );
    }

    if (!phase1Raw) {
      return NextResponse.json(
        { error: 'Phase 1 context is missing. Please re-upload the case.' },
        { status: 400 }
      );
    }

    let phase1: Phase1Result;
    let clarifyingAnswers: ClarifyingAnswer[];

    try {
      phase1 = JSON.parse(phase1Raw);
    } catch {
      return NextResponse.json(
        { error: 'Invalid phase 1 data. Please re-upload the case.' },
        { status: 400 }
      );
    }

    try {
      clarifyingAnswers = answersRaw ? JSON.parse(answersRaw) : [];
    } catch {
      return NextResponse.json(
        { error: 'Invalid clarifying answers data.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64PDF = buffer.toString('base64');

    const solution = await solveCaseWithContext(base64PDF, phase1, clarifyingAnswers);

    return NextResponse.json({ solution });
  } catch (error) {
    console.error('Clarify error:', error);

    const isGeminiError = error instanceof Error && error.name === 'GeminiUserError';
    const statusCode = isGeminiError && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
    const message = isGeminiError
      ? (error as Error).message
      : 'An unexpected error occurred while solving the case. Please try again.';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
