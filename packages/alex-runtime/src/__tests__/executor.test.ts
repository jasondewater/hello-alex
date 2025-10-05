import { describe, expect, it, vi } from 'vitest';

import { DockerExecutor } from '../executors/docker-executor.js';

vi.mock('dockerode', () => {
  class ContainerMock {
    id = 'container-id';
    async start() {}
    async wait() {
      return { StatusCode: 0 };
    }
    async attach() {
      return {
        on: (event: string, handler: (chunk: Buffer) => void) => {
          if (event === 'data') {
            handler(Buffer.from('output'));
          }
          if (event === 'stderr') {
            handler(Buffer.from(''));
          }
        },
      };
    }
  }

  class DockerMock {
    async pull() {}
    async ping() {}
    async createContainer() {
      return new ContainerMock();
    }
  }

  return { default: DockerMock }; 
});

vi.mock('nanoid', () => ({ nanoid: () => 'abc123' }));

describe('DockerExecutor', () => {
  it('initializes and executes commands', async () => {
    const executor = new DockerExecutor();
    await executor.initialize();
    const result = await executor.execute({ command: 'echo "hello"', workingDir: '/tmp', env: {} });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('output');
    const health = await executor.healthCheck();
    expect(health.status).toBe('ok');
  });
});
