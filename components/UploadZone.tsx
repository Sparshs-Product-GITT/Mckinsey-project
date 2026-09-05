'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { getApiError } from '@/lib/apiClient';
import { trackEvent } from '@/lib/analytics';
import type { Phase1Result } from '@/types/case';

interface UploadZoneProps {
  onUploadComplete: (phase1: Phase1Result, pdfFile: File, caseId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function UploadZone({ onUploadComplete, onError, disabled = false }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        onError('Please upload a PDF file.');
        return;
      }

      const MAX_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        onError('File size must be under 15MB.');
        return;
      }

      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        onError('Please complete the bot verification check below.');
        return;
      }

      setFileName(file.name);
      setUploading(true);
      setProgress(10);
      trackEvent('upload_started');

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (turnstileToken) {
          formData.append('turnstileToken', turnstileToken);
        }

        setProgress(20);
        const progressInterval = setInterval(() => {
          setProgress((prev) => (prev < 85 ? prev + Math.random() * 8 : prev));
        }, 800);

        const response = await fetch('/api/analyze-case', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          trackEvent('phase1_error', { status: response.status });
          throw new Error(await getApiError(response, 'Upload failed'));
        }

        setProgress(95);
        const data = await response.json();
        setProgress(100);
        trackEvent('phase1_success');

        setTimeout(() => {
          onUploadComplete(data.phase1, file, data.caseId);
        }, 500);
      } catch (err) {
        setUploading(false);
        setProgress(0);
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        onError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      }
    },
    [onUploadComplete, onError, turnstileToken]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading || disabled,
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        id="upload-dropzone"
        className={`upload-zone relative ${
          isDragActive ? 'upload-zone-active' : ''
        } ${uploading || disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <p className="font-mono text-sm text-[#c9a84c] mb-1">{fileName}</p>
              <p className="text-sm text-[#8896ab]">
                {progress < 30
                  ? 'Uploading PDF...'
                  : progress < 85
                  ? 'Analyzing case brief with AI...'
                  : progress < 100
                  ? 'Extracting insights...'
                  : 'Complete!'}
              </p>
            </div>

            <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-mono text-xs text-[#8896ab]">{Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#c9a84c]/10 group-hover:border-[#c9a84c]/20 transition-all duration-300">
              <svg
                className="w-8 h-8 text-[#8896ab] group-hover:text-[#c9a84c] transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-white font-medium mb-1">
                {isDragActive ? 'Drop your PDF here' : 'Drop your case brief PDF here'}
              </p>
              <p className="text-sm text-[#8896ab]">
                or <span className="text-[#c9a84c] hover:underline">browse files</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8896ab]/60">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>PDF only · Max 15MB</span>
            </div>
          </div>
        )}
      </div>

      {TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: 'dark', size: 'normal' }}
          />
        </div>
      )}
    </div>
  );
}
