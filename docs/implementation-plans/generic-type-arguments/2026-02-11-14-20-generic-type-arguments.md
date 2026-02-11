# Generic Type Arguments Implementation Plan

## Short Description

Implement transformation support for generic type arguments in PSR components and function signatures.

## Mandatory AI Task Before Start

- Read carefully and respect the following rules
- Link to ai-collaboration-rules: `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\docs\ai-collaboration-rules.json`

## What to Do

1. Parse generic type syntax (`<T>`, `<T extends U>`)
2. Transform generic component definitions
3. Handle type constraints and bounds
4. Preserve type information in output
5. Support generic function transformations
6. Ensure type safety throughout transformation

## Framework Analysis

**How Major Frameworks Handle Generics & Type Parameters:**

**TypeScript (Gold Standard):**
- Full generic support with `<T>`, `<T extends U>`, `<T = DefaultType>`
- Constrained generics with `extends` keyword
- Conditional types: `T extends U ? X : Y`
- Mapped types: `{ [K in keyof T]: T[K] }`
- Generic functions, classes, interfaces, type aliases
- Type inference from usage context

**React:**
- Fully leverages TypeScript generics for component props
- `React.FC<Props>`, `useState<T>()`, `useRef<T>()`
- Generic component definitions: `function Component<T>(props: Props<T>)`
- Type inference from initial values and usage

**Solid.js:**
- Similar to React, full TypeScript generic support
- `Component<T>`, `createSignal<T>()`, `createResource<T>()`
- Generic accessor functions: `Accessor<T>`
- Type-safe control flow components

**Vue 3:**
- `defineComponent` with generic props
- `ref<T>()`, `reactive<T>()` with type parameters
- Template type inference from setup return types
- Generic composables with full inference

**Key Insights for PSR Implementation:**
1. **Full TypeScript Syntax:** PSR must support ALL TypeScript generic syntax (constraints, defaults, inference)
2. **Preserve During Transformation:** Type information must survive the PSR→JS transformation for IDE support
3. **Type-Safe Primitives:** All PSR primitives (signals, resources, etc.) must be generic-first
4. **Inference Optimization:** Let TypeScript infer types when possible (e.g., `createSignal(0)` → `Signal<number>`)
5. **Error Messages:** Provide clear type error messages when constraints are violated

**Implementation Strategy:**
- Parse TypeScript AST to extract generic type parameters and constraints
- Preserve type annotations in transformed output (for `.d.ts` generation)
- Implement type checking for PSR-specific primitives
- Support generic HOCs and utility types for PSR patterns

## Debug Tracking Requirements

**CRITICAL:** While implementing this feature, ensure the debug tracker system has comprehensive tracing:

### 1. Tracer Integration

```typescript
import { traced, tracedLoop } from '../debug/tracer/index.js';

export const transformGenericComponent = traced('transformer', function(node: GenericComponentNode) {
  // Implementation
}, {
  extractPertinent: (args, result) => ({
    typeParamCount: args[0].typeParameters?.length || 0,
    constraints: args[0].typeParameters?.map(p => p.constraint?.type) || [],
    inferredTypes: result.inferredTypes
  })
});

export function processTypeParameters(params: TypeParameter[]) {
  return tracedLoop('transformer', params, (param, i) => {
    return resolveTypeParameter(param);
  }, {
    extractPertinent: (param) => ({
      name: param.name,
      hasConstraint: !!param.constraint,
      hasDefault: !!param.default
    })
  });
}
```

### 2. Logger Integration

```typescript
import { createLogger } from '../debug/logger.js';

const logger = createLogger({
  enabled: context.debug,
  level: 'debug',
  channels: ['transform', 'semantic']
});

export function transformGenericComponent(node: GenericComponentNode, context: TransformContext) {
  logger.debug('transform', `Transforming generic component with ${node.typeParameters?.length || 0} type parameters`);
  logger.time('generic-component-transform');
  
  try {
    const result = resolveGenericTypes(node, context);
    
    logger.info('transform', '✅ Generic component transformed', {
      typeParams: node.typeParameters?.map(p => p.name) || [],
      resolved: result.resolvedTypes,
      hasConstraints: node.typeParameters?.some(p => p.constraint) || false
    });
    
    return result;
  } catch (error) {
    logger.error('transform', '❌ Generic component transformation failed', {
      nodeType: node.type,
      typeParamCount: node.typeParameters?.length || 0,
      error: error.message
    });
    throw error;
  } finally {
    logger.timeEnd('generic-component-transform');
  }
}
```

### 3. Transformation Step Tracking

```typescript
trackTransformStep(context, {
  phase: 'analyze',
  input: {
    nodeType: 'GenericComponent',
    code: getNodeCode(node),
    location: node.location
  },
  output: {
    nodeType: 'TypedComponent',
    code: getGeneratedCode(result)
  },
  metadata: {
    reactive: isReactive(node),
    typeParameters: node.typeParameters?.map(p => p.name) || [],
    constraints: extractConstraints(node),
    resolved: result.resolvedTypes
  }
});
```

### 4. Diagnostic Collection

```typescript
if (hasUnconstrainedTypeParameter(node)) {
  context.diagnostics.push({
    phase: 'analyze',
    type: 'warning',
    message: 'Unconstrained generic type parameter may reduce type safety',
    code: 'PSR-A-WARN-001',
    location: {
      file: context.sourceFile,
      line: node.location.line,
      column: node.location.column
    },
    suggestions: [
      'Add type constraints using extends keyword',
      'Provide default type arguments',
      'Document expected type characteristics'
    ]
  });
}

if (hasCircularTypeReference(node)) {
  context.diagnostics.push({
    phase: 'analyze',
    type: 'error',
    message: 'Circular type reference detected',
    code: 'PSR-A-ERR-001',
    location: {
      file: context.sourceFile,
      line: node.location.line,
      column: node.location.column
    },
    suggestions: [
      'Break circular reference using type indirection',
      'Review type parameter constraints'
    ]
  });
}
```

## Test Requirements

Ask the agent to create test files:

- Integration tests for generic component transformation
- Unit tests for type constraint handling
- E2E tests for complex generic scenarios

## Final Step

Invoke supervisor for review of implementation completion.
