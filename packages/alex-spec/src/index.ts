import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

import { SpecIoError, SpecSchemaNotFoundError, SpecValidationError } from './errors.js';
import { schemas, type SpecKind } from './schemas/index.js';

export type { SpecKind } from './schemas/index.js';
export { productSchema, agentsSchema, testsSchema, policiesSchema } from './schemas/index.js';
export type { AlexErrorCode } from './errors.js';
export { AlexError, SpecValidationError, SpecSchemaNotFoundError, SpecIoError } from './errors.js';
export * from './types.generated.js';

export interface ValidationResult<TSpec = unknown> {
  valid: boolean;
  spec?: TSpec;
  errors?: ErrorObject[];
}

const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);

const validators = new Map<SpecKind, ReturnType<Ajv['compile']>>();

function getValidator(kind: SpecKind) {
  if (!validators.has(kind)) {
    const schema = schemas[kind];
    if (!schema) {
      throw new SpecSchemaNotFoundError(kind);
    }

    const validator = ajv.compile(schema);
    validators.set(kind, validator);
  }

  return validators.get(kind)!;
}

export async function validateSpec<TSpec = unknown>(spec: unknown, kind: SpecKind): Promise<ValidationResult<TSpec>> {
  const validator = getValidator(kind);
  const valid = validator(spec) as boolean;

  if (!valid) {
    const errors = validator.errors ?? [];
    return { valid: false, errors };
  }

  return { valid: true, spec: spec as TSpec };
}

export async function loadAndValidateSpec<TSpec = unknown>(filePath: string, kind: SpecKind): Promise<TSpec> {
  const absolutePath = resolve(filePath);
  let fileContent: string;

  try {
    fileContent = await readFile(absolutePath, 'utf-8');
  } catch (error) {
    throw new SpecIoError(`Failed to read spec file at ${absolutePath}`, { cause: error });
  }

  const parsed = parseSpec(fileContent, absolutePath);
  const result = await validateSpec<TSpec>(parsed, kind);

  if (!result.valid) {
    throw new SpecValidationError(`Validation failed for ${absolutePath}`,
      (result.errors ?? []).map((error) => ({
        message: error.message ?? 'Validation error',
        instancePath: error.instancePath,
        schemaPath: error.schemaPath,
      }))
    );
  }

  return result.spec as TSpec;
}

export function parseSpec(content: string, source = 'inline'): unknown {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new SpecIoError(`Spec content from ${source} is empty`);
  }

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  return yaml.load(trimmed);
}

