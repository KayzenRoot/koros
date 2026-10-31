export const ONBOARDING_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  STEP_MISMATCH: 'STEP_MISMATCH',
  MISSING_SCOPE: 'MISSING_SCOPE',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  DRY_RUN_FAILED: 'DRY_RUN_FAILED',
  CONFLICT: 'CONFLICT',
  PROVISIONING_DISABLED: 'PROVISIONING_DISABLED',
});

export class OnboardingError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'OnboardingError';
    this.code = code;
  }
}
