# Resource Refetch Patterns Implementation Plan

## Short Description

Implement transformation support for resource refetch patterns including manual refetch, automatic revalidation, and dependency-based refetching.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse resource refetch method calls
2. Transform to reactive refetch system
3. Handle manual and automatic refetching
4. Implement dependency-based invalidation
5. Support batched and debounced refetches
6. Optimize refetch scheduling and cancellation

## Framework Analysis

**How Major Frameworks Handle Refetching:**

**React Query:**
- `queryClient.invalidateQueries(key)` - marks queries as stale, triggers refetch
- `refetch()` - manual refetch function
- Automatic refetch: on window focus, interval, network reconnect
- Stale-while-revalidate pattern

**Solid.js (Gold Standard for PSR):**
- `refetch()` - manual refetch, returns promise
- `mutate(newData)` - optimistic update without fetching
- Reactive source: `createResource(() => userId(), fetchUser)` - refetches when `userId()` changes
- No built-in interval/focus refetch (add via effects)

**Vue (with composables):**
- `execute()` or `refresh()` functions from composables
- Manual watch triggers: `watch(source, () => refresh())`
- Libraries handle automatic revalidation

**Svelte:**
- Manual re-assignment: `promise = fetch()` triggers re-evaluation
- Reactive statements: `$: promise = fetch(param)` refetches when `param` changes

**Key Insights for PSR Implementation:**
1. **Manual Refetch:** Provide `refetch()` function that returns promise
2. **Reactive Source:** When source signal changes, auto-refetch
3. **Optimistic Updates:** `mutate()` updates data without fetching
4. **Cancellation:** Cancel in-flight requests when new refetch starts
5. **Batching:** Debounce multiple rapid refetch calls

**Implementation Strategy:**
- Expose `refetch()` method on resource tuple: `const [data, { refetch }] = createResource(...)`
- Track source signal - create effect that calls `refetch()` when source changes
- Implement request cancellation with AbortController
- Debounce refetch calls (100-300ms) to avoid rapid firing

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap all refetch transformation functions with `@traced`
- Log refetch type (manual/interval/conditional)
- Track transformation steps
- Collect diagnostics for missing intervals

## Test Requirements

Ask the agent to create test files:

- Integration tests for refetch pattern transformations
- Unit tests for refetch scheduling logic
- E2E tests for complex dependency scenarios

## Final Step

Invoke supervisor for review of implementation completion.
