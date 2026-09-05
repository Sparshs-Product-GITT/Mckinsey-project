'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 bg-[#0a0f1e]">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-white font-heading text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-[#8896ab] text-sm text-center max-w-md mb-6">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-colors border border-white/[0.08]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#0a0f1e] rounded-lg font-medium"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
