# Catcher Error Handlers Implementation Plan

## Short Description

Implement transformation support for `<Catcher showRetry={true}>` error catcher components with retry functionality.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Catcher showRetry={true}>` syntax
2. Transform to error handler system with retry
3. Handle error recovery and retry logic
4. Implement exponential backoff strategies
5. Support customizable retry policies
6. Provide error analytics and monitoring

## Framework Analysis

**How Major Frameworks Handle Error Recovery & Retry:**

**React:**
- No built-in retry mechanism in error boundaries
- Manual implementation: state + retry button
- Libraries like React Query provide retry logic for data fetching
- Example: `onRetry={() => { reset(); refetch(); }}`

**Solid.js:**
- `<ErrorBoundary>` provides `reset()` function
- Reset clears error and re-mounts children
- Retry logic typically manual: `<button onClick={reset}>Retry</button>`
- For resources, combine with `refetch()`: `reset(); refetch();`

**Vue:**
- `errorCaptured()` can be called again on retry
- Manual state management for retry attempts
- No built-in retry count or exponential backoff

**Svelte:**
- Manual retry in `{:catch}` blocks
- Re-assign promise to trigger new attempt

**Libraries (React Query, SWR, etc.):**
- Built-in retry with exponential backoff
- `retry: 3, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)`
- Configurable retry conditions (e.g., only on network errors)

**Key Insights for PSR Implementation:**
1. **Retry Logic Separate from Catching:** Catcher should provide retry UI, not automatic retries
2. **Exponential Backoff:** For network errors, use `delay = baseDelay * 2^attempt`
3. **Max Retries:** Limit retry attempts (default 3)
4. **Conditional Retry:** Only retry certain error types (network, 5xx, not 4xx)
5. **User Control:** Always provide manual retry button, optional auto-retry

**Implementation Strategy:**
- `<Catcher>` component with `onRetry` prop
- Track retry count in signal
- Implement exponential backoff timer
- Reset retry count on success
- Show retry button in error fallback UI

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformCatcherHandler = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    hasRetry: args[0].hasRetry,
    retryStrategy: result.retryStrategy
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', 'Transforming Catcher with retry');
const result = transformErrorCatcher(node);
logger.info('transform', '✅ Catcher handler transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'JSXElement', name: 'Catcher', location: node.location },
  output: { nodeType: 'ErrorCatcherCall', code: getGeneratedCode(result) },
  metadata: { showRetry: node.showRetry, retryStrategy: result.retryStrategy }
});
```

### 4. Diagnostic Collection

```typescript
if (node.showRetry && !node.retryLimit) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'warning',
    message: 'Catcher with showRetry should define retryLimit to prevent infinite retries',
    code: 'PSR-T-WARN-003',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Catcher component transformation
- Unit tests for retry mechanism logic
- E2E tests for recovery and failure scenarios

## Final Step

Invoke supervisor for review of implementation completion.
