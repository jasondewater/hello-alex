import Docker from 'dockerode';
import { nanoid } from 'nanoid';
import { ExecutionRequest, ExecutionResult, Executor, HealthStatus } from './executor.js';
import { RuntimeExecutionError, RuntimeInitializationError } from '../errors.js';

export interface DockerExecutorOptions {
  image?: string;
  workdir?: string;
}

export class DockerExecutor implements Executor {
  readonly id: string;
  private readonly docker: Docker;
  private readonly image: string;
  private initialized = false;

  constructor(private readonly options: DockerExecutorOptions = {}) {
    this.id = `docker:${nanoid(6)}`;
    this.docker = new Docker();
    this.image = options.image ?? 'node:20-slim';
  }

  async initialize(): Promise<void> {
    try {
      await this.docker.pull(this.image);
      this.initialized = true;
    } catch (error) {
      throw new RuntimeInitializationError(`Failed to pull Docker image ${this.image}`, { cause: error });
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new RuntimeInitializationError('DockerExecutor must be initialized before executing commands');
    }

    const start = Date.now();
    const command = ['/bin/sh', '-lc', request.command];

    try {
      const container = await this.docker.createContainer({
        Image: this.image,
        Cmd: command,
        WorkingDir: this.options.workdir ?? '/workspace',
        Env: Object.entries(request.env).map(([key, value]) => `${key}=${value}`),
        HostConfig: {
          AutoRemove: true,
          Binds: [`${request.workingDir}:/workspace`],
        },
      });

      const stream = await container.attach({ stream: true, stdout: true, stderr: true });
      let stdout = '';
      let stderr = '';
      stream.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      stream.on('stderr', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      await container.start();
      const status = await container.wait();
      const duration = Date.now() - start;

      return {
        exitCode: status.StatusCode ?? 0,
        stdout,
        stderr,
        duration,
        metadata: { containerId: container.id },
      };
    } catch (error) {
      throw new RuntimeExecutionError('Docker execution failed', { cause: error });
    }
  }

  async cleanup(): Promise<void> {
    // nothing to cleanup thanks to AutoRemove
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.docker.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', details: { message: (error as Error).message } };
    }
  }
}
