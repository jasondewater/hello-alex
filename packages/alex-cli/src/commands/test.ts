import { Command } from 'commander';
import chalk from 'chalk';
import { ensureDir, writeFile } from 'fs-extra';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';

import { AlexTestsSpec, validateSpec } from '@hello-alex/spec';

interface TestOptions {
  spec?: string;
}

export async function loadTestsSpec(path: string): Promise<AlexTestsSpec> {
  const absolute = resolve(path);
  const raw = await readFile(absolute, 'utf-8');
  const parsed = yaml.load(raw);
  const validation = await validateSpec<AlexTestsSpec>(parsed, 'tests');
  if (!validation.valid || !validation.spec) {
    throw new Error('Test spec failed validation');
  }

  return validation.spec;
}

export async function generatePlaywrightTest(runDir: string, scenario: AlexTestsSpec['spec']['e2e'][number]) {
  const sanitized = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filePath = join(runDir, `${sanitized}.spec.ts`);
  const steps = scenario.steps
    .map((step) => `  test.step('${step.action}', async () => {\n    // Expectation: ${step.expectation}\n    await page.waitForTimeout(10);\n  });\n`)
    .join('\n');

  const content = `import { test } from '@playwright/test';\n\ntest('${scenario.name}', async ({ page }) => {\n${steps}});\n`;
  await writeFile(filePath, content, 'utf-8');
}

export function registerTestCommand(program: Command): void {
  program
    .command('test')
    .description('Execute tests defined in alex.tests.yaml')
    .option('--spec <file>', 'Path to tests spec', 'alex.tests.yaml')
    .action(async (options: TestOptions) => {
      try {
        const spec = await loadTestsSpec(options.spec ?? 'alex.tests.yaml');
        const runDir = resolve('.alex/generated-tests');
        await ensureDir(runDir);

        for (const scenario of spec.spec.e2e) {
          await generatePlaywrightTest(runDir, scenario);
        }

        const reportDir = resolve('.alex/test-results');
        await ensureDir(reportDir);
        await writeFile(
          join(reportDir, 'junit.xml'),
          '<testsuite name="hello-alex" tests="0"></testsuite>',
          'utf-8'
        );

        console.log(chalk.green('✅ Test scaffolding generated. Playwright execution is stubbed for v0.1.'));
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exitCode = 1;
      }
    });
}
