#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

async function generate() {
  const schemaFiles = [
    ['AlexProductSpec', 'src/schemas/product.schema.json'],
    ['AlexAgentsSpec', 'src/schemas/agents.schema.json'],
    ['AlexTestsSpec', 'src/schemas/tests.schema.json'],
    ['AlexPoliciesSpec', 'src/schemas/policies.schema.json']
  ];

  const outputs = await Promise.all(
    schemaFiles.map(async ([typeName, relPath]) => {
      const schemaPath = resolve(root, relPath);
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const types = await compile(JSON.parse(schemaContent), typeName, {
        bannerComment: '',
        cwd: root
      });
      return types;
    })
  );

  const header = `/* eslint-disable */\n// This file is generated via \`pnpm --filter @hello-alex/spec generate:types\`.\n`;
  const body = outputs.join('\n');
  const targetPath = resolve(root, 'src/types.generated.ts');
  await writeFile(targetPath, `${header}\n${body}`);
  console.log(`✅ Generated types at ${targetPath}`);
}

generate().catch((error) => {
  console.error('Failed to generate types', error);
  process.exitCode = 1;
});
