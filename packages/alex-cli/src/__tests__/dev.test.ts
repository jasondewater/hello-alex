import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';

import { AlexAgentsSpec } from '@hello-alex/spec';
import { simulateAgent, writeArtifacts } from '../commands/dev.js';

describe('simulateAgent', () => {
  const spec: AlexAgentsSpec = {
    schemaVersion: 'v0.1',
    metadata: { name: 'Agents' },
    spec: {
      pm: { model: 'gpt', systemPrompt: 'pm' },
      dev: { model: 'gpt', systemPrompt: 'dev' },
      qa: { model: 'gpt', systemPrompt: 'qa' },
    },
  };

  it('logs lifecycle for agent', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await simulateAgent('pm', spec);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('PM starting'));
    logSpy.mockRestore();
  });
});

describe('writeArtifacts', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('writes stub artifacts', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'alex-dev-'));
    await writeArtifacts(tempDir, 'run');
    const plan = await readFile(join(tempDir, 'run', 'pm-plan.json'), 'utf-8');
    expect(plan).toContain('Placeholder plan');
  });
});
