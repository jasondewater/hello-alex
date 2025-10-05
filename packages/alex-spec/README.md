# @hello-alex/spec

Shared schemas, validators, and helpers for Hello Alex product, agent, policy, and test specifications.

## Installation

```bash
pnpm add @hello-alex/spec
```

## Usage

```ts
import { loadSpecFromFile, validateProductSpec } from '@hello-alex/spec';

const spec = await loadSpecFromFile('alex.product.yaml');
validateProductSpec(spec);
```

Example YAML specs live in [`examples/`](./examples) and can be used as templates.

See the [Hello Alex docs](../../docs) for more details on authoring specs and generated types.

