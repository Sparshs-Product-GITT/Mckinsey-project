import { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidCaseId(caseId: string): boolean {
  return UUID_REGEX.test(caseId);
}

export function sanitizeErrorForLog(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message.slice(0, 200)}`;
  }
  return String(err).slice(0, 200);
}
