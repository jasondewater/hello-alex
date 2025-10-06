import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';

import { AlexTestsSpec } from '@hello-alex/spec';
import { generatePlaywrightTest } from '../commands/test.js';

describe('generatePlaywrightTest', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('writes playwright test file for scenario', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'alex-tests-'));
    const scenario: AlexTestsSpec['spec']['e2e'][number] = {
      name: 'User logs in',
      description: 'User login flow',
      steps: [
        { action: 'Go to login', expectation: 'Login page renders' },
      ],
    };

    await generatePlaywrightTest(tempDir, scenario);
    const file = await readFile(join(tempDir, 'user-logs-in.spec.ts'), 'utf-8');
    expect(file).toContain("test('User logs in'");
  });
});
