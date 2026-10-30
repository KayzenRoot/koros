import { createHash } from 'node:crypto';

export const OUTBOX_LIMITS = Object.freeze({
  BASE_BACKOFF_SECONDS: 5,
  MAX_BACKOFF_SECONDS: 900,
  MAX_ATTEMPTS: 5,
  LEASE_SECONDS: 60,
});

export const FAILURE_CLASS = Object.freeze({
  RETRY: 'RETRY',
  UNCERTAIN: 'UNCERTAIN',
  PAUSE: 'PAUSE',
  TERMINAL: 'TERMINAL',
});

/**
 * The durable idempotency tuple is tenant + source + external_id + payload_version.
 * NUL separators prevent ambiguous concatenations such as ("ab", "c") vs ("a", "bc").
 */
export function operationKey({ tenantId, source, externalId, payloadVersion }) {
  return createHash('sha256')
    .update(`${tenantId}\u0000${source}\u0000${externalId}\u0000${payloadVersion}`)
    .digest('hex');
}

export function backoffSeconds(attempts) {
  if (!Number.isInteger(attempts) || attempts < 1) return OUTBOX_LIMITS.BASE_BACKOFF_SECONDS;
  return Math.min(
    OUTBOX_LIMITS.BASE_BACKOFF_SECONDS * 2 ** (attempts - 1),
    OUTBOX_LIMITS.MAX_BACKOFF_SECONDS,
  );
}

/**
 * A timeout is ambiguous: the provider may have committed the write. It must be
 * reconciled, never retried as if it had failed. 429/5xx are retryable.
 */
export function classifyDispatchError(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  const status = Number(error?.status);
  if (code === 'QUOTA_EXCEEDED' || code === 'QUOTA_EXHAUSTED') return FAILURE_CLASS.PAUSE;
  if (
    code === 'ETIMEDOUT' ||
    code === 'TIMEOUT' ||
    code === 'UNCERTAIN' ||
    error?.name === 'TimeoutError'
  ) {
    return FAILURE_CLASS.UNCERTAIN;
  }
  if (
    code === 'TRANSIENT' ||
    code === 'UNAVAILABLE' ||
    code === 'RATE_LIMITED' ||
    status === 429 ||
    (status >= 500 && status <= 599)
  ) {
    return FAILURE_CLASS.RETRY;
  }
  return FAILURE_CLASS.TERMINAL;
}

export function nextAttemptAt(now, attempts) {
  return new Date(now.getTime() + backoffSeconds(attempts) * 1000);
}
