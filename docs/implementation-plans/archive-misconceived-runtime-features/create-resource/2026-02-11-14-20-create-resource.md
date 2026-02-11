# Create Resource Implementation Plan

## Short Description

Implement transformation support for `createResource()` function for reactive async data fetching and state management.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `createResource()` function calls
2. Transform to reactive resource system
3. Handle async data fetching patterns
4. Implement loading, success, and error states
5. Support resource dependencies and invalidation
6. Optimize resource caching and cleanup

## Framework Analysis

**How Major Frameworks Handle Async Data / Resources:**

**React:**
- `use()` hook (React 19+) for reading promises in render
- Must wrap in `<Suspense>` for loading states
- External libraries: React Query, SWR, Apollo Client
- React Query provides `useQuery(key, fetcher)` with caching, refetching, mutations

**Solid.js (Gold Standard for PSR):**
- `createResource(source, fetcher)` returns `[resource, { mutate, refetch }]`
- `resource()` returns data, `resource.loading`, `resource.error`, `resource.state`
- Driven by promises - automatically tracks loading/error/success
- Source can be a signal - resource refetches when source changes
- Integrates with `<Suspense>` to show fallback during loading

**Vue 3:**
- Composables like `useAsyncData` in Nuxt 3
- Built-in `<Suspense>` for async components
- Manual patterns: `ref()` + `onMounted(() => fetch())`
- Libraries: VueQuery, Apollo Vue

**Svelte:**
- Page-level `load()` functions in SvelteKit (runs before page render)
- `{#await promise}...{:then data}...{:catch error}` template syntax
- No built-in resource primitive like Solid

**Key Insights for PSR Implementation:**
1. **Solid's API is Gold Standard:** `createResource(source, fetcher)` pattern is clean and powerful
2. **Reactive Source:** When source signal changes, automatically refetch
3. **State Properties:** `.loading`, `.error`, `.state` for easy conditional rendering
4. **Suspense Integration:** Resources should trigger nearest `<Suspense>` boundary
5. **Accessor Pattern:** `resource()` returns current value, tracks as dependency

**Implementation Strategy:**
- Transform `createResource(fetcher)` to promise-based reactive resource
- Track loading/error/data states in signals
- Provide `mutate()` for optimistic updates
- Provide `refetch()` for manual invalidation
- Integrate with Suspense boundaries for loading UI

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformCreateResource = traced('transformer', function(node: CallExpression) {
  // Implementation
}, {
  extractPertinent: (args, result) => ({
    argCount: args[0].arguments?.length || 0,
    hasFetchFn: !!args[0].arguments?.[0],
    hasOptions: !!args[0].arguments?.[1],
    isReactive: result.isReactive
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });

logger.debug('transform', 'Transforming createResource call');
logger.time('create-resource-transform');
const result = transformToResourceSystem(node, context);
logger.info('transform', '✅ createResource transformed', { hasOptions: !!node.arguments?.[1] });
logger.timeEnd('create-resource-transform');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'CallExpression', code: getCode(node), location: node.location },
  output: { nodeType: 'ResourceExpression', code: getGeneratedCode(result) },
  metadata: { reactive: true, dependencies: extractDeps(node), generated: ['resource_' + id] }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.arguments?.[0] || node.arguments[0].type !== 'ArrowFunction') {
  context.diagnostics.push({
    phase: 'transform',
    type: 'error',
    message: 'createResource requires a fetch function as first argument',
    code: 'PSR-T-ERR-003',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column },
    suggestions: ['Provide async fetch function: createResource(async () => data)']
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for createResource transformation
- Unit tests for resource state management
- E2E tests for complex dependency scenarios

## Final Step

Invoke supervisor for review of implementation completion.
