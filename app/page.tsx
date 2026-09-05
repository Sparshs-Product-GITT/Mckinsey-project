'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import { saveCase } from '@/lib/caseStorage';
import type { Phase1Result } from '@/types/case';

const CASE_TYPES = [
  { label: 'Profitability Problem', icon: '📉', color: 'border-red-500/20 text-red-400 bg-red-500/5' },
  { label: 'Market Entry', icon: '🚀', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
  { label: 'Pricing Strategy', icon: '💰', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
  { label: 'M&A / Merger', icon: '🤝', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
  { label: 'Growth Strategy', icon: '📈', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
];

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [serviceOk, setServiceOk] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  React.useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { ok?: boolean }) => setServiceOk(data.ok !== false))
      .catch(() => setServiceOk(false));
  }, []);

  const handleUploadComplete = useCallback(
    async (phase1: Phase1Result, pdfFile: File, caseId: string) => {
      try {
        await saveCase(caseId, { phase1, pdfBlob: pdfFile });
        router.push(`/case/${caseId}`);
      } catch {
        setError('Failed to save case data locally. Please try uploading again.');
      }
    },
    [router]
  );

  return (
    <main className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#c9a84c]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#3b82f6]/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {!serviceOk && (
          <div className="w-full max-w-2xl mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400 text-center animate-fade-in-up">
            Service is temporarily unavailable. Please try again later.
          </div>
        )}

        <div className="animate-fade-in-up mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0a0f1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-mono text-sm text-[#c9a84c] tracking-widest uppercase">CaseCoach AI</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-white">Crack Any </span>
            <span className="text-gradient-gold">Case Interview</span>
          </h1>

          <p className="text-lg text-[#8896ab] max-w-xl mx-auto leading-relaxed">
            Upload a case brief PDF and receive a structured, McKinsey-grade solution —
            complete with driver trees, root cause analysis, and strategic recommendations.
          </p>
        </div>

        <label className="animate-fade-in-up w-full max-w-2xl mb-4 flex items-start gap-3 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 rounded border-white/20 bg-white/5 text-[#c9a84c] focus:ring-[#c9a84c]"
          />
          <span className="text-sm text-[#8896ab]">
            I confirm this PDF is not confidential or proprietary.{' '}
            <Link href="/privacy" className="text-[#c9a84c] hover:underline">
              Privacy policy
            </Link>
          </span>
        </label>

        <div className="animate-fade-in-up w-full max-w-2xl" style={{ animationDelay: '0.15s' }}>
          <UploadZone
            onUploadComplete={handleUploadComplete}
            onError={(msg) => setError(msg)}
            disabled={!confirmed}
          />
        </div>

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 animate-fade-in-up">
            {error}
          </div>
        )}

        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs font-mono text-[#8896ab]/50 text-center mb-3 uppercase tracking-wider">
            Supported case types
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CASE_TYPES.map((type) => (
              <span
                key={type.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 hover:scale-105 ${type.color}`}
              >
                <span>{type.icon}</span>
                {type.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-16 max-w-3xl w-full animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <p className="text-xs font-mono text-[#8896ab]/50 text-center mb-6 uppercase tracking-wider">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'Upload PDF',
                desc: 'Drop your case brief with exhibits, charts, and tables',
                icon: '📄',
              },
              {
                step: '02',
                title: 'Answer Questions',
                desc: 'Respond to AI-generated clarifying questions',
                icon: '💬',
              },
              {
                step: '03',
                title: 'Get Solution',
                desc: 'Receive a structured, partner-ready case solution',
                icon: '🎯',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative px-5 py-5 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
              >
                <span className="font-mono text-xs text-[#c9a84c]/40 mb-3 block">{item.step}</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <h3 className="text-white font-medium">{item.title}</h3>
                </div>
                <p className="text-sm text-[#8896ab]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center space-y-2">
          <p className="text-xs text-[#8896ab]/30 font-mono">
            Powered by Gemini AI · Built for case interview preparation
          </p>
          <Link href="/privacy" className="text-xs text-[#8896ab]/50 hover:text-[#8896ab] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
