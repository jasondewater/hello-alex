import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerPlanCommand } from './commands/plan.js';
import { registerDevCommand } from './commands/dev.js';
import { registerTestCommand } from './commands/test.js';

export function createCli(): Command {
  const program = new Command();

  program.name('alex').description('Hello Alex CLI').version('0.1.0');

  registerInitCommand(program);
  registerPlanCommand(program);
  registerDevCommand(program);
  registerTestCommand(program);

  return program;
}

export async function run(argv: string[] = process.argv): Promise<void> {
  const cli = createCli();
  await cli.parseAsync(argv);
}
