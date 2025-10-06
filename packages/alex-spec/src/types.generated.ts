/* eslint-disable */
// This file is generated via `pnpm --filter @hello-alex/spec generate:types`.
// For the initial scaffolding we provide a hand-written baseline to unblock development.

export interface AlexProductSpec {
  schemaVersion: string;
  metadata: {
    name: string;
    version: string;
    description?: string;
    labels?: string[];
  };
  spec: {
    auth: {
      providers: ('email-password' | 'google-oauth' | 'github-oauth')[];
    };
    entities: Array<{
      name: string;
      description?: string;
      fields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
        required?: boolean;
      }>;
    }>;
    flows: Array<{
      name: string;
      trigger: 'api' | 'schedule' | 'user-action';
      steps: Array<{
        name: string;
        description: string;
      }>;
    }>;
    backend: {
      adapter: 'firebase' | 'supabase';
      config: Record<string, string | number | boolean>;
    };
  };
}

export interface AlexAgentConfig {
  model: string;
  temperature?: number;
  systemPrompt: string;
}

export interface AlexDevAgentConfig extends AlexAgentConfig {
  executor?: 'docker' | 'shell';
  testCoverage?: {
    minimum?: number;
  };
}

export interface AlexQaAgentConfig extends AlexAgentConfig {
  browsers?: Array<'chromium' | 'firefox' | 'webkit'>;
  headless?: boolean;
}

export interface AlexAgentsSpec {
  schemaVersion: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: {
    pm: AlexAgentConfig;
    dev: AlexDevAgentConfig;
    qa: AlexQaAgentConfig;
  };
}

export interface AlexTestsSpec {
  schemaVersion: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: {
    e2e: Array<{
      name: string;
      description?: string;
      steps: Array<{
        action: string;
        expectation: string;
      }>;
    }>;
    unit?: {
      coverage?: {
        minimum: number;
        exclude?: string[];
      };
    };
  };
}

export interface AlexPoliciesSpec {
  schemaVersion: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: {
    code?: {
      style?: string[];
      lintRules?: string[];
    };
    security?: {
      dependencies?: string[];
      restrictedFiles?: string[];
    };
  };
}

