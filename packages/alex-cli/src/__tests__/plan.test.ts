import { describe, expect, it } from 'vitest';

import { AlexProductSpec } from '@hello-alex/spec';
import { buildTasksFromProduct as buildTasks } from '../commands/plan.js';

const productSpec: AlexProductSpec = {
  schemaVersion: 'v0.1',
  metadata: {
    name: 'Demo',
    version: '0.1.0',
  },
  spec: {
    auth: { providers: ['email-password'] },
    entities: [
      {
        name: 'Task',
        fields: [
          { name: 'id', type: 'string' },
        ],
      },
    ],
    flows: [
      {
        name: 'Create Task',
        trigger: 'api',
        steps: [
          { name: 'step1', description: 'Step 1' },
        ],
      },
    ],
    backend: {
      adapter: 'firebase',
      config: {},
    },
  },
};

describe('buildTasksFromProduct', () => {
  it('generates tasks for entities and flows', () => {
    const tasks = buildTasks(productSpec);
    expect(tasks).toContain('Implement Task CRUD operations');
    expect(tasks).toContain('Write E2E test for Create Task');
  });
});
