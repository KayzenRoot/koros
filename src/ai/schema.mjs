import { AI_ERROR, AiError } from './errors.mjs';

export const AI_INTENTS = Object.freeze(['demo', 'pricing', 'support', 'other']);
export const AI_REASON_CODES = Object.freeze([
  'EXPLICIT_REQUEST',
  'KEYWORD_MATCH',
  'LOW_SIGNAL',
  'INJECTION_SUSPECTED',
  'TIMEOUT',
  'INVALID_MODEL_OUTPUT',
  'HALLUCINATED_STATUS',
  'ADAPTER_FAILURE',
]);
export const CONSENT_VALUES = Object.freeze(['GRANTED', 'DENIED', 'UNKNOWN']);

const INPUT_FIELDS = new Set(['intent', 'consent_status']);
const OUTPUT_FIELDS = Object.freeze([
  'schema_version',
  'intent',
  'confidence',
  'uncertainty',
  'reason_code',
  'requires_human_review',
]);
const OUTPUT_FIELD_SET = new Set(OUTPUT_FIELDS);
const FORBIDDEN_OUTPUT_FIELDS = new Set([
  'status',
  'decision',
  'approval',
  'approved',
  'authorized',
  'authorization',
  'action',
  'tool',
  'tools',
  'crm',
  'write',
  'execute',
]);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const INJECTION_PATTERNS = Object.freeze([
  /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /disregard\s+(the\s+)?(system|previous)\s+(prompt|instructions?)/i,
  /\b(system|developer)\s*:/i,
  /you\s+are\s+now\b/i,
  /<\s*script\b/i,
  /\b(approve|authorize|execute|write\s+to\s+crm)\b/i,
]);

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseClassificationInput(input) {
  if (!isPlainObject(input)) throw new AiError(AI_ERROR.INVALID_INPUT);
  for (const key of Object.keys(input)) {
    if (!INPUT_FIELDS.has(key)) throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  if (typeof input.intent !== 'string') throw new AiError(AI_ERROR.INVALID_INPUT);
  const intent = input.intent.trim();
  if (!intent || intent.length > 500 || CONTROL_CHARS.test(intent)) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  const consent = input.consent_status ?? 'UNKNOWN';
  if (!CONSENT_VALUES.includes(consent)) throw new AiError(AI_ERROR.INVALID_INPUT);
  return { intent, consent_status: consent };
}

/** The input is data, never an instruction. Detection routes to deterministic review. */
export function detectPromptInjection(intent) {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(intent));
}

export function validateClassificationOutput(raw) {
  if (!isPlainObject(raw)) throw new AiError(AI_ERROR.INVALID_OUTPUT);
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_OUTPUT_FIELDS.has(key)) throw new AiError(AI_ERROR.HALLUCINATED_STATUS);
    if (!OUTPUT_FIELD_SET.has(key)) throw new AiError(AI_ERROR.INVALID_OUTPUT);
  }
  if (OUTPUT_FIELDS.some((field) => !Object.hasOwn(raw, field))) {
    throw new AiError(AI_ERROR.INVALID_OUTPUT);
  }
  if (raw.schema_version !== 1) throw new AiError(AI_ERROR.INVALID_OUTPUT);
  if (!AI_INTENTS.includes(raw.intent)) throw new AiError(AI_ERROR.INVALID_OUTPUT);
  if (
    typeof raw.confidence !== 'number' ||
    !Number.isFinite(raw.confidence) ||
    raw.confidence < 0 ||
    raw.confidence > 1
  ) {
    throw new AiError(AI_ERROR.INVALID_OUTPUT);
  }
  if (
    typeof raw.uncertainty !== 'number' ||
    !Number.isFinite(raw.uncertainty) ||
    raw.uncertainty < 0 ||
    raw.uncertainty > 1
  ) {
    throw new AiError(AI_ERROR.INVALID_OUTPUT);
  }
  if (!AI_REASON_CODES.includes(raw.reason_code)) throw new AiError(AI_ERROR.INVALID_OUTPUT);
  if (typeof raw.requires_human_review !== 'boolean') throw new AiError(AI_ERROR.INVALID_OUTPUT);
  return {
    schema_version: 1,
    intent: raw.intent,
    confidence: raw.confidence,
    uncertainty: raw.uncertainty,
    reason_code: raw.reason_code,
    requires_human_review: raw.requires_human_review,
  };
}

export function deterministicFallback(reasonCode) {
  const code = AI_REASON_CODES.includes(reasonCode) ? reasonCode : 'INVALID_MODEL_OUTPUT';
  return {
    schema_version: 1,
    intent: 'other',
    confidence: 0,
    uncertainty: 1,
    reason_code: code,
    requires_human_review: true,
  };
}

/** Model confidence never authorizes; low certainty or consent always forces review. */
export function reviewReasons(classification, input) {
  const reasons = [];
  if (classification.confidence < 0.7) reasons.push('LOW_CONFIDENCE');
  if (classification.uncertainty > 0.3) reasons.push('HIGH_UNCERTAINTY');
  if (input.consent_status !== 'GRANTED') reasons.push('CONSENT_NOT_GRANTED');
  if (classification.requires_human_review) reasons.push('MODEL_REQUESTED_REVIEW');
  return reasons;
}
