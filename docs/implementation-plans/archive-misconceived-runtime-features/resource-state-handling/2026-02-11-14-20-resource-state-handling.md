# Resource State Handling Implementation Plan

## Short Description

Implement transformation support for resource state handling patterns like `resource.isLoading`, `resource.error`, and `resource.data`.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse resource state access patterns
2. Transform to reactive state getters
3. Handle loading, error, and success states
4. Implement proper state transitions
5. Support state-based conditional rendering
6. Optimize state change notifications

## Framework Analysis

**How Major Frameworks Handle Resource State:**

**React Query (React Ecosystem):**
- `const { data, isLoading, isError, error } = useQuery(key, fetcher)`
- State properties: `isLoading`, `isFetching`, `isSuccess`, `isError`
- `status` enum: 'idle' | 'loading' | 'success' | 'error'

**Solid.js (Gold Standard for PSR):**
- `resource.loading` - boolean, true during fetch
- `resource.error` - error object if fetch failed
- `resource.state` - enum: 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'
- `resource()` - returns data (undefined during loading)
- All properties are reactive - automatically update UI when state changes

**Vue (with composables):**
- `const { data, pending, error } = useAsyncData(fetcher)`
- Manual state management with `ref()` for loading/error flags

**Svelte:**
- Template `{#await}` syntax: `{#await promise}...{:then data}...{:catch err}`
- Access state inline within template

**Key Insights for PSR Implementation:**
1. **Multiple State Properties:** Provide both boolean flags (`.loading`, `.error`) and enum (`.state`)
2. **Reactive by Default:** State properties should be reactive getters/signals
3. **Conditional Rendering:** Enable patterns like `<Show when={!resource.loading}>`
4. **State Transitions:** unresolved → pending → ready|errored, or ready → refreshing → ready
5. **Undefined vs Stale:** Distinguish between no data yet vs. showing stale data during refetch

**Implementation Strategy:**
- Store state in internal signals: `loading`, `error`, `data`
- Expose as properties: `resource.loading`, `resource.error`, `resource()`
- Implement state machine for transitions
- Emit state change events for debugging

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformResourceState = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    property: args[0].property,
    isReactive: result.isReactive
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', `Transforming resource.${node.property}`);
const result = transformResourceProperty(node);
logger.info('transform', '✅ Resource state transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'MemberExpression', code: getCode(node), location: node.location },
  output: { nodeType: 'ResourceStateAccess', code: getGeneratedCode(result) },
  metadata: { reactive: true, stateProperty: node.property }
});
```

### 4. Diagnostic Collection

```typescript
if (node.property === 'data' && !hasErrorCheck(context)) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'info',
    message: 'Consider checking resource.error before accessing data',
    code: 'PSR-T-INFO-001',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for resource state transformations
- Unit tests for state transition logic
- E2E tests for complex state scenarios

## Final Step

Invoke supervisor for review of implementation completion.
