import { z } from 'zod';

const MAX_STRING = 2000;
const MAX_ARRAY = 20;

const boundedString = z.string().max(MAX_STRING);
const boundedStringArray = z.array(boundedString.max(MAX_STRING)).max(MAX_ARRAY);

export const clarifyingQuestionSchema = z.object({
  question: boundedString,
  why_important: boundedString,
  category: z.enum(['market', 'financials', 'operations', 'competition', 'customer', 'strategy']),
});

export const phase1ResultSchema = z.object({
  case_title: boundedString,
  client_name: boundedString,
  industry: boundedString,
  geography: boundedString,
  case_type: z.enum(['problem', 'opportunity', 'market_entry', 'pricing', 'feasibility', 'merger']),
  core_objective: boundedString,
  key_facts: boundedStringArray,
  revenue_model: boundedString,
  value_chain_summary: boundedString,
  exhibits_present: z.boolean(),
  exhibit_descriptions: boundedStringArray,
  information_already_given: boundedStringArray,
  missing_context: boundedStringArray,
  clarifying_questions: z.array(clarifyingQuestionSchema).max(MAX_ARRAY),
  initial_hypotheses: boundedStringArray,
});

export const clarifyingAnswerSchema = z.object({
  question: boundedString,
  answer: boundedString,
});

export const clarifyingAnswersSchema = z.array(clarifyingAnswerSchema).max(MAX_ARRAY);

export type ValidatedPhase1 = z.infer<typeof phase1ResultSchema>;
export type ValidatedClarifyingAnswer = z.infer<typeof clarifyingAnswerSchema>;

export function parseClarifyingAnswers(raw: string): ValidatedClarifyingAnswer[] {
  if (raw.length > 100_000) {
    throw new Error('Clarifying answers payload is too large.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid clarifying answers JSON.');
  }

  const result = clarifyingAnswersSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('Clarifying answers failed validation.');
  }

  return result.data;
}
