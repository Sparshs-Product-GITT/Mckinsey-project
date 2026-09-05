# CaseCoach AI

Upload a case brief PDF and receive a structured, McKinsey-grade case solution — complete with driver trees, root cause analysis, and strategic recommendations.

## Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and add your Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to get it |
   |----------|-----------------|
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Upload** a case brief PDF (max 15 MB)
2. **Answer** AI-generated clarifying questions
3. **Receive** a full structured case solution

## Limits

- **PDF size:** 15 MB maximum
- **Gemini API:** Subject to Google free-tier daily quotas; enable billing for higher limits
- **Phase 1 / Phase 2 duration:** Typically 30–120 seconds per API call (long-running AI analysis)

## Deploy on Render

This app runs as a **Render Web Service** (Node.js, not serverless), so long Gemini API calls work without a 10-second timeout.

1. Push this repo to GitHub and connect GitHub in the [Render dashboard](https://dashboard.render.com).
2. **New + → Blueprint** → select the repo. Render reads [`render.yaml`](render.yaml).
3. Set **`GEMINI_API_KEY`** in the Render environment when prompted (never commit secrets).
4. After deploy, verify `GET /api/health` returns `"gemini": true`.

**Free tier notes:** The service spins down after ~15 minutes of idle traffic. The first visit after idle may take 30–60 seconds to wake up. Phase 1 and Phase 2 can each take up to ~2 minutes on a live case.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
