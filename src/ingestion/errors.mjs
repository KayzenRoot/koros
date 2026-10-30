export class IngestionError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'IngestionError';
    this.status = status;
    this.code = code;
  }
}
