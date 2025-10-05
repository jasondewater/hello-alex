# @hello-alex/runtime

Workflow runtime that coordinates Hello Alex agents and execution environments.

## Installation

```bash
pnpm add @hello-alex/runtime
```

## Usage

```ts
import { createWorkflow } from '@hello-alex/runtime';

const workflow = createWorkflow();
await workflow.run({
  productSpecPath: 'alex.product.yaml',
  agentsSpecPath: 'alex.agents.yaml'
});
```

Read more about runtime capabilities and integrations in the [Hello Alex documentation](../../docs).

