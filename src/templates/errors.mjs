export const TEMPLATE_ERROR = Object.freeze({
  INVALID_TEMPLATE: 'INVALID_TEMPLATE',
  UNKNOWN_FIELD: 'UNKNOWN_FIELD',
  SECRET_FIELD: 'SECRET_FIELD',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD: 'INVALID_FIELD',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
});

export class TemplateError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'TemplateError';
    this.code = code;
  }
}
