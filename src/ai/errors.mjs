export const AI_ERROR = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ADAPTER: 'INVALID_ADAPTER',
  INVALID_OUTPUT: 'INVALID_OUTPUT',
  HALLUCINATED_STATUS: 'HALLUCINATED_STATUS',
  TIMEOUT: 'TIMEOUT',
  ADAPTER_FAILURE: 'ADAPTER_FAILURE',
  PROMPT_INJECTION: 'PROMPT_INJECTION',
});

export class AiError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'AiError';
    this.code = code;
  }
}
