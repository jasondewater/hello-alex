# ADR-003: Executor Interface & Docker Sandbox

**Status**: Accepted  
**Date**: October 5, 2025  
**Deciders**: Jason DeWater, Alex (Platform PM)  
**Context**: Hello Alex v0.1

---

## Context

Hello Alex agents need to **execute code safely** in various environments. The "Dev" agent generates code, the "QA" agent runs tests, and both need isolated, reproducible execution contexts.

**Requirements**:

1. **Safety**: Agents can't damage host system or leak credentials
2. **Reproducibility**: Same code produces same results across environments
3. **Isolation**: Multiple agents can run concurrently without conflicts
4. **Flexibility**: Support multiple languages (Node, Python, shell, etc.)
5. **Extensibility**: Plugin architecture for different execution strategies
6. **Performance**: Fast enough for dev loops (<5s cold start)

**Constraints**:

- v0.1 must ship in 7-10 days (keep simple)
- Must work in GitHub Actions CI (Docker available)
- Must work on developer laptops (macOS, Linux, Windows w/ WSL)
- No cloud dependencies (local-first)

---

## Decision

**Executor Interface**: Pluggable TypeScript interface with multiple implementations  
**Default Executor**: **Docker-based sandbox** (safe, portable)  
**Alternative Executors**: Local shell (fast but unsafe), OpenHands adapter (future)

---

## Executor Interface Design

### Core Interface

```typescript
/**
 * Executor runs commands in a controlled environment.
 * Implementations provide different isolation/performance trade-offs.
 */
export interface Executor {
  /**
   * Unique identifier for this executor type.
   * Examples: "docker", "local-shell", "openhands"
   */
  readonly id: string;

  /**
   * Initialize the executor (pull images, setup env, etc.)
   * Called once before first execution.
   */
  initialize(): Promise<void>;

  /**
   * Execute a command with given context.
   * Returns result or throws ExecutorError.
   */
  execute(request: ExecutionRequest): Promise<ExecutionResult>;

  /**
   * Cleanup resources (stop containers, temp files, etc.)
   * Called at end of session or on error.
   */
  cleanup(): Promise<void>;

  /**
   * Health check: is executor ready to run commands?
   */
  healthCheck(): Promise<HealthStatus>;
}

export interface ExecutionRequest {
  /** Command to execute (e.g., "npm test", "python script.py") */
  command: string;

  /** Working directory (relative to project root) */
  workingDir: string;

  /** Environment variables */
  env: Record<string, string>;

  /** Timeout in milliseconds (default: 300000 = 5 min) */
  timeout?: number;

  /** Language/runtime hint (e.g., "node", "python", "shell") */
  runtime?: string;

  /** Files to mount into execution environment */
  files?: FileMount[];

  /** Stdin to pipe to command */
  stdin?: string;
}

export interface ExecutionResult {
  /** Exit code (0 = success) */
  exitCode: number;

  /** Standard output */
  stdout: string;

  /** Standard error */
  stderr: string;

  /** Execution duration in milliseconds */
  duration: number;

  /** Files written during execution (if captured) */
  filesWritten?: FileOutput[];

  /** Execution metadata (container ID, temp dir, etc.) */
  metadata: Record<string, unknown>;
}

export interface FileMount {
  /** Host path (absolute) */
  hostPath: string;

  /** Container/sandbox path */
  containerPath: string;

  /** Read-only mount? */
  readonly: boolean;
}

export interface FileOutput {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

export interface HealthStatus {
  healthy: boolean;
  message?: string;
  lastCheck: Date;
}

export class ExecutorError extends Error {
  constructor(
    message: string,
    public readonly exitCode?: number,
    public readonly stdout?: string,
    public readonly stderr?: string
  ) {
    super(message);
    this.name = 'ExecutorError';
  }
}
```

---

## Default Executor: Docker Sandbox

### Why Docker?

✅ **Isolation**: Full process + filesystem isolation  
✅ **Reproducibility**: Same image = same environment  
✅ **Safety**: Can't escape container (unless privileged mode)  
✅ **Portability**: Works on macOS, Linux, Windows (w/ Docker Desktop)  
✅ **CI-friendly**: GitHub Actions supports Docker  
✅ **Multi-language**: Node, Python, shell all in one image  

⚠️ **Trade-offs**:
- Cold start: ~2-3s (cached image)
- Requires Docker installed (acceptable for dev tools)
- Not suitable for browser automation (use Playwright executor)

### Architecture

```
┌─────────────────────────────────────────┐
│ Host System                             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Hello Alex Runtime              │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │ Docker Executor         │   │   │
│  │  │                         │   │   │
│  │  │  Execute(request)       │   │   │
│  │  └──────────┬──────────────┘   │   │
│  │             │                   │   │
│  └─────────────┼───────────────────┘   │
│                │ Docker API            │
│                ▼                        │
│  ┌─────────────────────────────────┐   │
│  │ Docker Container                │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │ /workspace (mounted)     │   │   │
│  │  │  - package.json          │   │   │
│  │  │  - src/                  │   │   │
│  │  │  - tests/                │   │   │
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  $ npm test                     │   │
│  │  ✓ 24 tests passed              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Docker Image

**Base Image**: `node:20-slim` (Debian-based, minimal)

**Additions**:
- Python 3.11+ (for Python agents)
- Git (for repo operations)
- Common build tools (gcc, make)
- Security: non-root user, read-only filesystem (except `/workspace`)

**Dockerfile** (in `packages/alex-runtime/docker/`):

```dockerfile
FROM node:20-slim

# Install Python + tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 alexrunner
USER alexrunner
WORKDIR /workspace

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node --version && python3 --version

ENTRYPOINT ["/bin/sh", "-c"]
```

### Implementation

```typescript
export class DockerExecutor implements Executor {
  readonly id = 'docker';
  private imageTag = 'hello-alex/runtime:latest';
  private containerId?: string;

  async initialize(): Promise<void> {
    // Pull image if not exists
    await this.pullImageIfNeeded();
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Create container with mounts
      const containerId = await this.createContainer(request);
      this.containerId = containerId;

      // Start container and wait for completion
      await this.startContainer(containerId);
      const result = await this.waitForContainer(containerId, request.timeout);

      // Get logs
      const logs = await this.getContainerLogs(containerId);

      // Cleanup container
      await this.removeContainer(containerId);

      return {
        exitCode: result.exitCode,
        stdout: logs.stdout,
        stderr: logs.stderr,
        duration: Date.now() - startTime,
        metadata: { containerId, image: this.imageTag },
      };
    } catch (error) {
      throw new ExecutorError(
        `Docker execution failed: ${error.message}`,
        undefined,
        undefined,
        error.stderr
      );
    }
  }

  async cleanup(): Promise<void> {
    if (this.containerId) {
      await this.removeContainer(this.containerId);
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      // Check Docker daemon is running
      await execPromise('docker info');
      return { healthy: true, lastCheck: new Date() };
    } catch {
      return {
        healthy: false,
        message: 'Docker daemon not running',
        lastCheck: new Date(),
      };
    }
  }

  // Private methods: createContainer, startContainer, etc.
}
```

---

## Alternative Executor: Local Shell

**Use Case**: Fast iteration when Docker overhead too high (trusted code only)

**Trade-offs**:
- ✅ Fast (no container startup)
- ✅ Simple (direct shell execution)
- ❌ **UNSAFE**: Can modify host filesystem
- ❌ **NOT ISOLATED**: Can read secrets, modify system
- ❌ **NOT REPRODUCIBLE**: Depends on host env

**Implementation**:

```typescript
export class LocalShellExecutor implements Executor {
  readonly id = 'local-shell';

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    console.warn('⚠️  Local shell executor is UNSAFE. Use for trusted code only.');

    const result = await execPromise(request.command, {
      cwd: request.workingDir,
      env: { ...process.env, ...request.env },
      timeout: request.timeout,
    });

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration,
      metadata: { executor: 'local-shell' },
    };
  }

  // ... minimal implementation
}
```

**Safety Rule**: Local shell executor **MUST** require explicit opt-in:

```yaml
# alex.agents.yaml
spec:
  dev:
    executor: local-shell  # Explicit opt-in required
    # Default is "docker" if omitted
```

---

## Future Executor: Playwright (Browser Automation)

**Use Case**: Operator (QA) agent needs to run E2E tests in real browser

**Design**:

```typescript
export class PlaywrightExecutor implements Executor {
  readonly id = 'playwright';

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // Launch headless browser
    const browser = await chromium.launch();
    const context = await browser.newContext();

    // Execute test scenario from alex.tests.yaml
    // Return screenshots, traces, etc.

    await browser.close();
    return result;
  }
}
```

Playwright runs **inside Docker container** for consistency:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
# Pre-installed Chromium, Firefox, WebKit
```

---

## Future Executor: OpenHands Adapter

**Use Case**: Integrate with OpenHands (formerly OpenDevin) for agentic coding

**Design**:

OpenHands runs its own sandboxed environment. Alex runtime sends requests to OpenHands API:

```typescript
export class OpenHandsExecutor implements Executor {
  readonly id = 'openhands';
  private apiEndpoint: string;

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // Send request to OpenHands API
    const response = await fetch(`${this.apiEndpoint}/execute`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return await response.json();
  }
}
```

This allows Alex to **delegate** complex coding tasks to OpenHands while maintaining interface compatibility.

---

## Executor Selection Strategy

Users configure executor in `alex.agents.yaml`:

```yaml
schemaVersion: "1.0.0"
kind: Agents

spec:
  dev:
    executor: docker          # Default
    image: hello-alex/runtime:latest

  qa:
    executor: playwright      # Browser tests
    headless: true

  # Optional: override for specific tasks
  tasks:
    - name: run-unit-tests
      executor: local-shell   # Fast, trusted code
    - name: run-e2e-tests
      executor: playwright    # Browser required
```

Runtime selects executor based on config + task requirements.

---

## Security Considerations

### Docker Executor Security

✅ **Non-root user**: Runs as `alexrunner` (UID 1000)  
✅ **Read-only filesystem**: Except `/workspace` mount  
✅ **No privileged mode**: Never use `--privileged`  
✅ **Resource limits**: CPU/memory caps to prevent DOS  
✅ **Network isolation**: No internet access unless explicitly allowed  
✅ **Secrets**: Passed via env vars, never mounted as files  

### Secrets Management

**Never** mount `.env` directly into container. Instead:

```typescript
// Read secrets from host .env
const secrets = dotenv.parse(fs.readFileSync('.env'));

// Pass as env vars to executor
await executor.execute({
  command: 'npm test',
  env: {
    DATABASE_URL: secrets.DATABASE_URL, // Explicitly allow
    // API keys, passwords, etc.
  },
});
```

Secrets are:
- Stored in `.env` (gitignored)
- Loaded by runtime
- Passed to executor as env vars
- Never written to container filesystem
- Destroyed when container stops

---

## Consequences

### Positive

✅ **Pluggable**: Easy to add new executors (OpenHands, remote, etc.)  
✅ **Safe by default**: Docker isolation prevents accidents  
✅ **Reproducible**: Same image = same results  
✅ **CI-ready**: Works in GitHub Actions out of box  
✅ **Multi-language**: Node + Python + shell in one executor  

### Negative

⚠️ **Docker required**: Users must install Docker (acceptable for devs)  
⚠️ **Cold start overhead**: ~2-3s (mitigated by keep-alive containers)  
⚠️ **Complexity**: More moving parts than direct shell execution  

### Neutral

- Power users can opt into local shell (with warnings)
- CI environments typically have Docker pre-installed
- Future: explore WebAssembly for sandboxing without Docker

---

## Implementation Notes

### Immediate Actions (v0.1)

- [x] Define `Executor` interface in `packages/alex-runtime/src/executor/`
- [ ] Implement `DockerExecutor` with basic shell + node support
- [ ] Create `Dockerfile` for runtime image
- [ ] Add executor selection logic in LangGraph flows
- [ ] Write executor tests (mock Docker API)

### Future Actions (v0.2+)

- [ ] Implement `PlaywrightExecutor` for browser tests
- [ ] Add container keep-alive pool (reuse containers)
- [ ] Implement `OpenHandsExecutor` adapter
- [ ] Add remote executor (SSH, Kubernetes pods)
- [ ] Explore WASM-based sandboxing (Wasmtime, Wasmer)

---

## Alternatives Considered

### Alternative 1: Virtual Machines (VMs)

**Pros**: Strongest isolation  
**Cons**: Slow startup (10-30s), heavy resource usage, complex management  
**Verdict**: Rejected. Overkill for code execution; Docker sufficient.

### Alternative 2: WebAssembly (WASM)

**Pros**: Fast, portable, no Docker required  
**Cons**: Limited language support (Rust, C++, AssemblyScript), no native Node/Python  
**Verdict**: Deferred to v0.3. Promising but not mature enough for v0.1.

### Alternative 3: Remote Execution (Cloud Sandboxes)

**Pros**: No local dependencies, unlimited resources  
**Cons**: Network latency, cost, vendor lock-in, privacy concerns  
**Verdict**: Rejected for v0.1. Keep local-first; cloud optional later.

### Alternative 4: Direct Shell Execution (No Isolation)

**Pros**: Simplest implementation, zero overhead  
**Cons**: **UNSAFE**—agents can read secrets, modify host, delete files  
**Verdict**: Available as opt-in `local-shell` executor with warnings. Never default.

---

## References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [LangGraph Executor Pattern](https://langchain-ai.github.io/langgraphjs/tutorials/executors/)
- [OpenHands Architecture](https://github.com/OpenDevin/OpenDevin)
- [Playwright in Docker](https://playwright.dev/docs/docker)

---

**Decision**: ACCEPTED  
**Signed**: Alex (Platform PM), Jason DeWater  
**Date**: October 5, 2025
