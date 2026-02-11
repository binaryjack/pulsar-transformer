# Lazy Dynamic Imports Implementation Plan

## Short Description

Implement transformation support for `lazy(() => import('./Component'))` dynamic import patterns for code splitting.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `lazy(() => import())` syntax
2. Transform to dynamic import system
3. Handle lazy loading and code splitting
4. Implement loading states and fallbacks
5. Support preloading and prefetching
6. Optimize chunk management and caching

## Framework Analysis

**How Major Frameworks Handle Lazy Loading & Code Splitting:**

**React:**
- `const Component = React.lazy(() => import('./Component'))`
- Must wrap in `<Suspense fallback={<Loading />}>`
- Dynamic import returns promise that resolves to module with `default` export
- Webpack/Vite handles code splitting automatically

**Solid.js (Nearly Identical to React):**
- `const Component = lazy(() => import('./Component'))`
- Works with `<Suspense>` for loading states
- Returns component that triggers suspense on first render
- Integration with bundler (Vite/Rollup) for chunk creation

**Vue:**
- `const Component = defineAsyncComponent(() => import('./Component'))`
- Can provide `loadingComponent`, `errorComponent`, `delay`, `timeout`
- Works with `<Suspense>` or standalone
- More configuration options than React/Solid

**Svelte:**
- Manual dynamic imports: `const module = await import('./Component.svelte')`
- SvelteKit handles route-based code splitting automatically
- No built-in `lazy()` helper

**Key Insights for PSR Implementation:**
1. **Standard Pattern:** `lazy(() => import())` is industry standard (React/Solid)
2. **Suspense Integration:** Must trigger nearest `<Suspense>` boundary during load
3. **Promise-Based:** Dynamic import returns promise, component waits for resolution
4. **Default Export:** Imported module's `default` export is the component
5. **Bundler Integration:** Bundler (Vite) creates separate chunks automatically

**Implementation Strategy:**
- Transform `lazy(() => import('./Comp'))` to promise-wrapped component
- On first render, trigger import and show suspense fallback
- Cache loaded components (don't reimport)
- Provide `preload()` method: `Component.preload()`
- Error handling: failed imports trigger error boundary

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformLazyImport = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    importPath: args[0].importPath,
    chunkName: result.chunkName
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', `Transforming lazy(() => import('${node.importPath}'))`);
const result = transformDynamicImport(node);
logger.info('transform', '✅ Lazy import transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'CallExpression', code: getCode(node), location: node.location },
  output: { nodeType: 'LazyComponent', code: getGeneratedCode(result) },
  metadata: { importPath: node.importPath, chunkName: result.chunkName }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.importPath.startsWith('.')) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'info',
    message: 'Consider using relative imports for better code splitting',
    code: 'PSR-T-INFO-003',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for lazy import transformations
- Unit tests for loading state management
- E2E tests for code splitting scenarios

## Final Step

Invoke supervisor for review of implementation completion.
