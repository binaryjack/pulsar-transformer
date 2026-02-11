# Type Inference System Implementation Plan

## Short Description

Implement automatic type inference system for PSR transformations to automatically detect and assign appropriate types.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Build type inference engine
2. Analyze expression types automatically
3. Infer return types from function bodies
4. Handle union and intersection types
5. Provide fallback mechanisms for complex types
6. Optimize inference performance

## Framework Analysis

**How Major Frameworks Handle Type Inference:**

**TypeScript (Foundation):**
- Contextual typing from assignment targets
- Return type inference from function bodies
- Generic type inference from call arguments
- Control flow analysis for type narrowing
- Structural typing with compatibility checking

**React:**
- `useState()` infers type from initial value: `useState(0)` → `number`
- `useRef(null)` requires explicit type: `useRef<HTMLDivElement>(null)`
- Props inference from component definition
- Event handler types inferred from JSX attributes

**Solid.js:**
- `createSignal(value)` infers from initial value
- `createMemo(() => expr)` infers return type
- `createResource(fetcher)` infers from fetcher's return type (unwraps Promises)
- Accessor types: `() => T` inferred automatically

**Vue 3:**
- `ref(0)` → `Ref<number>` via inference
- Computed property types from getter return
- Template expressions inferred from setup return
- `provide/inject` requires explicit types for safety

**Svelte:**
- Reactive statements `$:` infer from RHS
- Store types inferred from initial value
- Props with TypeScript require explicit typing (no inference from usage)

**Key Insights for PSR Type Inference:**
1. **Initial Value Inference:** Most frameworks infer from initial values (e.g., `createSignal(0)` → `Signal<number>`)
2. **Function Return Inference:** Analyze function bodies to infer return types automatically
3. **Contextual Inference:** Use assignment context (e.g., `const x: number = createSignal(...)` should validate compatibility)
4. **Promise Unwrapping:** For resources, unwrap `Promise<T>` to `T` automatically
5. **Fallback to `unknown`:** When inference fails, use `unknown` (safer than `any`)
6. **Performance Trade-offs:** Full type inference is expensive; cache results aggressively

**Implementation Strategy:**
- Build type inference engine integrated with semantic analyzer
- Implement unification algorithm for constraint solving
- Support gradual typing (explicit annotations take precedence)
- Provide clear diagnostics when inference fails
- Cache inferred types to avoid recomputation

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced } from '../debug/tracer/index.js';

export const inferType = traced('semantic', function(expr: Expression, context: TypeContext) {
  // Implementation
}, {
  extractPertinent: (args, result) => ({
    exprType: args[0].type,
    inferredType: result.inferredType?.toString() || 'unknown',
    confidence: result.confidence,
    rulesApplied: result.appliedRules?.length || 0
  })
});
```

### 2. Logger Integration

```typescript
import { createLogger } from '../debug/logger.js';

const logger = createLogger({ enabled: context.debug, level: 'debug', channels: ['semantic'] });

export function inferType(expr: Expression, context: TypeContext) {
  logger.debug('semantic', `Inferring type for ${expr.type}`);
  logger.time('type-inference');
  
  const inferredType = performInference(expr, context);
  
  logger.info('semantic', '✅ Type inferred', {
    type: inferredType.toString(),
    confidence: inferredType.confidence
  });
  logger.timeEnd('type-inference');
  return inferredType;
}
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'analyze',
  input: { nodeType: expr.type, code: getCode(expr), location: expr.location },
  output: { nodeType: 'TypedExpression', code: getCode(expr) },
  metadata: { inferredType: result.type.toString(), confidence: result.confidence }
});
```

### 4. Diagnostic Collection

```typescript
if (result.confidence < 0.8) {
  context.diagnostics.push({
    phase: 'analyze',
    type: 'warning',
    message: `Low confidence type inference (${(result.confidence * 100).toFixed(0)}%)`,
    code: 'PSR-A-WARN-002',
    location: { file: context.sourceFile, line: expr.location.line, column: expr.location.column },
    suggestions: ['Add explicit type annotation', 'Provide more type context']
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for type inference accuracy
- Unit tests for inference algorithm
- E2E tests for complex type scenarios

## Final Step

Invoke supervisor for review of implementation completion.
