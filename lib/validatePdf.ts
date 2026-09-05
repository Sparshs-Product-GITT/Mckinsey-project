const PDF_MAGIC = Buffer.from('%PDF-');

export function validatePdfBuffer(buffer: Buffer): { ok: true } | { ok: false; error: string } {
  if (buffer.length < 5) {
    return { ok: false, error: 'File is empty or too small to be a valid PDF.' };
  }

  if (!buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    return { ok: false, error: 'Invalid PDF file. The file must be a valid PDF document.' };
  }

  return { ok: true };
}
