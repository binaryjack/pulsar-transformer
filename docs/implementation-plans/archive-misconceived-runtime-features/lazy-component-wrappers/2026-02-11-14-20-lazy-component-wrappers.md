# Lazy Component Wrappers Implementation Plan

## Short Description

Implement transformation support for `<LazyComponent loader={fn} />` wrapper components for lazy loading with enhanced features.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<LazyComponent loader={fn} />` syntax
2. Transform to enhanced lazy loading system
3. Handle custom loader functions
4. Implement loading strategies and timeouts
5. Support error handling for failed loads
6. Optimize loader performance and caching

## Framework Analysis

**How Major Frameworks Handle Lazy Component Wrappers:**

**React:**
- `React.lazy()` is the basic wrapper
- Libraries provide enhanced wrappers: `@loadable/component`
- `@loadable/component` offers: `fallback`, `ssr`, `cacheKey`, `suspense` options

**Solid.js:**
- Basic `lazy()` wrapper provided
- Can create custom wrappers with enhanced features
- Example: timeout, retry, multiple attempts

**Vue:**
- `defineAsyncComponent()` is feature-rich wrapper:
  - `loader`: import function
  - `loadingComponent`: show while loading
  - `errorComponent`: show on error
  - `delay`: ms before showing loading component
  - `timeout`: ms before treating as error
  - `suspensible`: work with Suspense or not
  - `onError(error, retry, fail, attempts)`: custom error handling

**Svelte:**
- No built-in wrapper, manual implementation needed

**Key Insights for PSR Implementation:**
1. **Vue's API Most Complete:** Provides timeout, delay, error component, retry
2. **Configurable Wrapper:** Allow customization beyond basic `lazy()`
3. **Timeout Support:** Treat long-loading components as errors
4. **Delay Before Loading UI:** Avoid flashing loading state for fast loads
5. **Retry Logic:** Allow multiple load attempts with backoff

**Implementation Strategy:**
- Provide enhanced `lazyWithOptions()` wrapper
- Support options: `timeout`, `delay`, `onError`, `maxRetries`
- Integrate with suspense and error boundaries
- Default timeout: 10 seconds
- Default delay before loading UI: 200ms

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap LazyComponent transformation with `@traced`
- Log custom loader execution
- Track loading strategy and timeout handling
- Collect diagnostics for load failures

## Test Requirements

Ask the agent to create test files:

- Integration tests for LazyComponent transformations
- Unit tests for loader execution logic
- E2E tests for loading failure scenarios

## Final Step

Invoke supervisor for review of implementation completion.
