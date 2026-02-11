# Create Context Providers Implementation Plan

## Short Description

Implement transformation support for `createContext()` provider components for state management across component trees.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `createContext()` function calls
2. Transform to reactive context system
3. Handle provider component generation
4. Implement context value propagation
5. Support context updates and subscriptions
6. Optimize context change notifications

## Framework Analysis

**How Major Frameworks Handle Context Creation:**

**React:**
- `const MyContext = createContext(defaultValue)`
- Returns object with `Provider` and `Consumer` components
- Usage: `<MyContext.Provider value={val}><Child /></MyContext.Provider>`
- Consumers re-render when context value changes

**Solid.js (Nearly Identical API):**
- `const MyContext = createContext(defaultValue)`
- Returns context object
- Usage: `<MyContext.Provider value={val}><Child /></MyContext.Provider>`
- Fine-grained reactivity - only components using changed values re-render

**Vue:**
- `provide(key, value)` in setup function or component
- String/Symbol key instead of context object
- Usage: `provide('theme', darkMode)`
- Can provide reactive refs - consumers react to changes

**Svelte:**
- `setContext(key, value)` with Symbol or string key
- No built-in reactivity - value is static when consumed
- Must manually use stores for reactive context

**Key Insights for PSR Implementation:**
1. **React/Solid API Most Familiar:** `createContext()` returns object used with Provider
2. **Reactive by Default:** Context value should be reactive (Solid model)
3. **Provider Component:** `<Context.Provider value={...}>` wraps children
4. **Default Value:** Used when no Provider ancestor exists
5. **Type Safety:** Context value should be strongly typed

**Implementation Strategy:**
- Transform `createContext(default)` to context object creation
- Generate `Context.Provider` component that stores value in tree
- Use signals for reactive context values
- Track component tree to find nearest Provider
- Throw error if no Provider and no default value

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformCreateContext = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    contextName: args[0].name,
    hasDefaultValue: result.hasDefaultValue
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', `Transforming createContext('${node.name}')`);
const result = transformContextProvider(node);
logger.info('transform', '✅ Context provider transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'CallExpression', name: 'createContext', location: node.location },
  output: { nodeType: 'ContextProvider', code: getGeneratedCode(result) },
  metadata: { contextName: node.name, reactive: true }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.defaultValue) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'info',
    message: 'Context without default value - consumers must check for undefined',
    code: 'PSR-T-INFO-005',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for context provider transformations
- Unit tests for context propagation logic
- E2E tests for complex provider hierarchies

## Final Step

Invoke supervisor for review of implementation completion.
