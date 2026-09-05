const PDF_MAGIC = Buffer.from('%PDF-');
/** PDF spec allows a small preamble before the header in some generators */
const MAX_HEADER_SCAN = 1024;

export function validatePdfBuffer(buffer: Buffer): { ok: true } | { ok: false; error: string } {
  if (buffer.length < 5) {
    return { ok: false, error: 'File is empty or too small to be a valid PDF.' };
  }

  const scanLength = Math.min(buffer.length, MAX_HEADER_SCAN);
  const header = buffer.subarray(0, scanLength);
  const pdfIndex = header.indexOf(PDF_MAGIC);

  if (pdfIndex === -1) {
    return {
      ok: false,
      error: 'Invalid PDF file. Please upload a genuine PDF (not a renamed Word/PPT file).',
    };
  }

  return { ok: true };
}
