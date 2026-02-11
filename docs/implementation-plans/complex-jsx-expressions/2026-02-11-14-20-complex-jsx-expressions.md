# Complex JSX Expressions Implementation Plan

## Short Description

Implement transformation support for complex JSX expressions including conditional rendering, logical operators, and nested expressions.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse complex JSX expression patterns
2. Handle conditional rendering (`condition ? value : fallback`)
3. Support logical operators (`&&`, `||`)
4. Transform nested expression hierarchies
5. Maintain reactivity for all expression dependencies
6. Optimize expression evaluation

## Framework Analysis

### How Major Frameworks Handle Complex JSX Expressions

**React:** Full JavaScript expressions in `{}` - ternary, logical AND/OR, optional chaining, etc. Re-evaluates on every render with Virtual DOM reconciliation.

**Solid.js:** Similar to React but with signal calls `()`. Expressions are reactive. `<Show>`/`<For>` components optimize conditional/list rendering with intelligent short-circuit evaluation.

**Vue 3:** Custom directives (`v-if`, `v-for`) instead of pure JavaScript. Expressions in attributes use JavaScript with automatic reactive tracking.

**Svelte:** Template syntax (`{#if}`, `{:else}`, `{#each}`). Compiler generates efficient update code with automatic dependency tracking.

**Key Insights for PSR:**

1. **Operator Precedence:** Must parse ternary, logical OR/AND correctly with proper precedence
2. **Short-Circuit Evaluation:** `a && b` shouldn't evaluate `b` if `a` is falsy (important for reactive dependencies!)
3. **Reactive Tracking:** Track which signals are read in each branch, wrap in computed when needed
4. **Expression Types:** Conditional, nullish `??`, call expressions, member chains `?.`, arithmetic, comparison
5. **Wire Call Generation:** Transform JSX to function calls (like Solid's `t_element()`) with reactive wrappers

**Implementation Strategy:** Use Pratt parser for precedence, wrap expressions in reactive computations, preserve JavaScript semantics (short-circuit, nullish, optional chaining).

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced, tracedLoop } from '../debug/tracer/index.js';

export const transformJSXExpression = traced(
  'transformer',
  function (expr: JSXExpression) {
    // Implementation
  },
  {
    extractPertinent: (args, result) => ({
      expressionType: args[0].expression.type,
      complexity: calculateComplexity(args[0]),
      requiresWire: result.requiresWire,
    }),
  }
);
```

### 2. Logger Integration

```typescript
const logger = createLogger({
  enabled: context.debug,
  level: 'debug',
  channels: ['transform', 'jsx'],
});

export function transformComplexExpression(expr: Expression) {
  logger.debug('jsx', `Transforming complex expression: ${expr.type}`);
  logger.time('jsx-complex-expression');

  const result = analyzeAndTransform(expr);

  logger.info('jsx', '✅ Expression transformed', {
    type: expr.type,
    requiresWire: result.requiresWire,
    operatorCount: countOperators(expr),
  });
  logger.timeEnd('jsx-complex-expression');
  return result;
}
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep({
  phase: 'classify',
  input: { nodeType: 'TernaryExpression', code: getCode(node), location: node.location },
  output: { nodeType: 'WiredExpression', code: getGeneratedCode(result) },
  metadata: { reactive: true, dependencies: extractDeps(node), generated: ['wire_call_' + id] },
});
```

### 4. Diagnostic Collection

```typescript
if (hasDeeplyNestedTernary(expr)) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'warning',
    message: 'Deeply nested ternary expressions may impact readability',
    code: 'PSR-T002',
    location: expr.location,
    suggestions: ['Consider extracting to separate computed values', 'Use switch/match instead'],
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for complex JSX transformations
- Unit tests for expression evaluation
- E2E tests for performance optimization

## Final Step

Invoke supervisor for review of implementation completion.
