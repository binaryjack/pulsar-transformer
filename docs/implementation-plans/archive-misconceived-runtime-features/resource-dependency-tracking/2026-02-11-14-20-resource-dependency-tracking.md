# Resource Dependency Tracking Implementation Plan

## Short Description

Implement transformation support for resource dependency tracking to automatically manage resource invalidation and updates.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse resource dependency declarations
2. Transform to automatic dependency tracking
3. Implement dependency graph management
4. Handle circular dependency detection
5. Support selective invalidation strategies
6. Optimize dependency update propagation

## Framework Analysis

**How Major Frameworks Track Resource Dependencies:**

**React Query:**
- Manual dependency tracking via query keys
- `queryClient.invalidateQueries(['user', userId])` - invalidates queries matching key pattern
- No automatic dependency graph - developers specify relationships

**Solid.js (Gold Standard for PSR):**
- Automatic reactive dependency tracking
- `createResource(() => userId(), (id) => fetchUser(id))` - source function is tracked
- When `userId()` signal changes, resource automatically refetches
- No manual dependency management needed

**Vue 3:**
- `watch()` and `watchEffect()` for manual dependency management
- Reactive proxy system tracks property access automatically
- Composables can watch multiple sources: `watch([source1, source2], () => refetch())`

**Svelte:**
- Reactive statements track dependencies at compile time
- `$: promise = fetchData(param)` - compiler detects `param` dependency
- Automatic invalidation when dependencies change

**Key Insights for PSR Implementation:**
1. **Automatic Tracking:** Solid's reactive tracking is best - no manual dependency specification
2. **Source Function:** `createResource(source, fetcher)` - source is tracked automatically
3. **Signal-Based:** Dependencies are reactive signals, not keys/strings
4. **Selective Invalidation:** Only refetch when relevant dependencies change
5. **Avoid Over-Fetching:** Track fine-grained dependencies, not entire objects

**Implementation Strategy:**
- When source function runs, track accessed signals
- Create effect that re-runs source when dependencies change
- When source changes, trigger resource refetch
- Detect circular dependencies (resource depends on itself)
- Optimize by memoizing source computation

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap dependency analysis with `@traced`  
- Log dependency graph construction
- Track reactive dependency chains
- Collect diagnostics for circular dependencies

## Test Requirements

Ask the agent to create test files:

- Integration tests for dependency tracking transformations
- Unit tests for dependency graph algorithms
- E2E tests for complex dependency networks

## Final Step

Invoke supervisor for review of implementation completion.
