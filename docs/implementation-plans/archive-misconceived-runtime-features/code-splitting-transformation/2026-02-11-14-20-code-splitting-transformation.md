# Code Splitting Transformation Implementation Plan

## Short Description

Implement transformation support for automatic code splitting based on component boundaries and usage patterns.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Analyze component dependency graphs
2. Transform to optimal code splitting points
3. Handle chunk boundaries and dependencies
4. Implement split point optimization
5. Support manual and automatic splitting
6. Optimize bundle size and loading performance

## Framework Analysis

**How Major Frameworks Handle Code Splitting:**

**React:**
- Manual: `React.lazy(() => import('./Component'))`
- Route-based: React Router with lazy imports
- Bundler (Webpack/Vite) creates chunks based on `import()` calls
- Magic comments: `import(/* webpackChunkName: "my-chunk" */ './Comp')`

**Solid.js:**
- Same as React: `lazy(() => import())`
- Vite/Rollup handle chunking
- Route-based splitting in Solid Router

**Vue:**
- Component-based: `defineAsyncComponent(() => import())`
- Route-based: Vue Router with async components
- Webpack/Vite create chunks automatically

**Svelte:**
- SvelteKit: route-based splitting by default
- Each route file becomes separate chunk
- Can manually split with dynamic imports in `load()` functions

**Next.js (Framework Level):**
- Automatic page-based splitting
- Can manually split: `dynamic(() => import(), { ssr: false })`
- Shared chunks for common dependencies

**Key Insights for PSR Implementation:**
1. **Route-Based is Default:** Most apps split by route, not component
2. **Manual Control:** Provide `lazy()` for manual split points
3. **Shared Chunks:** Bundler handles deduplication of common dependencies
4. **Naming:** Allow chunk naming with comments or options
5. **Analysis:** Help developers identify optimal split points

**Implementation Strategy:**
- Transform: each `lazy(() => import())` creates split point
- Automatic: detect route boundaries, split automatically
- Analyze: identify large deps, suggest splitting
- Bundler integration: generate Vite/Rollup config
- Provide stats: chunk sizes, load times, dependency graph

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1-4. Debug Integration (Standard Pattern)

See DEBUG-TRACKING-TEMPLATE.md for full implementation. Key points:
- Wrap dependency graph analysis with `@traced`
- Log split point identification
- Track chunk size optimization
- Collect diagnostics for bundle performance

## Test Requirements

Ask the agent to create test files:

- Integration tests for code splitting transformations
- Unit tests for dependency analysis
- E2E tests for bundle optimization scenarios

## Final Step

Invoke supervisor for review of implementation completion.
