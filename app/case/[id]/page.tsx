'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ClarifyingQA from '@/components/ClarifyingQA';
import CaseOutput from '@/components/CaseOutput';
import { getApiError } from '@/lib/apiClient';
import { loadCase } from '@/lib/caseStorage';
import type { Phase1Result, Phase2Solution, ClarifyingAnswer } from '@/types/case';

type PageState = 'loading' | 'clarifying' | 'solving' | 'solved' | 'error';

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [state, setState] = useState<PageState>('loading');
  const [phase1, setPhase1] = useState<Phase1Result | null>(null);
  const [solution, setSolution] = useState<Phase2Solution | null>(null);
  const [error, setError] = useState('');

  const pdfFileRef = useRef<File | null>(null);
  const lastAnswersRef = useRef<ClarifyingAnswer[] | null>(null);

  useEffect(() => {
    loadCase(caseId)
      .then((data) => {
        if (!data) {
          setError('Session not found. Please upload a new case brief.');
          setState('error');
          return;
        }

        setPhase1(data.phase1);
        pdfFileRef.current = new File([data.pdfBlob], 'case.pdf', {
          type: 'application/pdf',
        });
        setState('clarifying');
      })
      .catch(() => {
        setError('Failed to load case data. Please re-upload.');
        setState('error');
      });
  }, [caseId]);

  const handleClarifyComplete = async (answers: ClarifyingAnswer[]) => {
    lastAnswersRef.current = answers;
    setState('solving');

    const pdfFile = pdfFileRef.current;
    if (!pdfFile) {
      setError('PDF file not found. Please re-upload the case.');
      setState('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('phase1', JSON.stringify(phase1));
      formData.append('clarifyingAnswers', JSON.stringify(answers));

      const response = await fetch('/api/clarify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, 'Failed to generate solution'));
      }

      const data = await response.json();
      setSolution(data.solution);
      setState('solved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  return (
    <main className="flex-1 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#8896ab] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">New Case</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] flex items-center justify-center">
              <svg className="w-3 h-3 text-[#0a0f1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">CaseCoach</span>
          </div>

          {phase1 && (
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#c9a84c]/10 text-[#c9a84c] capitalize">
                {phase1.case_type?.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[#8896ab] text-sm">Loading case data...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-400 text-sm text-center max-w-md">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              {phase1 && pdfFileRef.current && lastAnswersRef.current && (
                <button
                  onClick={() => handleClarifyComplete(lastAnswersRef.current!)}
                  className="px-4 py-2 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#0a0f1e] text-sm rounded-lg font-medium hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white text-sm rounded-lg transition-colors border border-white/[0.08]"
              >
                Upload New Case
              </button>
            </div>
          </div>
        )}

        {state === 'clarifying' && phase1 && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                {phase1.case_title || 'Case Analysis'}
              </h2>
              <p className="text-[#8896ab]">
                {phase1.client_name} · {phase1.industry} · {phase1.geography}
              </p>

              {phase1.initial_hypotheses?.length > 0 && (
                <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <p className="text-xs font-mono text-[#c9a84c] uppercase tracking-wider mb-2">Initial Hypotheses</p>
                  <ul className="space-y-1">
                    {phase1.initial_hypotheses.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#b8c4d6]">
                        <span className="text-[#c9a84c] mt-0.5">{i + 1}.</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-xs font-mono text-[#8896ab] uppercase tracking-wider mb-1">Phase 2</p>
              <h3 className="text-xl font-heading text-white font-semibold">Clarifying Questions</h3>
              <p className="text-sm text-[#8896ab] mt-1">
                Answer the following to help generate a more accurate solution.
              </p>
            </div>

            <ClarifyingQA
              questions={phase1.clarifying_questions || []}
              onComplete={handleClarifyComplete}
            />
          </div>
        )}

        {state === 'solving' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#c9a84c] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-10" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl animate-pulse-ring border-2 border-[#c9a84c]/20" />
            </div>

            <div className="text-center">
              <h3 className="text-white font-heading text-xl font-semibold mb-2">Generating Solution</h3>
              <p className="text-[#8896ab] text-sm max-w-md">
                Analyzing the case brief, exhibits, and your answers to build a comprehensive,
                McKinsey-grade case solution...
              </p>
            </div>

            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#c9a84c] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {state === 'solved' && phase1 && solution && (
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/15 text-emerald-400">
                  ✓ Solution Ready
                </span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">
                {phase1.case_title || 'Case Solution'}
              </h2>
              <p className="text-[#8896ab] mt-1">
                {phase1.client_name} · {phase1.industry}
              </p>
            </div>

            <div className="stagger-children">
              <CaseOutput phase1={phase1} solution={solution} />
            </div>

            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-4 py-2 text-sm text-[#8896ab] hover:text-white transition-colors"
              >
                ↑ Back to top
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2 text-sm bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#0a0f1e] rounded-lg font-medium hover:shadow-lg hover:shadow-[#c9a84c]/20 transition-all"
              >
                Upload New Case
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
