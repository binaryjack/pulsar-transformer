# Tryer Error Boundaries Implementation Plan

## Short Description

Implement transformation support for `<Tryer fallback={error}>` error boundary components for graceful error handling.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Tryer fallback={error}>` syntax
2. Transform to error boundary system
3. Handle error catching and fallback rendering
4. Implement error recovery mechanisms
5. Support nested error boundaries
6. Provide error reporting and logging

## Framework Analysis

**How Major Frameworks Handle Error Boundaries:**

**React:**
- Class components only: `componentDidCatch(error, info)` and `getDerivedStateFromError(error)`
- No function component support yet (as of React 18)
- Catches errors during render, lifecycle methods, and constructors
- Does NOT catch: event handlers, async code, SSR errors
- Example: `<ErrorBoundary fallback={<ErrorUI />}>`

**Solid.js (Gold Standard for PSR):**
- `<ErrorBoundary fallback={(err, reset) => <ErrorUI error={err} onReset={reset} />}>`
- Function component-based (no class required)
- `reset()` function clears error and re-renders children
- Catches errors in child computations and effects
- Can nest boundaries for granular error handling

**Vue:**
- `errorCaptured(err, instance, info)` lifecycle hook
- Return `false` to stop propagation
- Global error handler: `app.config.errorHandler`
- Catches errors in templates, watchers, lifecycle hooks

**Svelte:**
- No formal error boundary component
- Use `{:catch}` blocks for promise errors
- Manual try-catch in event handlers
- On error, component tree may be left in inconsistent state

**Key Insights for PSR Implementation:**
1. **Reset Function:** Solid's `reset()` callback is essential for recovery
2. **Function-Based:** No need for class components like React
3. **Fallback Pattern:** `fallback={(err, reset) => JSX}` provides error and reset handler
4. **Scope:** Catch errors in children's render, effects, and computations
5. **Nested Boundaries:** Inner boundary catches first, outer is fallback

**Implementation Strategy:**
- Transform `<Tryer fallback={...}>` to error boundary wrapper
- Use try-catch around child render functions
- Store error in signal, show fallback when error exists
- Provide `reset()` that clears error signal and re-renders
- Propagate uncaught errors to parent boundary

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformTryerBoundary = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    hasFallback: args[0].hasFallback,
    errorHandling: result.errorHandling
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', 'Transforming Tryer boundary');
const result = transformErrorBoundary(node);
logger.info('transform', '✅ Error boundary transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'JSXElement', name: 'Tryer', location: node.location },
  output: { nodeType: 'ErrorBoundaryCall', code: getGeneratedCode(result) },
  metadata: { fallback: true, errorHandling: node.fallback }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.fallback) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'warning',
    message: 'Tryer without fallback prop will not catch errors',
    code: 'PSR-T-WARN-002',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Tryer component transformation
- Unit tests for error boundary logic
- E2E tests for error recovery scenarios

## Final Step

Invoke supervisor for review of implementation completion.
