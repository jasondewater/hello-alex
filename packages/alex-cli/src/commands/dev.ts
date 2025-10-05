import { Command } from 'commander';
import chalk from 'chalk';
import { ensureDir, writeFile } from 'fs-extra';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';

import { loadAndValidateSpec, AlexAgentsSpec } from '@hello-alex/spec';

interface DevOptions {
  agent?: 'pm' | 'dev' | 'qa';
  step?: number;
}

export async function simulateAgent(agentName: 'pm' | 'dev' | 'qa', spec: AlexAgentsSpec): Promise<void> {
  const agentConfig = spec.spec[agentName];
  console.log(`🤖 ${agentName.toUpperCase()} starting...`);
  console.log(`🤖 ${agentName.toUpperCase()} analyzing spec with model ${agentConfig.model}...`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`✅ ${agentName.toUpperCase()} completed`);
}

export async function writeArtifacts(targetDir: string, runId: string) {
  const runDir = join(targetDir, runId);
  await ensureDir(runDir);
  await Promise.all([
    writeFile(join(runDir, 'pm-plan.json'), JSON.stringify({ summary: 'Placeholder plan' }, null, 2), 'utf-8'),
    writeFile(join(runDir, 'dev-code.ts'), '// TODO: Generated code will appear here\n', 'utf-8'),
    writeFile(join(runDir, 'qa-report.md'), '# QA Report\n\nAll checks passed (stub).\n', 'utf-8'),
  ]);
}

export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Run the Hello Alex development workflow')
    .option('--agent <agent>', 'Agent to run (pm|dev|qa)')
    .option('--step <step>', 'Workflow step (for future use)', (value) => Number.parseInt(value, 10))
    .action(async (options: DevOptions) => {
      try {
        const spec = await loadAndValidateSpec<AlexAgentsSpec>('alex.agents.yaml', 'agents');
        const runId = randomUUID();
        const agentsToRun: Array<'pm' | 'dev' | 'qa'> = options.agent ? [options.agent] : ['pm', 'dev', 'qa'];

        for (const agent of agentsToRun) {
          await simulateAgent(agent, spec);
        }

        const targetDir = resolve('.alex/runs');
        await writeArtifacts(targetDir, runId);

        console.log(`✅ Development flow completed. See .alex/runs/${runId}/`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exitCode = 1;
      }
    });
}
