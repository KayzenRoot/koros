import { WORKFLOW_ERROR, WorkflowError } from './errors.mjs';

/** Canonical M04 states. Legacy M02/M03 states remain in the DB check for compatibility. */
export const WORKFLOW_STATES = Object.freeze([
  'RECEIVED',
  'VALIDATED',
  'PROPOSED',
  'PENDING_APPROVAL',
  'REJECTED',
  'EXPIRED',
  'APPROVED',
  'QUEUED',
  'RECONCILING',
  'COMPLETED',
  'FAILED',
  'PAUSED',
]);

export const TERMINAL_STATES = Object.freeze(['REJECTED', 'EXPIRED', 'COMPLETED', 'FAILED']);

const TRANSITIONS = Object.freeze({
  RECEIVED: Object.freeze(['VALIDATED', 'REJECTED', 'FAILED']),
  VALIDATED: Object.freeze(['PROPOSED', 'REJECTED', 'FAILED']),
  PROPOSED: Object.freeze(['PENDING_APPROVAL', 'REJECTED', 'EXPIRED', 'FAILED']),
  PENDING_APPROVAL: Object.freeze(['APPROVED', 'REJECTED', 'EXPIRED', 'FAILED']),
  APPROVED: Object.freeze(['QUEUED', 'EXPIRED', 'FAILED']),
  QUEUED: Object.freeze(['RECONCILING', 'COMPLETED', 'FAILED', 'PAUSED']),
  RECONCILING: Object.freeze(['QUEUED', 'COMPLETED', 'FAILED', 'PAUSED']),
  PAUSED: Object.freeze(['QUEUED', 'FAILED', 'EXPIRED']),
  REJECTED: Object.freeze([]),
  EXPIRED: Object.freeze([]),
  COMPLETED: Object.freeze([]),
  FAILED: Object.freeze([]),
});

export function isKnownState(state) {
  return typeof state === 'string' && Object.hasOwn(TRANSITIONS, state);
}

export function allowedTransitions(state) {
  if (!isKnownState(state)) throw new WorkflowError(WORKFLOW_ERROR.INVALID_STATE);
  return [...TRANSITIONS[state]];
}

export function canTransition(from, to) {
  return isKnownState(from) && isKnownState(to) && TRANSITIONS[from].includes(to);
}

export function assertTransition(from, to) {
  if (!isKnownState(from) || !isKnownState(to)) {
    throw new WorkflowError(WORKFLOW_ERROR.INVALID_STATE);
  }
  if (!canTransition(from, to)) throw new WorkflowError(WORKFLOW_ERROR.INVALID_TRANSITION);
}

export function isTerminal(state) {
  if (!isKnownState(state)) throw new WorkflowError(WORKFLOW_ERROR.INVALID_STATE);
  return TERMINAL_STATES.includes(state);
}
