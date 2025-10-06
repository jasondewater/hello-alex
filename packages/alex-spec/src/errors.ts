export type AlexErrorCode =
  | 'SPEC_VALIDATION_ERROR'
  | 'SPEC_SCHEMA_NOT_FOUND'
  | 'SPEC_IO_ERROR';

export class AlexError extends Error {
  readonly code: AlexErrorCode;

  constructor(code: AlexErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AlexError';
    this.code = code;
  }
}

export class SpecValidationError extends AlexError {
  readonly errors: Array<{ message: string; instancePath: string; schemaPath?: string }>;

  constructor(message: string, errors: Array<{ message: string; instancePath: string; schemaPath?: string }>) {
    super('SPEC_VALIDATION_ERROR', message);
    this.name = 'SpecValidationError';
    this.errors = errors;
  }
}

export class SpecSchemaNotFoundError extends AlexError {
  constructor(kind: string) {
    super('SPEC_SCHEMA_NOT_FOUND', `No schema registered for spec kind: ${kind}`);
    this.name = 'SpecSchemaNotFoundError';
  }
}

export class SpecIoError extends AlexError {
  constructor(message: string, options?: ErrorOptions) {
    super('SPEC_IO_ERROR', message, options);
    this.name = 'SpecIoError';
  }
}
