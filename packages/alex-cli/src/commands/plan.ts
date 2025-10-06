import { Command } from 'commander';
import chalk from 'chalk';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

import { AlexProductSpec, validateSpec } from '@hello-alex/spec';

interface PlanOptions {
  output?: 'json' | 'github';
}

export function buildTasksFromProduct(spec: AlexProductSpec): string[] {
  const tasks: string[] = [];
  for (const entity of spec.spec.entities) {
    tasks.push(`Implement ${entity.name} CRUD operations`);
    tasks.push(`Create ${entity.name} TypeScript types`);
    tasks.push(`Write unit tests for ${entity.name}`);
  }

  for (const flow of spec.spec.flows) {
    tasks.push(`Implement ${flow.name} workflow`);
    tasks.push(`Write E2E test for ${flow.name}`);
  }

  return tasks;
}

async function loadProductSpec(filePath: string): Promise<AlexProductSpec> {
  const absolutePath = resolve(filePath);
  const content = await readFile(absolutePath, 'utf-8');
  const parsed = yaml.load(content);
  const validation = await validateSpec<AlexProductSpec>(parsed, 'product');
  if (!validation.valid || !validation.spec) {
    throw new Error('alex.product.yaml is invalid');
  }

  return validation.spec;
}

export function registerPlanCommand(program: Command): void {
  program
    .command('plan')
    .description('Generate development plan from alex.product.yaml')
    .option('--output <format>', 'Output format (json|github)', (value: string) => value as PlanOptions['output'])
    .action(async (options: PlanOptions) => {
      try {
        const spec = await loadProductSpec('alex.product.yaml');
        const tasks = buildTasksFromProduct(spec);
        const output = options.output ?? 'console';

        switch (output) {
          case 'json':
            console.log(JSON.stringify(tasks, null, 2));
            break;
          case 'github':
            console.log('GitHub integration coming in v0.2');
            break;
          default:
            console.log(chalk.cyan('Generated Tasks:\n'));
            tasks.forEach((task, index) => {
              console.log(`${index + 1}. ${task}`);
            });
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exitCode = 1;
      }
    });
}
