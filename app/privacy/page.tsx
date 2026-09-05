import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="flex-1 relative">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#8896ab] hover:text-white transition-colors">
          ← Back to CaseCoach
        </Link>

        <h1 className="font-heading text-3xl font-bold text-white mt-6 mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#8896ab] mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-[#b8c4d6] leading-relaxed text-sm">
          <section>
            <h2 className="text-white font-medium mb-2">What we collect</h2>
            <p>
              CaseCoach AI processes PDF case briefs you upload and your clarifying question answers.
              We use anonymous analytics (page views and feature usage) when PostHog is configured.
              We do not collect your name, email, or account information.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-2">Where your data goes</h2>
            <p>
              Uploaded PDFs and answers are sent to Google Gemini for AI analysis. PDFs are not
              permanently stored on our servers. Phase 1 session data is held in Upstash Redis for
              up to 24 hours to link your upload to solution generation, then deleted.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-2">Browser storage</h2>
            <p>
              Your PDF and case progress are cached locally in your browser (IndexedDB) so you can
              continue a case without re-uploading. Clear your browser data to remove this cache.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-2">Do not upload confidential material</h2>
            <p>
              Do not upload proprietary, confidential, or client-sensitive documents. Use only
              practice case briefs intended for interview preparation.
            </p>
          </section>

          <section>
            <h2 className="text-white font-medium mb-2">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Gemini API — AI processing</li>
              <li>Cloudflare Turnstile — bot protection (when enabled)</li>
              <li>Upstash Redis — rate limiting and session storage (when enabled)</li>
              <li>PostHog — anonymous analytics (when enabled)</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
