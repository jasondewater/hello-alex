import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';

import { schemas } from '../schemas/index.js';

describe('schemas', () => {
  const ajv = new Ajv();

  it('each schema compiles without errors', () => {
    for (const [name, schema] of Object.entries(schemas)) {
      expect(() => ajv.compile(schema)).not.toThrow();
    }
  });
});
