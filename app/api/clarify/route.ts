import { NextRequest, NextResponse } from 'next/server';
import { requireGemini } from '@/lib/apiGuard';
import { isValidCaseId, sanitizeErrorForLog } from '@/lib/apiHelpers';
import { checkRateLimit } from '@/lib/rateLimit';
import { parseClarifyingAnswers, phase1ResultSchema } from '@/lib/schemas/case';
import { deletePhase1Session, getPhase1Session, isSessionStoreConfigured } from '@/lib/sessionStore';
import { validatePdfBuffer } from '@/lib/validatePdf';
import { solveCaseWithContext } from '@/lib/gemini';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const geminiError = requireGemini();
    if (geminiError) return geminiError;

    const rateLimitError = await checkRateLimit(req, 'clarify');
    if (rateLimitError) return rateLimitError;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string | null;
    const answersRaw = formData.get('clarifyingAnswers') as string | null;
    const phase1Raw = formData.get('phase1') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required. Please re-upload the case.' },
        { status: 400 }
      );
    }

    if (!caseId || !isValidCaseId(caseId)) {
      return NextResponse.json(
        { error: 'Invalid case session. Please re-upload the case.' },
        { status: 400 }
      );
    }

    let phase1 = await getPhase1Session(caseId);

    if (!phase1 && !isSessionStoreConfigured() && phase1Raw && process.env.NODE_ENV !== 'production') {
      try {
        const parsed = JSON.parse(phase1Raw);
        const validated = phase1ResultSchema.safeParse(parsed);
        if (validated.success) {
          phase1 = validated.data;
        }
      } catch {
        // fall through to session-not-found error
      }
    }

    if (!phase1) {
      return NextResponse.json(
        { error: 'Session expired or not found. Please re-upload the case.' },
        { status: 404 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 15MB' }, { status: 400 });
    }

    let clarifyingAnswers;
    try {
      clarifyingAnswers = parseClarifyingAnswers(answersRaw ?? '[]');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid clarifying answers data.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfCheck = validatePdfBuffer(buffer);
    if (!pdfCheck.ok) {
      return NextResponse.json({ error: pdfCheck.error }, { status: 400 });
    }

    const base64PDF = buffer.toString('base64');
    const solution = await solveCaseWithContext(base64PDF, phase1, clarifyingAnswers);

    await deletePhase1Session(caseId);

    return NextResponse.json({ solution });
  } catch (error) {
    console.error('Clarify error:', sanitizeErrorForLog(error));

    const isGeminiError = error instanceof Error && error.name === 'GeminiUserError';
    const statusCode = isGeminiError && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
    const message = isGeminiError
      ? (error as Error).message
      : 'An unexpected error occurred while solving the case. Please try again.';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
