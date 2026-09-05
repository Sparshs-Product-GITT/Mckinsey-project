export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getMissingConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.GEMINI_API_KEY) {
    missing.push('GEMINI_API_KEY');
  }
  return missing;
}

export function getConfigErrorMessage(): string {
  const missing = getMissingConfig();
  if (missing.length === 0) return '';
  return `Server not configured. Missing: ${missing.join(', ')}`;
}
