import { AI_ERROR, AiError } from './errors.mjs';
import { AI_INTENTS } from './schema.mjs';
import { classifyLead } from './service.mjs';

function validateCase(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  if (!AI_INTENTS.includes(item.expectedIntent)) throw new AiError(AI_ERROR.INVALID_INPUT);
  if (item.expectReview !== undefined && typeof item.expectReview !== 'boolean') {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  return { ...item, index };
}

/** Reproducible fixture evaluation over synthetic inputs; writes nothing. */
export async function evaluateClassification({ tenantId, adapter, cases, timeoutMs = 3000 } = {}) {
  if (!Array.isArray(cases) || cases.length === 0 || cases.length > 100) {
    throw new AiError(AI_ERROR.INVALID_INPUT);
  }
  const normalizedCases = cases.map((item, index) => validateCase(item, index));

  const rows = await Promise.all(
    normalizedCases.map(async (item) => {
      const result = await classifyLead({
        tenantId,
        input: item.input,
        adapter,
        timeoutMs,
      });
      return {
        name: item.name,
        expectedIntent: item.expectedIntent,
        actualIntent: result.classification.intent,
        expectReview: item.expectReview,
        requiresReview: result.classification.requires_human_review,
        source: result.meta.source,
        validation: result.meta.validation,
      };
    }),
  );

  const total = rows.length;
  const correct = rows.filter((row) => row.actualIntent === row.expectedIntent).length;
  const reviewCases = rows.filter((row) => row.expectReview !== undefined);
  const reviewCorrect = reviewCases.filter((row) => row.requiresReview === row.expectReview).length;

  return {
    total,
    correct,
    accuracy: Number((correct / total).toFixed(4)),
    reviewCases: reviewCases.length,
    reviewCorrect,
    reviewAccuracy: reviewCases.length
      ? Number((reviewCorrect / reviewCases.length).toFixed(4))
      : null,
    fallbackCount: rows.filter((row) => row.source === 'FALLBACK').length,
    acceptedCount: rows.filter((row) => row.source === 'AI').length,
    reviewRequiredCount: rows.filter((row) => row.requiresReview).length,
    rows,
  };
}
