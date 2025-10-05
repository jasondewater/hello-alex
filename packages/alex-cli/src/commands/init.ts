import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ensureDir, writeFile } from 'fs-extra';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import yaml from 'js-yaml';
import ora from 'ora';

import { AlexAgentsSpec, AlexProductSpec, AlexTestsSpec, validateSpec } from '@hello-alex/spec';

interface InitAnswers {
  projectName: string;
  backendAdapter: 'firebase' | 'supabase';
  authProviders: string[];
  entities: string[];
}

function createDefaultProductSpec(answers: InitAnswers): AlexProductSpec {
  return {
    schemaVersion: 'v0.1',
    metadata: {
      name: answers.projectName,
      version: '0.1.0',
      description: `${answers.projectName} Hello Alex project`,
    },
    spec: {
      auth: {
        providers: answers.authProviders as AlexProductSpec['spec']['auth']['providers'],
      },
      entities: answers.entities.map((entityName) => ({
        name: entityName.trim(),
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'createdAt', type: 'datetime' },
        ],
      })),
      flows: answers.entities.map((entityName) => ({
        name: `${entityName} CRUD`,
        trigger: 'api',
        steps: [
          { name: 'analyze', description: `Analyze ${entityName} requirements` },
          { name: 'implement', description: `Implement ${entityName} features` },
        ],
      })),
      backend: {
        adapter: answers.backendAdapter,
        config: {},
      },
    },
  };
}

function createDefaultAgentsSpec(): AlexAgentsSpec {
  return {
    schemaVersion: 'v0.1',
    metadata: {
      name: 'Default Agents',
    },
    spec: {
      pm: {
        model: 'gpt-4o-mini',
        systemPrompt: 'You are the Hello Alex PM agent.',
      },
      dev: {
        model: 'gpt-4o-mini',
        systemPrompt: 'You are the Hello Alex Dev agent.',
        executor: 'docker',
      },
      qa: {
        model: 'gpt-4o-mini',
        systemPrompt: 'You are the Hello Alex QA agent.',
        browsers: ['chromium'],
        headless: true,
      },
    },
  };
}

function createDefaultTestsSpec(): AlexTestsSpec {
  return {
    schemaVersion: 'v0.1',
    metadata: {
      name: 'Default Tests',
    },
    spec: {
      e2e: [
        {
          name: 'Smoke Test',
          description: 'Default smoke test',
          steps: [
            { action: 'Open application', expectation: 'Application loads successfully' },
          ],
        },
      ],
      unit: {
        coverage: {
          minimum: 0.8,
        },
      },
    },
  };
}

async function promptForInit(projectName?: string): Promise<InitAnswers> {
  const defaultName = projectName ?? 'hello-alex-app';

  const answers = await inquirer.prompt<InitAnswers>([
    {
      name: 'projectName',
      message: 'Project name',
      type: 'input',
      default: defaultName,
      validate: (value: string) => (value.trim().length > 0 ? true : 'Project name is required'),
    },
    {
      name: 'backendAdapter',
      message: 'Backend adapter',
      type: 'list',
      choices: [
        { name: 'Firebase', value: 'firebase' },
        { name: 'Supabase', value: 'supabase' },
      ],
      default: 'supabase',
    },
    {
      name: 'authProviders',
      message: 'Authentication providers',
      type: 'checkbox',
      choices: [
        { name: 'Email & Password', value: 'email-password' },
        { name: 'Google OAuth', value: 'google-oauth' },
        { name: 'GitHub OAuth', value: 'github-oauth' },
      ],
      validate: (value: string[]) => (value.length > 0 ? true : 'Select at least one provider'),
    },
    {
      name: 'entities',
      message: 'Initial entities (comma separated)',
      type: 'input',
      default: 'Task,User',
      filter: (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean),
    },
  ]);

  return answers;
}

async function writeYamlFile(targetDir: string, fileName: string, data: unknown): Promise<void> {
  const filePath = join(targetDir, fileName);
  const yamlContent = yaml.dump(data, { noRefs: true, lineWidth: 120 });
  await writeFile(filePath, yamlContent, 'utf-8');
}

function createEnvExample(adapter: InitAnswers['backendAdapter']): string {
  if (adapter === 'firebase') {
    return ['FIREBASE_PROJECT_ID=your-project', 'FIREBASE_API_KEY=replace-me'].join('\n');
  }

  return ['SUPABASE_PROJECT_ID=your-project', 'SUPABASE_SERVICE_ROLE_KEY=replace-me'].join('\n');
}

async function writeProjectFiles(targetDir: string, answers: InitAnswers) {
  await ensureDir(targetDir);

  const productSpec = createDefaultProductSpec(answers);
  const agentsSpec = createDefaultAgentsSpec();
  const testsSpec = createDefaultTestsSpec();

  await Promise.all([
    writeYamlFile(targetDir, 'alex.product.yaml', productSpec),
    writeYamlFile(targetDir, 'alex.agents.yaml', agentsSpec),
    writeYamlFile(targetDir, 'alex.tests.yaml', testsSpec),
    writeFile(join(targetDir, '.env.example'), createEnvExample(answers.backendAdapter), 'utf-8'),
    writeFile(
      join(targetDir, '.gitignore'),
      ['node_modules', '.env', 'dist', '.alex', 'coverage'].join('\n'),
      'utf-8'
    ),
    writeFile(
      join(targetDir, 'package.json'),
      JSON.stringify(
        {
          name: answers.projectName,
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            build: 'tsc',
            test: 'vitest',
          },
          dependencies: {
            '@hello-alex/cli': '^0.1.0',
          },
        },
        null,
        2
      ),
      'utf-8'
    ),
    writeFile(
      join(targetDir, 'README.md'),
      `# ${answers.projectName}\n\nGenerated with Hello Alex CLI.\n`,
      'utf-8'
    ),
  ]);

  const validations = await Promise.all([
    validateSpec(productSpec, 'product'),
    validateSpec(agentsSpec, 'agents'),
    validateSpec(testsSpec, 'tests'),
  ]);

  if (validations.some((validation) => !validation.valid)) {
    throw new Error('Generated specs did not pass validation');
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .argument('[projectName]', 'Project name')
    .description('Initialize a Hello Alex project')
    .action(async (projectName: string | undefined) => {
      const spinner = ora('Preparing project').start();
      try {
        const answers = await promptForInit(projectName);
        const targetDir = resolve(process.cwd(), answers.projectName);
        if (existsSync(targetDir)) {
          spinner.stop();
          throw new Error(`Directory already exists: ${targetDir}`);
        }

        spinner.text = 'Generating files';
        await writeProjectFiles(targetDir, answers);
        spinner.succeed(`Initialized Hello Alex project: ${chalk.green(answers.projectName)}`);
      } catch (error) {
        spinner.fail('Initialization failed');
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exitCode = 1;
      }
    });
}
