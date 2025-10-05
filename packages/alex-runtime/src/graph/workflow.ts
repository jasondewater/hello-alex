import { AlexAgentsSpec } from '@hello-alex/spec';

export interface WorkflowContext {
  spec: AlexAgentsSpec;
  plan?: Record<string, unknown>;
  code?: string;
  testResults?: Record<string, unknown>;
  logs: Array<Record<string, unknown>>;
}

export interface WorkflowHooks {
  beforeDev?: (context: WorkflowContext) => Promise<void> | void;
  beforeQA?: (context: WorkflowContext) => Promise<void> | void;
}

export interface AgentImplementation {
  name: 'pm' | 'dev' | 'qa';
  run(context: WorkflowContext): Promise<Partial<WorkflowContext>> | Partial<WorkflowContext>;
}

function createLog(agent: string, step: string): Record<string, unknown> {
  return {
    agent,
    step,
    timestamp: new Date().toISOString(),
  };
}

export class DevelopmentWorkflow {
  private readonly agents: Record<'pm' | 'dev' | 'qa', AgentImplementation>;

  constructor(agents: Partial<Record<'pm' | 'dev' | 'qa', AgentImplementation>> = {}, private readonly hooks: WorkflowHooks = {}) {
    this.agents = {
      pm: agents.pm ?? {
        name: 'pm',
        run: async () => ({ plan: { summary: 'Placeholder PM plan' } }),
      },
      dev: agents.dev ?? {
        name: 'dev',
        run: async () => ({ code: '// dev output placeholder' }),
      },
      qa: agents.qa ?? {
        name: 'qa',
        run: async () => ({ testResults: { status: 'pass' } }),
      },
    };
  }

  async run(spec: AlexAgentsSpec): Promise<WorkflowContext> {
    const context: WorkflowContext = {
      spec,
      plan: undefined,
      code: undefined,
      testResults: undefined,
      logs: [],
    };

    await this.executeAgent('pm', context);
    if (this.hooks.beforeDev) {
      await this.hooks.beforeDev(context);
    }
    await this.executeAgent('dev', context);
    if (this.hooks.beforeQA) {
      await this.hooks.beforeQA(context);
    }
    await this.executeAgent('qa', context);

    return context;
  }

  private async executeAgent(agentName: 'pm' | 'dev' | 'qa', context: WorkflowContext) {
    const agent = this.agents[agentName];
    context.logs.push(createLog(agentName, 'analyzing'));
    const updates = await agent.run(context);
    context.logs.push(createLog(agentName, 'completed'));
    Object.assign(context, updates);
  }
}

export function createDevelopmentWorkflow(
  agents: Partial<Record<'pm' | 'dev' | 'qa', AgentImplementation>> = {},
  hooks: WorkflowHooks = {}
): DevelopmentWorkflow {
  return new DevelopmentWorkflow(agents, hooks);
}
