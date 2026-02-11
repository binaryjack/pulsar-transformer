# Waiting Suspense Implementation Plan

## Short Description

Implement transformation support for `<Waiting default={fallback}>` suspense-like components for async operations.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Waiting default={fallback}>` syntax
2. Transform to async boundary system
3. Handle loading states and fallback rendering
4. Integrate with resource loading patterns
5. Support nested suspense boundaries
6. Implement timeout and error handling

## Framework Analysis

**How Major Frameworks Handle Suspense/Async Boundaries:**

**React:**
- `<Suspense fallback={<Loading />}>`
- Catches thrown promises from child components
- Works with `React.lazy()` for code splitting
- Can reveal content together or stream in parts
- Nested boundaries allow progressive loading
- `startTransition` prevents unwanted fallback display

**Solid.js (Gold Standard for PSR):**
- `<Suspense fallback={<Loading />}>`
- Waits for resources to resolve before showing children
- Works with `createResource()` - tracks loading states automatically
- Nested boundaries supported
- Resources can trigger nearest Suspense parent

**Vue:**
- `<Suspense>` built-in component (experimental in Vue 3)
- Waits for async `setup()` or async components
- Has `#default` and `#fallback` slots
- Can be triggered by async `setup()` returning promises

**Svelte:**
- No formal Suspense component
- Use `{#await promise}...{:then}...{:catch}` blocks
- Per-promise handling, not boundary-based
- SvelteKit handles page-level async loading

**Key Insights for PSR Implementation:**
1. **Boundary Pattern:** Suspense creates boundary that catches pending resources
2. **Fallback UI:** Show loading state while waiting for async operations
3. **Nested Support:** Child boundaries should take precedence over parents
4. **Integration with Resources:** Must work seamlessly with `createResource()`
5. **Prevent Flashing:** Don't show fallback for very quick loads

**Implementation Strategy:**
- Transform `<Waiting default={fallback}>` to Suspense-like boundary
- Track all pending resources inside boundary
- Show fallback when any resource is loading
- Switch to children when all resources resolved
- Support timeout for maximum fallback duration

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformWaitingComponent = traced('transformer', function(node: WaitingComponentNode) {
  // Implementation
}, {
  extractPertinent: (args, result) => ({
    hasDefault: !!args[0].default,
    childCount: args[0].children?.length || 0,
    isNested: result.isNested
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });

logger.debug('transform', 'Transforming Waiting component');
logger.time('waiting-transform');
const result = transformToSuspenseBoundary(node, context);
logger.info('transform', '✅ Waiting transformed', { hasDefault: !!node.default, isNested: result.isNested });
logger.timeEnd('waiting-transform');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'WaitingComponent', code: getCode(node), location: node.location },
  output: { nodeType: 'SuspenseBoundary', code: getGeneratedCode(result) },
  metadata: { reactive: true, hasDefault: !!node.default, boundaryId: result.boundaryId }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.default) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'warning',
    message: 'Waiting component without default may show empty content during loading',
    code: 'PSR-T-WARN-004',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column },
    suggestions: ['Add default prop for loading state UI']
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Waiting component transformation
- Unit tests for async boundary logic
- E2E tests for nested suspense scenarios

## Final Step

Invoke supervisor for review of implementation completion.
