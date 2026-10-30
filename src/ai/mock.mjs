import { AI_ERROR, AiError } from './errors.mjs';

export const MOCK_AI_PROVIDER = 'mock';
export const MOCK_AI_MODEL = 'deterministic-v1';

function abortableDelay(delayMs, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AiError(AI_ERROR.TIMEOUT));
      return;
    }
    const timer = setTimeout(resolve, delayMs);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new AiError(AI_ERROR.TIMEOUT));
        },
        { once: true },
      );
    }
  });
}

/** Deterministic, local-only classifier. It has no SDK, token, network or CRM access. */
export function createMockAiAdapter() {
  return {
    provider: MOCK_AI_PROVIDER,
    model: MOCK_AI_MODEL,
    mode: 'mock',
    async classify({ input, signal } = {}) {
      if (signal?.aborted) throw new AiError(AI_ERROR.TIMEOUT);
      const text = input.intent.toLowerCase();
      if (/\bdemo\b|demonstra/.test(text)) {
        return {
          schema_version: 1,
          intent: 'demo',
          confidence: 0.92,
          uncertainty: 0.08,
          reason_code: 'EXPLICIT_REQUEST',
          requires_human_review: false,
        };
      }
      if (/\bpric|pre[cç]o|cost|valor\b/.test(text)) {
        return {
          schema_version: 1,
          intent: 'pricing',
          confidence: 0.88,
          uncertainty: 0.12,
          reason_code: 'EXPLICIT_REQUEST',
          requires_human_review: false,
        };
      }
      if (/\bsupport|suporte|help|ajuda\b/.test(text)) {
        return {
          schema_version: 1,
          intent: 'support',
          confidence: 0.84,
          uncertainty: 0.16,
          reason_code: 'KEYWORD_MATCH',
          requires_human_review: true,
        };
      }
      return {
        schema_version: 1,
        intent: 'other',
        confidence: 0.35,
        uncertainty: 0.65,
        reason_code: 'LOW_SIGNAL',
        requires_human_review: true,
      };
    },
  };
}

/** Test/fixture adapter: returns exactly the supplied value, optionally after a delay. */
export function createStaticAiAdapter(output, { delayMs = 0 } = {}) {
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60_000) {
    throw new AiError(AI_ERROR.INVALID_ADAPTER);
  }
  return {
    provider: 'mock-static',
    model: 'fixture-v1',
    mode: 'mock',
    async classify({ signal } = {}) {
      if (delayMs > 0) await abortableDelay(delayMs, signal);
      return output;
    },
  };
}
