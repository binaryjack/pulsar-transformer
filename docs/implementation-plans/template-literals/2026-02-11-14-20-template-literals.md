# Template Literals Implementation Plan

## Short Description

Implement transformation support for template literals with `${}` expressions in PSR syntax to reactive JavaScript code.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Analyze template literal syntax patterns in PSR files
2. Implement parser support for `${}` expressions within template strings
3. Transform template literals to reactive computed values
4. Handle nested expressions and reactive dependencies
5. Ensure proper escaping and string interpolation
6. Test with complex template literal scenarios

## Framework Analysis

### How Major Frameworks Handle Template Literals / String Interpolation

**React (JSX):**
```jsx
<div>Hello {user.name}! You have {messages.length} unread</div>
```
- Direct JavaScript expression embedding with `{}`
- Expressions evaluated at render time
- No special string syntax - just JS expressions in JSX

**Solid.js:**
```jsx
<div>Hello {name()}! Count: {count()}</div>
```
- Signal calls within JSX: `{signal()}`
- Fine-grained reactivity - only text nodes update
- Compiled to efficient DOM mutations
- Template strings work as normal JS: `` `Hello ${name()}` ``

**Vue 3:**
```vue
<div>Hello {{ user.name }}! You have {{ messages.length }} unread</div>
```
- Mustache syntax `{{ }}` for interpolation
- Compiled to `_toDisplayString()` runtime calls
- Reactive tracking via Proxy automatically
- In <code v-bind>: Normal JS template literals work

**Svelte:**
```svelte
<div>Hello {$name}! Count: {count}</div>
```
- Similar to JSX with `{}` for expressions
- `$:` for reactive statements
- Compiler analyzes dependencies
- Generates targeted `$$invalidate()` calls

**Key Insights for PSR:**

1. **Compilation Target:** Template literals should compile to reactive expressions
   - Solid: Wraps in computed when needed
   - Vue: Uses compile-time dependency tracking
   - PSR: Should detect reactive dependencies in `${}` expressions

2. **Dependency Tracking:** Must identify what signals are read
   - Track all reactive reads within `${}` expressions
   - Create computed/memo if contains reactive dependencies
   - Otherwise, evaluate once at creation

3. **Performance:** Avoid re-evaluating entire template literal
   - Only update changed parts
   - Cache static portions
   - Solid's approach: Separate text nodes for each expression

4. **Edge Cases to Handle:**
   - Nested template literals: `` `outer ${`inner ${x}`}` ``
   - Escaping: `` `Price: \${100}` `` (literal dollar sign)
   - Complex expressions: `` `Result: ${a + b * c}` ``
   - Conditional expressions: `` `Hello ${user ? user.name : 'Guest'}` ``

**Implementation Strategy:**

Follow Solid.js model:
- Parse template literal into static parts + dynamic expressions
- Wrap dynamic expressions in reactive computations
- Generate efficient string concatenation or text node updates
- Preserve JavaScript semantics while adding reactivity

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced, tracedLoop } from '../debug/tracer/index.js';

// Wrap main transformation function
export const transformTemplateLiteral = traced(
  'transformer',
  function (node: TemplateLiteralNode) {
    // Implementation
  },
  {
    extractPertinent: (args, result) => ({
      expressionCount: args[0].expressions.length,
      hasReactivity: result.hasReactivity,
      outputType: result.type,
    }),
  }
);

// Wrap loops processing expressions
export function processTemplateExpressions(expressions: Expression[]) {
  return tracedLoop(
    'transformer',
    expressions,
    (expr, i) => {
      // Process each ${} expression
    },
    {
      extractPertinent: (expr) => ({
        type: expr.type,
        isReactive: expr.isReactive,
        position: expr.location,
      }),
    }
  );
}
```

### 2. Logger Integration

```typescript
import { createLogger } from '../debug/logger.js';

const logger = createLogger({
  enabled: context.debug,
  level: 'debug',
  channels: ['transform'],
});

export function transformTemplateLiteral(node: TemplateLiteralNode) {
  logger.debug(
    'transform',
    `Transforming template literal with ${node.expressions.length} expressions`
  );
  logger.time('template-literal-transform');

  try {
    const result = performTransformation(node);
    logger.info('transform', '✅ Template literal transformed', {
      expressionCount: node.expressions.length,
      isReactive: result.isReactive,
    });
    return result;
  } catch (error) {
    logger.error('transform', '❌ Template literal transform failed', error);
    throw error;
  } finally {
    logger.timeEnd('template-literal-transform');
  }
}
```

### 3. Transformation Step Tracking

```typescript
// Track each step of the transformation
function trackTransformStep(step: ITransformStep) {
  context.steps.push({
    id: generateStepId(),
    phase: 'transform',
    timestamp: Date.now(),
    input: {
      nodeType: 'TemplateLiteral',
      code: getNodeCode(node),
      location: node.location,
    },
    output: {
      nodeType: 'ComputedExpression',
      code: getGeneratedCode(result),
    },
    metadata: {
      reactive: result.isReactive,
      dependencies: result.dependencies,
      generated: result.generatedFunctions,
    },
  });
}
```

### 4. Diagnostic Collection

```typescript
// Collect diagnostics for warnings and errors
if (expression.hasUntrackedDependency) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'warning',
    message: 'Template expression contains untracked reactive dependency',
    code: 'PSR-T001',
    location: expression.location,
    suggestions: ['Wrap the expression in createMemo()', 'Use tracked context for reactive access'],
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for template literal transformation
- Unit tests for expression parsing
- E2E tests for complex nested scenarios

## Final Step

Invoke supervisor for review of implementation completion.
