# Dynamic Components Implementation Plan

## Short Description

Implement transformation support for `<Dynamic component={fn} />` dynamic component rendering based on runtime conditions.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Dynamic component={fn} />` syntax
2. Transform to reactive dynamic component system
3. Handle component switching and cleanup
4. Preserve component state during switches
5. Implement efficient component caching
6. Support prop forwarding to dynamic components

## Framework Analysis

**How Major Frameworks Handle Dynamic Components:**

**React:**
- JSX elements are just function calls, so dynamic rendering is natural:
  ```jsx
  const Component = condition ? ComponentA : ComponentB;
  return <Component {...props} />;
  ```
- No special component required
- Re-renders when `Component` reference changes

**Solid.js (Gold Standard for PSR):**
- `<Dynamic component={comp()} {...props} />`
- Efficiently switches between different components
- Cleans up old component instances automatically
- Props forwarded to current component
- Useful for plugin systems and runtime component selection

**Vue:**
- `<component :is="currentComponent" />` built-in component
- Accepts component name (string) or component definition (object)
- Works with `v-bind` for prop forwarding
- Can use `<keep-alive>` wrapper to preserve state

**Svelte:**
- `<svelte:component this={Component} />` special element
- Allows dynamic component instantiation
- Props passed as regular attributes

**Key Insights for PSR Implementation:**
1. **Component as Data:** Treat component references as reactive values
2. **Cleanup Required:** Old component must be disposed when switching
3. **Prop Forwarding:** All props should pass through to current component
4. **Type Safety:** TypeScript should validate props match component signature
5. **Performance:** Component switching should not recreate entire tree

**Implementation Strategy:**
- Transform `<Dynamic component={comp()}>` to reactive component switcher
- Track current component in a signal/memo
- Dispose previous component effects before switching
- Use effect to handle component changes
- Forward props using spread operator

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformDynamicComponent = traced('transformer', function(node: DynamicComponentNode) {
  // Implementation
}, {
  extractPertinent: (args, result) => ({
    hasComponentProp: !!args[0].component,
    propCount: Object.keys(args[0].props || {}).length,
    isReactive: result.isReactive
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform', 'jsx'] });

export function transformDynamicComponent(node: DynamicComponentNode, context: TransformContext) {
  logger.debug('transform', 'Transforming Dynamic component');
  logger.time('dynamic-component-transform');
  
  const result = transformToReactiveDynamic(node, context);
  
  logger.info('transform', '✅ Dynamic component transformed', {
    hasComponent: !!node.component,
    isReactive: result.isReactive
  });
  logger.timeEnd('dynamic-component-transform');
  return result;
}
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'DynamicComponent', code: getCode(node), location: node.location },
  output: { nodeType: 'DynamicExpression', code: getGeneratedCode(result) },
  metadata: { reactive: true, dependencies: extractDeps(node), cachingEnabled: result.hasCaching }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.component) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'error',
    message: 'Dynamic component requires component prop',
    code: 'PSR-T-ERR-002',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column },
    suggestions: ['Add component={ComponentFunction} prop']
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Dynamic component transformation
- Unit tests for component switching logic
- E2E tests for state preservation scenarios

## Final Step

Invoke supervisor for review of implementation completion.
