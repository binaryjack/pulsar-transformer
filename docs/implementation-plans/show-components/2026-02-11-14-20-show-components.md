# Show Components Implementation Plan

## Short Description

Implement transformation support for `<Show when={condition}>` conditional rendering components.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Show when={condition}>` syntax
2. Transform to reactive conditional rendering
3. Handle fallback content with `<Show.Fallback>`
4. Optimize re-rendering performance
5. Support nested Show components
6. Ensure proper cleanup on condition changes

## Framework Analysis

**How Major Frameworks Handle Conditional Rendering:**

**React:**
- Ternary operators: `{condition ? <A /> : <B />}`
- Logical AND: `{condition && <Component />}`
- Re-renders entire subtree when condition changes
- No built-in component wrapper

**Solid.js (Gold Standard for PSR):**
- `<Show when={condition()} fallback={<Loading />}>`
- Only evaluates the branch that matches the condition
- Prevents unnecessary reactive subscriptions in unused branches
- Automatically tracks dependencies in `when` expression
- `fallback` prop for else case

**Vue:**
- `v-if`/`v-else-if`/`v-else` directives
- Elements not in DOM when false (truly conditional)
- `v-show` for CSS `display` toggle (always in DOM)
- `v-if` is lazy - won't render until condition is true

**Svelte:**
- `{#if condition}...{:else}...{/if}` template syntax
- Compiler generates efficient DOM manipulation
- True/false branches never coexist in memory

**Key Insights for PSR Implementation:**
1. **Lazy Evaluation:** Solid's `<Show>` prevents subscribing to signals in unused branches
2. **Fallback Pattern:** Explicit `fallback` prop is clearer than implicit else blocks
3. **Performance:** Only the active branch should be reactive
4. **Cleanup:** Proper disposal of computations when switching branches
5. **Nested Support:** Must handle `<Show>` inside `<Show>` without issues

**Implementation Strategy:**
- Transform `<Show when={cond}>` to conditional signal evaluation
- Use `createMemo()` for condition to deduplicate checks
- Wrap branches in lazy functions that only run when needed
- Implement automatic cleanup when condition changes

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
export const transformShowComponent = traced(
  'transformer',
  function (node: ShowComponent) {
    // Implementation
  },
  {
    extractPertinent: (args, result) => ({
      hasWhen: !!args[0].when,
      hasFallback: !!args[0].fallback,
      childCount: args[0].children.length,
      reactive: result.isReactive,
    }),
  }
);
```

### 2. Logger Integration

```typescript
logger.debug('transform', `Transforming Show component`);
logger.time('show-component-transform');

const result = transformConditionalRendering(node);

logger.info('transform', '✅ Show component transformed', {
  hasWhen: !!node.when,
  hasFallback: !!node.fallback,
  isReactive: result.isReactive,
});
logger.timeEnd('show-component-transform');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep({
  phase: 'transform',
  input: { nodeType: 'ShowComponent', code: getCode(node), location: node.location },
  output: { nodeType: 'ConditionalExpression', code: getGeneratedCode(result) },
  metadata: {
    reactive: true,
    dependencies: [node.when.deps],
    generated: ['conditional_' + id],
  },
});
```

### 4. Diagnostic Collection

```typescript
if (!node.when) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'error',
    message: 'Show component requires when prop',
    code: 'PSR-T005',
    location: node.location,
    suggestions: ['Add when={condition} prop'],
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Show component transformation
- Unit tests for condition evaluation
- E2E tests for nested conditional scenarios

## Final Step

Invoke supervisor for review of implementation completion.
