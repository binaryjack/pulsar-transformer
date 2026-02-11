# Portal Transformation Implementation Plan

## Short Description

Implement transformation support for `<Portal mount="#root">` portal components for rendering content outside normal hierarchy.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse `<Portal mount="#root">` syntax
2. Transform to portal rendering system
3. Handle DOM mounting and unmounting
4. Implement portal target resolution
5. Support dynamic portal targets
6. Manage portal context and event handling

## Framework Analysis

**How Major Frameworks Handle Portals:**

**React:**
- `ReactDOM.createPortal(children, domNode)`
- Imperative API - pass DOM node reference
- Renders children into different DOM subtree
- Events bubble through React tree (not DOM tree)
- Context preserved across portal boundary

**Solid.js:**
- `<Portal mount={element}>children</Portal>`
- Component-based API (JSX component)
- `mount` prop accepts DOM element or signal
- Can use `useShadow` prop for Shadow DOM
- Events bubble through component tree

**Vue:**
- `<Teleport to="#target">children</Teleport>`
- Uses CSS selector string (not DOM reference)
- Can target elements that don't exist yet (deferred mount)
- `disabled` prop to conditionally teleport or render in-place
- Context/provide-inject preserved

**Svelte:**
- No built-in portal component
- Custom actions or libraries (e.g., `svelte-portal`)
- Manual DOM manipulation with `use:portal`

**Key Insights for PSR Implementation:**
1. **Component vs Function:** Component-based (Solid/Vue) more declarative than imperative (React)
2. **Target Specification:** CSS selector (Vue) vs DOM element (React/Solid)
3. **Context Preservation:** All frameworks preserve context across portal
4. **Event Bubbling:** Events should bubble through component tree, not DOM tree
5. **Lifecycle:** Portal cleanup when component unmounts

**Implementation Strategy:**
- Transform `<Portal mount={target}>` to portal system
- Support both DOM element and CSS selector for `mount` prop
- Preserve reactive context across portal boundary
- Implement custom event bubbling through component tree
- Clean up portal content when component unmounts

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const transformPortal = traced('transformer', (node) => {
  /* implementation */
}, {
  extractPertinent: (args, result) => ({
    mountTarget: args[0].mountTarget,
    hasContext: result.hasContext
  })
});
```

### 2. Logger Integration

```typescript
const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['transform'] });
logger.debug('transform', `Transforming Portal mount="${node.mountTarget}"`);
const result = transformPortalComponent(node);
logger.info('transform', '✅ Portal transformed');
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'transform',
  input: { nodeType: 'JSXElement', name: 'Portal', location: node.location },
  output: { nodeType: 'PortalCall', code: getGeneratedCode(result) },
  metadata: { mountTarget: node.mountTarget, dynamic: node.isDynamic }
});
```

### 4. Diagnostic Collection

```typescript
if (!node.mountTarget) {
  context.diagnostics.push({
    phase: 'transform',
    type: 'error',
    message: 'Portal requires mount target',
    code: 'PSR-T-ERR-004',
    location: { file: context.sourceFile, line: node.location.line, column: node.location.column }
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for Portal component transformations
- Unit tests for DOM manipulation logic
- E2E tests for portal interaction scenarios

## Final Step

Invoke supervisor for review of implementation completion.
