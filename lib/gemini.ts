import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { Phase1Result, Phase2Solution, ClarifyingAnswer } from '@/types/case';
import { parseJsonResponse } from './caseParser';

// ------------------------------------------------
// Lazy-initialized model instances
// ------------------------------------------------

let _phase1Model: GenerativeModel | null = null;
let _phase2Model: GenerativeModel | null = null;

/** Override via GEMINI_MODEL in .env.local if Google deprecates the default */
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
const FALLBACK_GEMINI_MODEL = process.env.GEMINI_MODEL_FALLBACK ?? 'gemini-3.5-flash-lite';

function createModel(modelName: string, maxOutputTokens: number): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });
}

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiUserError(
      'Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.',
      { statusCode: 500 }
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/** Phase 1 model — smaller output, fast analysis */
function getPhase1Model(): GenerativeModel {
  if (!_phase1Model) {
    _phase1Model = createModel(DEFAULT_GEMINI_MODEL, 16384);
  }
  return _phase1Model;
}

/** Phase 2 model — large output for comprehensive solutions */
function getPhase2Model(): GenerativeModel {
  if (!_phase2Model) {
    _phase2Model = createModel(DEFAULT_GEMINI_MODEL, 32768);
  }
  return _phase2Model;
}

// ------------------------------------------------
// Error classification & retry helpers
// ------------------------------------------------

/** User-friendly error that is safe to display in the UI */
export class GeminiUserError extends Error {
  public readonly statusCode: number;
  public readonly isQuotaError: boolean;
  public readonly isRateLimit: boolean;

  constructor(
    message: string,
    opts: { statusCode?: number; isQuotaError?: boolean; isRateLimit?: boolean } = {}
  ) {
    super(message);
    this.name = 'GeminiUserError';
    this.statusCode = opts.statusCode ?? 500;
    this.isQuotaError = opts.isQuotaError ?? false;
    this.isRateLimit = opts.isRateLimit ?? false;
  }
}

function classifyAndThrow(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  // Quota exhaustion (free tier limit reached)
  if (lower.includes('429') && (lower.includes('quota') || lower.includes('exceeded'))) {
    throw new GeminiUserError(
      'API quota exceeded. The free tier daily limit has been reached. Please try again tomorrow, or enable billing on your Google Cloud project for higher limits.',
      { statusCode: 429, isQuotaError: true }
    );
  }

  // Transient rate limit (too many requests per minute)
  if (lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit')) {
    throw new GeminiUserError(
      'Too many requests. Please wait a moment and try again.',
      { statusCode: 429, isRateLimit: true }
    );
  }

  // Model not found / deprecated
  if (lower.includes('404') || lower.includes('not found') || lower.includes('no longer available')) {
    throw new GeminiUserError(
      `Gemini model "${DEFAULT_GEMINI_MODEL}" is unavailable. Set GEMINI_MODEL in .env.local (e.g. gemini-3.6-flash).`,
      { statusCode: 500 }
    );
  }

  // Auth / API key issues
  if (lower.includes('401') || lower.includes('403') || lower.includes('api key')) {
    throw new GeminiUserError(
      'AI service authentication failed. Please check the API key configuration.',
      { statusCode: 500 }
    );
  }

  // Safety / content filters
  if (lower.includes('safety') || lower.includes('blocked')) {
    throw new GeminiUserError(
      'The content was blocked by safety filters. Please try with a different PDF.',
      { statusCode: 400 }
    );
  }

  // Temporary overload (503)
  if (
    lower.includes('503') ||
    lower.includes('service unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded')
  ) {
    throw new GeminiUserError(
      'The AI service is temporarily overloaded. Please wait 30 seconds and try again.',
      { statusCode: 503, isRateLimit: true }
    );
  }

  // Generic fallback
  throw new GeminiUserError(
    'An error occurred while processing your case. Please try again.',
    { statusCode: 500 }
  );
}

/**
 * Call Gemini with automatic retry + exponential backoff for transient errors.
 * Quota exhaustion errors are NOT retried (they won't resolve by waiting seconds).
 */
async function callWithRetry(
  model: GenerativeModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: any[],
  maxRetries = 3
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(parts);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const lower = message.toLowerCase();

      console.error(`[Gemini] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, message.slice(0, 300));

      const isTransientRateLimit =
        (lower.includes('429') || lower.includes('too many requests')) &&
        !lower.includes('quota') &&
        !lower.includes('exceeded');

      const isTransientOverload =
        lower.includes('503') ||
        lower.includes('service unavailable') ||
        lower.includes('high demand') ||
        lower.includes('overloaded');

      if ((isTransientRateLimit || isTransientOverload) && attempt < maxRetries) {
        const delay = Math.pow(3, attempt) * 2000;
        console.warn(
          `Gemini transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      classifyAndThrow(err);
    }
  }

  throw new GeminiUserError('Failed to get a response from the AI after multiple attempts.');
}

async function callWithModelFallback(
  parts: Parameters<typeof callWithRetry>[1],
  maxOutputTokens: number
) {
  try {
    return await callWithRetry(getPhase2Model(), parts, 3);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    const isOverload =
      (err instanceof GeminiUserError && err.isRateLimit) ||
      lower.includes('503') ||
      lower.includes('service unavailable') ||
      lower.includes('high demand') ||
      lower.includes('overloaded');

    if (isOverload && FALLBACK_GEMINI_MODEL !== DEFAULT_GEMINI_MODEL) {
      console.warn(`[Gemini] Falling back to ${FALLBACK_GEMINI_MODEL} for Phase 2`);
      const fallbackModel = createModel(FALLBACK_GEMINI_MODEL, maxOutputTokens);
      return callWithRetry(fallbackModel, parts, 2);
    }

    throw err;
  }
}

// ------------------------------------------------
// Phase 1 — Context Extraction & Case Classification
// ------------------------------------------------

const PHASE_1_PROMPT = `You are an expert McKinsey case interview coach. A candidate has uploaded a case brief PDF (which may include exhibits, charts, tables, and quantitative data).

Your task is to perform Phase 1: Deep Context Extraction.

Extract and return a JSON object with this exact structure:

{
  "case_title": "string",
  "client_name": "string",
  "industry": "string",
  "geography": "string",
  "case_type": "problem | opportunity | market_entry | pricing | feasibility | merger",
  "core_objective": "string — what does the client want to achieve or resolve?",
  "key_facts": ["array of all critical facts stated in the case"],
  "revenue_model": "string — how does the client make money?",
  "value_chain_summary": "string — brief description of client's value chain",
  "exhibits_present": true | false,
  "exhibit_descriptions": ["list each exhibit: type (chart/table/graph), what data it shows"],
  "information_already_given": ["list all context explicitly provided in the brief"],
  "missing_context": ["list of information NOT given that would be critical to solve this case"],
  "clarifying_questions": [
    {
      "question": "string",
      "why_important": "string",
      "category": "market | financials | operations | competition | customer | strategy"
    }
  ],
  "initial_hypotheses": ["array of 3-5 initial hypotheses based purely on what's given"]
}

Rules:
- Only use information FROM the PDF. Do not hallucinate facts.
- Clarifying questions must be ONLY for information NOT already in the brief.
- Generate 4-7 clarifying questions, prioritized by impact on case resolution.
- Keep initial_hypotheses grounded in the case facts.

Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

// ------------------------------------------------
// Phase 2 — Full Structured Solution
// ------------------------------------------------

function buildPhase2Prompt(phase1JSON: Phase1Result, answers: ClarifyingAnswer[]): string {
  return `You are a McKinsey Associate solving a case interview. You have:
1. The original case brief (PDF attached)
2. Phase 1 context: ${JSON.stringify(phase1JSON)}
3. Clarifying answers from the candidate: ${JSON.stringify(answers)}

Now generate the COMPLETE structured case solution as JSON with this exact schema:

{
  "case_summary": "2-3 sentence executive summary of the situation",
  
  "case_type_rationale": "Why this is classified as [problem/opportunity/etc] and what that means for the solving approach",

  "framework_selected": {
    "name": "Primary framework name (e.g. Profitability Tree, Porter's Five Forces, Market Entry Framework, 4Cs, MECE Revenue Breakdown)",
    "why_chosen": "Reasoning for selecting this framework given case context",
    "alternatives_considered": ["Other frameworks considered and why rejected"]
  },

  "driver_tree": {
    "root_metric": "The core KPI being affected (e.g. Revenue, Market Share, Profit)",
    "level_1": ["Top-level drivers — MECE breakdown of root metric"],
    "level_2": {
      "driver_name_1": ["Sub-drivers of driver 1"],
      "driver_name_2": ["Sub-drivers of driver 2"]
    },
    "level_3": {
      "sub_driver_name": ["Leaf-level factors, most granular"]
    },
    "pinpointed_issue": "Which specific node in the tree is the root cause or opportunity?"
  },

  "root_cause_analysis": {
    "primary_causes": [
      {
        "cause": "string",
        "evidence_from_case": "string",
        "driver_tree_node": "string — which node in driver tree",
        "confidence": "high | medium | low"
      }
    ],
    "secondary_causes": ["array of supporting/contributing factors"],
    "ruled_out": ["Hypotheses that can be eliminated and why"]
  },

  "exhibit_analysis": [
    {
      "exhibit_id": "Exhibit 1 / Chart 1 / Table 1 etc",
      "qualitative_observations": ["What patterns, anomalies, trends are visible at a glance?"],
      "quantitative_insights": ["Key numbers, ratios, deltas that matter"],
      "hypothesis_confirmed": "Which hypothesis does this confirm or refute?",
      "calculations_performed": [
        {
          "what": "Description of calculation",
          "formula": "Formula used",
          "result": "Result with units"
        }
      ]
    }
  ],

  "solution": {
    "headline_recommendation": "One clear sentence: what should the client do?",
    "strategic_pillars": [
      {
        "pillar_name": "string",
        "description": "string",
        "specific_actions": ["3-5 concrete actions"],
        "example": "A real-world example or analogy to illustrate",
        "expected_impact": "Quantified or qualified impact",
        "timeframe": "short-term (0-6mo) | medium-term (6-18mo) | long-term (18mo+)"
      }
    ],
    "quick_wins": ["Actions that can be taken immediately with high impact/low effort"],
    "risks_and_mitigations": [
      {
        "risk": "string",
        "mitigation": "string"
      }
    ]
  },

  "quantitative_summary": {
    "key_calculations": [
      {
        "label": "e.g. Break-even units",
        "formula": "Fixed Costs / Contribution Margin",
        "working": "Step by step math",
        "answer": "Final number with units"
      }
    ],
    "sanity_checks": ["Cross-checks performed to validate numbers"]
  },

  "closing_recommendation": {
    "three_key_points": ["Point 1", "Point 2", "Point 3"],
    "next_steps": ["Immediate next step 1", "next step 2", "next step 3"],
    "open_questions": ["What would you still want to investigate with more data?"]
  }
}

Rules:
- Every recommendation must be grounded in case facts or clarifying answers. No hallucination.
- For every exhibit in the PDF, include an exhibit_analysis entry.
- Driver tree must be MECE at every level.
- Include real calculations where quantitative data exists.
- strategic_pillars must always include a concrete real-world example.
- If multiple root causes exist, include ALL of them in primary_causes.
- Return ONLY valid JSON. No markdown, no explanation, no code fences.`;
}

// ------------------------------------------------
// API Functions
// ------------------------------------------------

export async function analyzeCase(base64PDF: string): Promise<Phase1Result> {
  const pdfPart = {
    inlineData: {
      mimeType: 'application/pdf' as const,
      data: base64PDF,
    },
  };

  const result = await callWithRetry(getPhase1Model(), [pdfPart, { text: PHASE_1_PROMPT }]);
  const text = result.response.text();
  const parsed = parseJsonResponse<Phase1Result>(text);

  if (!parsed) {
    // Retry once with explicit instruction
    const retry = await callWithRetry(getPhase1Model(), [
      pdfPart,
      { text: PHASE_1_PROMPT + '\n\nCRITICAL: Return ONLY valid JSON. No markdown code fences, no explanation text.' },
    ]);
    const retryParsed = parseJsonResponse<Phase1Result>(retry.response.text());
    if (!retryParsed) {
      throw new GeminiUserError('Failed to parse the AI response. Please try uploading again.');
    }
    return retryParsed;
  }

  return parsed;
}

export async function solveCaseWithContext(
  base64PDF: string,
  phase1: Phase1Result,
  answers: ClarifyingAnswer[]
): Promise<Phase2Solution> {
  const prompt = buildPhase2Prompt(phase1, answers);
  const pdfPart = {
    inlineData: {
      mimeType: 'application/pdf' as const,
      data: base64PDF,
    },
  };

  const result = await callWithModelFallback([pdfPart, { text: prompt }], 32768);
  const text = result.response.text();
  const parsed = parseJsonResponse<Phase2Solution>(text);

  if (!parsed) {
    const retry = await callWithModelFallback(
      [pdfPart, { text: prompt + '\n\nCRITICAL: Return ONLY valid JSON. No markdown code fences, no explanation text.' }],
      32768
    );
    const retryParsed = parseJsonResponse<Phase2Solution>(retry.response.text());
    if (!retryParsed) {
      throw new GeminiUserError('Failed to parse the AI solution. Please try again.');
    }
    return retryParsed;
  }

  return parsed;
}
