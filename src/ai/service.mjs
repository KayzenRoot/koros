import { AI_ERROR, AiError } from './errors.mjs';
import {
  detectPromptInjection,
  deterministicFallback,
  parseClassificationInput,
  reviewReasons,
  validateClassificationOutput,
} from './schema.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  return value;
}

function requireAdapter(adapter) {
  if (
    !adapter ||
    typeof adapter !== 'object' ||
    typeof adapter.classify !== 'function' ||
    typeof adapter.provider !== 'string' ||
    typeof adapter.model !== 'string'
  ) {
    throw new AiError(AI_ERROR.INVALID_ADAPTER);
  }
}

function safeErrorCode(error) {
  const code = typeof error?.code === 'string' ? error.code : 'UNKNOWN';
  return /^[A-Z0-9_]{1,64}$/.test(code) ? code : 'UNKNOWN';
}

function fallbackResult({ adapter, reasonCode, modelCalled, validation, reasons, errorCode = null }) {
  return {
    classification: deterministicFallback(reasonCode),
    meta: {
      source: 'FALLBACK',
      provider: adapter.provider,
      model: adapter.model,
      model_called: modelCalled,
      validation,
      review_reasons: reasons,
      error_code: errorCode,
    },
  };
}

/**
 * Classifies a minimized synthetic input. The adapter is untrusted: it receives
 * no secrets/tools and its output is only a proposal, never an authorization.
 */
export async function classifyLead({ tenantId, input, adapter, timeoutMs = 3000 } = {}) {
  requireUuid(tenantId);
  requireAdapter(adapter);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  const normalizedInput = parseClassificationInput(input);

  if (detectPromptInjection(normalizedInput.intent)) {
    return fallbackResult({
      adapter,
      reasonCode: 'INJECTION_SUSPECTED',
      modelCalled: false,
      validation: 'NOT_ATTEMPTED',
      reasons: ['PROMPT_INJECTION_SUSPECTED'],
      errorCode: AI_ERROR.PROMPT_INJECTION,
    });
  }

  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AiError(AI_ERROR.TIMEOUT));
    }, timeoutMs);
  });

  let raw;
  try {
    raw = await Promise.race([
      Promise.resolve().then(() =>
        adapter.classify({ tenantId, input: normalizedInput, signal: controller.signal }),
      ),
      timeout,
    ]);
  } catch (error) {
    clearTimeout(timer);
    const timeoutError = error?.code === AI_ERROR.TIMEOUT;
    return fallbackResult({
      adapter,
      reasonCode: timeoutError ? 'TIMEOUT' : 'ADAPTER_FAILURE',
      modelCalled: true,
      validation: 'NOT_ACCEPTED',
      reasons: [timeoutError ? 'MODEL_TIMEOUT' : 'MODEL_ADAPTER_FAILURE'],
      errorCode: safeErrorCode(error),
    });
  }
  clearTimeout(timer);

  let classification;
  try {
    classification = validateClassificationOutput(raw);
  } catch (error) {
    const hallucinated = error?.code === AI_ERROR.HALLUCINATED_STATUS;
    return fallbackResult({
      adapter,
      reasonCode: hallucinated ? 'HALLUCINATED_STATUS' : 'INVALID_MODEL_OUTPUT',
      modelCalled: true,
      validation: 'REJECTED',
      reasons: [hallucinated ? 'MODEL_CLAIMED_STATUS' : 'MODEL_OUTPUT_OUTSIDE_SCHEMA'],
      errorCode: safeErrorCode(error),
    });
  }

  const reasons = reviewReasons(classification, normalizedInput);
  if (reasons.length > 0) classification.requires_human_review = true;
  return {
    classification,
    meta: {
      source: 'AI',
      provider: adapter.provider,
      model: adapter.model,
      model_called: true,
      validation: 'ACCEPTED',
      review_reasons: reasons,
      error_code: null,
    },
  };
}
