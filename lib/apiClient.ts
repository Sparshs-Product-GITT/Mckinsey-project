export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    if (response.status === 503) {
      throw new Error('Server is not configured. Check environment variables.');
    }
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  return response.json() as Promise<T>;
}

export async function getApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await parseJsonResponse<{ error?: string }>(response);
    return data.error || fallback;
  } catch (err) {
    return err instanceof Error ? err.message : fallback;
  }
}
