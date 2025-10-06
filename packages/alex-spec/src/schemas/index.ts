import productSchema from './product.schema.json' assert { type: 'json' };
import agentsSchema from './agents.schema.json' assert { type: 'json' };
import testsSchema from './tests.schema.json' assert { type: 'json' };
import policiesSchema from './policies.schema.json' assert { type: 'json' };

export const schemas = {
  product: productSchema,
  agents: agentsSchema,
  tests: testsSchema,
  policies: policiesSchema,
};

export type SpecKind = keyof typeof schemas;

export { productSchema, agentsSchema, testsSchema, policiesSchema };
