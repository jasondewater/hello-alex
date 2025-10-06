import { describe, expect, it } from 'vitest';

import { validateSpec, loadAndValidateSpec } from '../index.js';
import { AlexProductSpec } from '../types.generated.js';

const validProduct: AlexProductSpec = {
  schemaVersion: 'v0.1',
  metadata: {
    name: 'Test Product',
    version: '0.1.0',
  },
  spec: {
    auth: {
      providers: ['email-password'],
    },
    entities: [
      {
        name: 'Task',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string' },
        ],
      },
    ],
    flows: [
      {
        name: 'Create Task',
        trigger: 'api',
        steps: [
          { name: 'validate', description: 'Validate payload' },
        ],
      },
    ],
    backend: {
      adapter: 'firebase',
      config: {},
    },
  },
};

describe('validateSpec', () => {
  it('returns valid=true for a valid product spec', async () => {
    const result = await validateSpec(validProduct, 'product');
    expect(result.valid).toBe(true);
    expect(result.spec).toBe(validProduct);
  });

  it('returns validation errors for invalid specs', async () => {
    const invalidSpec = { ...validProduct, spec: { ...validProduct.spec, entities: [] } };
    const result = await validateSpec(invalidSpec, 'product');
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});

describe('loadAndValidateSpec', () => {
  it('loads and validates yaml specs from disk', async () => {
    const spec = await loadAndValidateSpec<AlexProductSpec>(
      new URL('../../examples/alex.product.yaml', import.meta.url).pathname,
      'product'
    );

    expect(spec.metadata.name).toBe('Sample Product');
  });
});
