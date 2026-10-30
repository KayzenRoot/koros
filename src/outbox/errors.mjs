export const OUTBOX_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVAL_MISMATCH: 'APPROVAL_MISMATCH',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  RUN_NOT_APPROVED: 'RUN_NOT_APPROVED',
  NOT_FOUND: 'NOT_FOUND',
});

export class OutboxError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'OutboxError';
    this.code = code;
  }
}
