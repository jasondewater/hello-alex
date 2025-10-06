import { describe, expect, it, vi } from 'vitest';

import { AlexAgentsSpec } from '@hello-alex/spec';
import { createDevelopmentWorkflow } from '../graph/workflow.js';

describe('DevelopmentWorkflow', () => {
  const spec: AlexAgentsSpec = {
    schemaVersion: 'v0.1',
    metadata: { name: 'Agents' },
    spec: {
      pm: { model: 'gpt', systemPrompt: 'pm' },
      dev: { model: 'gpt', systemPrompt: 'dev' },
      qa: { model: 'gpt', systemPrompt: 'qa' },
    },
  };

  it('runs pm -> dev -> qa', async () => {
    const beforeDev = vi.fn();
    const beforeQA = vi.fn();
    const workflow = createDevelopmentWorkflow({}, { beforeDev, beforeQA });
    const result = await workflow.run(spec);

    expect(result.plan).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.testResults).toBeDefined();
    expect(beforeDev).toHaveBeenCalled();
    expect(beforeQA).toHaveBeenCalled();
    expect(result.logs).toHaveLength(6);
  });
});
