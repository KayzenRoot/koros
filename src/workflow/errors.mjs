export const WORKFLOW_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_STATE: 'INVALID_STATE',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  STATE_MISMATCH: 'STATE_MISMATCH',
  NOT_FOUND: 'NOT_FOUND',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
});

export class WorkflowError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
  }
}
