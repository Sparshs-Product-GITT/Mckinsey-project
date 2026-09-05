export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(
  token: string | null,
  ip: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Bot protection is not configured.' };
    }
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: 'Bot verification is required. Please refresh and try again.' };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    return { ok: false, error: 'Bot verification failed. Please try again.' };
  }

  const data = (await response.json()) as { success?: boolean };

  if (!data.success) {
    return { ok: false, error: 'Bot verification failed. Please try again.' };
  }

  return { ok: true };
}
