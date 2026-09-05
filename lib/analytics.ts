'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!key || initialized || typeof window === 'undefined') return;

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

export function trackEvent(
  event: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === 'undefined') return;
  posthog.capture(event, properties);
}
