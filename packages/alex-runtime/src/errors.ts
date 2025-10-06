export type AlexRuntimeErrorCode =
  | 'RUNTIME_INITIALIZATION_ERROR'
  | 'RUNTIME_EXECUTION_ERROR'
  | 'RUNTIME_HEALTHCHECK_FAILED';

export class AlexError extends Error {
  readonly code: AlexRuntimeErrorCode;

  constructor(code: AlexRuntimeErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AlexError';
    this.code = code;
  }
}

export class RuntimeInitializationError extends AlexError {
  constructor(message: string, options?: ErrorOptions) {
    super('RUNTIME_INITIALIZATION_ERROR', message, options);
    this.name = 'RuntimeInitializationError';
  }
}

export class RuntimeExecutionError extends AlexError {
  constructor(message: string, options?: ErrorOptions) {
    super('RUNTIME_EXECUTION_ERROR', message, options);
    this.name = 'RuntimeExecutionError';
  }
}

export class RuntimeHealthcheckFailed extends AlexError {
  constructor(message: string, options?: ErrorOptions) {
    super('RUNTIME_HEALTHCHECK_FAILED', message, options);
    this.name = 'RuntimeHealthcheckFailed';
  }
}
