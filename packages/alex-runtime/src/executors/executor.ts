export interface ExecutionRequest {
  command: string;
  workingDir: string;
  env: Record<string, string>;
  timeout?: number;
  runtime?: string;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  details?: Record<string, unknown>;
}

export interface Executor {
  readonly id: string;
  initialize(): Promise<void>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}
