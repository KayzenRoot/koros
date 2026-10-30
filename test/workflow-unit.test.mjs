import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TERMINAL_STATES,
  WORKFLOW_STATES,
  allowedTransitions,
  assertTransition,
  canTransition,
  isKnownState,
  isTerminal,
} from '../src/workflow/fsm.mjs';
import { WORKFLOW_ERROR } from '../src/workflow/errors.mjs';

test('the canonical FSM exposes exactly the M04 states', () => {
  assert.deepEqual(WORKFLOW_STATES, [
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
  for (const state of WORKFLOW_STATES) assert.equal(isKnownState(state), true);
});

test('the happy path is a valid forward chain', () => {
  const path = [
    'RECEIVED',
    'VALIDATED',
    'PROPOSED',
    'PENDING_APPROVAL',
    'APPROVED',
    'QUEUED',
    'RECONCILING',
    'COMPLETED',
  ];
  for (let index = 0; index < path.length - 1; index += 1) {
    assert.equal(canTransition(path[index], path[index + 1]), true);
    assert.doesNotThrow(() => assertTransition(path[index], path[index + 1]));
  }
});

test('no state transitions to itself and terminal states have no outgoing edge', () => {
  for (const state of WORKFLOW_STATES) {
    assert.equal(canTransition(state, state), false);
  }
  for (const state of TERMINAL_STATES) {
    assert.equal(isTerminal(state), true);
    assert.deepEqual(allowedTransitions(state), []);
  }
});

test('unknown and illegal transitions fail closed', () => {
  assert.throws(() => allowedTransitions('UNKNOWN'), (error) => error.code === WORKFLOW_ERROR.INVALID_STATE);
  assert.throws(
    () => assertTransition('RECEIVED', 'APPROVED'),
    (error) => error.code === WORKFLOW_ERROR.INVALID_TRANSITION,
  );
  assert.throws(
    () => assertTransition('COMPLETED', 'QUEUED'),
    (error) => error.code === WORKFLOW_ERROR.INVALID_TRANSITION,
  );
  assert.equal(canTransition('PENDING_APPROVAL', 'COMPLETED'), false);
  assert.equal(canTransition('APPROVED', 'COMPLETED'), false);
});

test('pause and reconciliation edges are explicit', () => {
  assert.equal(canTransition('QUEUED', 'RECONCILING'), true);
  assert.equal(canTransition('RECONCILING', 'QUEUED'), true);
  assert.equal(canTransition('QUEUED', 'PAUSED'), true);
  assert.equal(canTransition('PAUSED', 'QUEUED'), true);
  assert.equal(canTransition('PAUSED', 'COMPLETED'), false);
});
