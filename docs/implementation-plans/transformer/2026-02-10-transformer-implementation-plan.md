# Transformer Implementation Plan - Phase 4

**Date:** 2026-02-10  
**Priority:** HIGH (Architectural improvement)  
**Status:** 🟡 Planning  
**Supervisor:** [SESSION-SUPERVISOR-2026-02-10.md](../../SESSION-SUPERVISOR-2026-02-10.md)

---

## DESIGN PATTERNS

### Pattern 1: Visitor Pattern

**Purpose:** Traverse and transform AST nodes

```typescript
interface INodeTransformer {
  visitProgram(node: IProgramNode): IProgramNode;
  visitComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration;
  visitInterfaceDeclaration(node: IInterfaceDeclaration): IInterfaceDeclaration;
  visitExpression(node: IExpression): IExpression;
  // ... etc
}
```

### Pattern 2: Strategy Pattern

**Purpose:** Different transformation strategies per node type

```typescript
interface ITransformStrategy {
  canHandle(node: IASTNode): boolean;
  transform(node: IASTNode, context: ITransformContext): IASTNode;
}

// Strategies:
-ComponentToVariableStrategy -
  JSXPreservationStrategy -
  ImportInjectionStrategy -
  ReactivityPreservationStrategy;
```

### Pattern 3: Factory Pattern

**Purpose:** Create transformed AST nodes

```typescript
interface INodeFactory {
  createVariableDeclaration(name: string, init: IExpression): IVariableDeclaration;
  createImportDeclaration(source: string, specifiers: string[]): IImportDeclaration;
  createRegistryExecuteCall(componentName: string, body: IBlockStatement): ICallExpression;
  createArrowFunction(params: IParameter[], body: IBlockStatement): IArrowFunctionExpression;
}
```

### Pattern 4: Chain of Responsibility

**Purpose:** Delegate transformation to appropriate handler

```typescript
abstract class TransformHandler {
  next: TransformHandler | null;

  setNext(handler: TransformHandler): TransformHandler;
  handle(node: IASTNode, context: ITransformContext): IASTNode;
  canHandle(node: IASTNode): boolean;
}

// Chain:
ComponentHandler → FunctionHandler → ExpressionHandler → DefaultHandler
```

---

## ARCHITECTURE OVERVIEW

```
Transformer (Main Class)
├── Uses Visitor Pattern for traversal
├── Delegates to Strategy Pattern for node-specific transforms
├── Uses Factory Pattern for creating new nodes
└── Chain of Responsibility for handler selection

Context (Shared State)
├── usedImports: Set<string>
├── errors: ITransformError[]
├── sourceFile: string
└── nodeFactory: INodeFactory

Transformers (Strategies)
├── ComponentTransformer
├── ImportTransformer
├── JSXTransformer (delegates to CodeGenerator)
├── ExpressionTransformer
└── StatementTransformer
```

---

## IMPLEMENTATION STEPS

### Step 1: Core Infrastructure (1 hour)

**Files to create:**

```
src/transformer/
├── transformer.ts (Main class + interface)
├── transformer.types.ts (Context, Result, Error types)
├── index.ts (Registration + exports)
└── prototypes/ (Created but empty)
```

**transformer.types.ts:**

```typescript
export interface ITransformContext {
  sourceFile: string;
  usedImports: Set<string>;
  errors: ITransformError[];
  nodeFactory: INodeFactory;
}

export interface ITransformResult {
  ast: IProgramNode;
  context: ITransformContext;
}

export interface ITransformError {
  type: string;
  message: string;
  node: IASTNode;
}

export interface INodeFactory {
  createVariableDeclaration(
    name: string,
    init: IExpression,
    exported: boolean
  ): IVariableDeclaration;
  createImportDeclaration(source: string, specifiers: IImportSpecifier[]): IImportDeclaration;
  createArrowFunction(
    params: IParameter[],
    body: IBlockStatement,
    returnType?: ITypeAnnotation
  ): IArrowFunctionExpression;
  createRegistryExecuteCall(componentName: string, body: IBlockStatement): ICallExpression;
  createHTMLElementType(): ITypeAnnotation;
}
```

**transformer.ts:**

```typescript
export interface ITransformer {
  new (ast: IProgramNode, options?: Partial<ITransformContext>): ITransformer;

  ast: IProgramNode;
  context: ITransformContext;
  nodeFactory: INodeFactory;

  // Main API
  transform(): ITransformResult;

  // Visitor methods (one per node type)
  transformProgram(node: IProgramNode): IProgramNode;
  transformStatement(node: IStatementNode): IStatementNode;
  transformComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration;
  transformInterfaceDeclaration(node: IInterfaceDeclaration): IInterfaceDeclaration;
  transformVariableDeclaration(node: IVariableDeclaration): IVariableDeclaration;
  transformFunctionDeclaration(node: IFunctionDeclaration): IFunctionDeclaration;
  transformExpression(node: IExpression): IExpression;
  transformJSXElement(node: IJSXElement): IJSXElement;
  transformCallExpression(node: ICallExpression): ICallExpression;
  transformBlockStatement(node: IBlockStatement): IBlockStatement;

  // Import management
  addFrameworkImports(program: IProgramNode): void;
  collectUsedImports(node: IASTNode): void;

  // Utilities
  addError(type: string, message: string, node: IASTNode): void;
}
```

---

### Step 2: Node Factory (1 hour)

**File:** `src/transformer/node-factory/node-factory.ts`

```typescript
export interface INodeFactory {
  new (): INodeFactory;

  createVariableDeclaration(
    name: string,
    init: IExpression,
    exported: boolean
  ): IVariableDeclaration;
  createImportDeclaration(source: string, specifiers: IImportSpecifier[]): IImportDeclaration;
  createArrowFunction(
    params: IParameter[],
    body: IBlockStatement,
    returnType?: ITypeAnnotation
  ): IArrowFunctionExpression;
  createRegistryExecuteCall(componentName: string, body: IBlockStatement): ICallExpression;
  createHTMLElementType(): ITypeAnnotation;
  createImportSpecifier(imported: string, local: string): IImportSpecifier;
}

export const NodeFactory: INodeFactory = function (this: INodeFactory) {
  // No state needed
} as any;

export const NodeFactoryPrototype = NodeFactory.prototype;
```

**Prototype methods:**

- `prototypes/create-variable-declaration.ts`
- `prototypes/create-import-declaration.ts`
- `prototypes/create-arrow-function.ts`
- `prototypes/create-registry-execute-call.ts`
- `prototypes/create-html-element-type.ts`
- `prototypes/create-import-specifier.ts`

---

### Step 3: Component Transformation (2 hours) **CRITICAL**

**File:** `src/transformer/prototypes/transform-component-declaration.ts`

**Algorithm:**

```
INPUT: component Counter({id}: ICounterProps) { const [count] = createSignal(0); return <div>{count()}</div>; }

TRANSFORM:
1. Extract component name: "Counter"
2. Extract params: [{id}: ICounterProps]
3. Extract body: BlockStatement
4. Create RegistryExecuteCall wrapping body
5. Create ArrowFunction with params, returning HTMLElement
6. Create VariableDeclaration with name + arrow function
7. Mark as exported

OUTPUT:
export const Counter = ({id}: ICounterProps): HTMLElement => {
  return $REGISTRY.execute('component:Counter', () => {
    const [count] = createSignal(0);
    return <div>{count()}</div>;
  });
};
```

**Implementation:**

```typescript
import type { IComponentDeclaration, IVariableDeclaration } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

export function transformComponentDeclaration(
  this: ITransformer,
  node: IComponentDeclaration
): IVariableDeclaration {
  const { name, params, body, exported } = node;

  // Create registry execute call wrapping original body
  const registryCall = this.nodeFactory.createRegistryExecuteCall(name.name, body);

  // Wrap in return statement
  const returnStatement: IReturnStatement = {
    type: 'ReturnStatement',
    start: body.start,
    end: body.end,
    argument: registryCall,
  };

  // Create new block with return
  const wrappedBody: IBlockStatement = {
    type: 'BlockStatement',
    start: body.start,
    end: body.end,
    body: [returnStatement],
  };

  // Create arrow function
  const arrowFunction = this.nodeFactory.createArrowFunction(
    params,
    wrappedBody,
    this.nodeFactory.createHTMLElementType()
  );

  // Create variable declaration
  const varDecl = this.nodeFactory.createVariableDeclaration(name.name, arrowFunction, exported);

  // Track import usage
  this.context.usedImports.add('$REGISTRY');

  return varDecl;
}
```

---

### Step 4: Import Injection (1 hour)

**File:** `src/transformer/prototypes/add-framework-imports.ts`

**Algorithm:**

```
1. Scan context.usedImports
2. Group into categories:
   - Reactivity: createSignal, useEffect, createMemo, etc.
   - Runtime: t_element, $REGISTRY
3. Create ImportDeclaration for each group
4. Insert at top of program.body
```

**Implementation:**

```typescript
import type { IProgramNode, IImportDeclaration } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

export function addFrameworkImports(this: ITransformer, program: IProgramNode): void {
  const imports: IImportDeclaration[] = [];
  const usedImports = this.context.usedImports;

  // Reactivity primitives
  const reactivityImports = ['createSignal', 'useEffect', 'createMemo', 'createResource'].filter(
    (name) => usedImports.has(name)
  );

  if (reactivityImports.length > 0) {
    const specifiers = reactivityImports.map((name) =>
      this.nodeFactory.createImportSpecifier(name, name)
    );

    imports.push(
      this.nodeFactory.createImportDeclaration('@pulsar-framework/pulsar.dev', specifiers)
    );
  }

  // Runtime imports (always needed if components exist)
  const runtimeImports = ['t_element', '$REGISTRY'].filter((name) => usedImports.has(name));

  if (runtimeImports.length > 0) {
    const specifiers = runtimeImports.map((name) =>
      this.nodeFactory.createImportSpecifier(name, name)
    );

    imports.push(
      this.nodeFactory.createImportDeclaration('@pulsar-framework/pulsar.dev', specifiers)
    );
  }

  // Insert at top of program
  program.body.unshift(...imports);
}
```

---

### Step 5: Import Collection (1 hour)

**File:** `src/transformer/prototypes/collect-used-imports.ts`

**Algorithm:**

```
Traverse AST and detect usage of:
- createSignal, useEffect, createMemo
- $ REGISTRY (added by component transform)
- t_element (added by JSX transform in CodeGenerator)
```

**Implementation:**

```typescript
import type { IASTNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

export function collectUsedImports(this: ITransformer, node: IASTNode): void {
  if (!node) return;

  // Check for reactivity function calls
  if (node.type === 'CallExpression') {
    const callee = (node as any).callee;
    if (callee.type === 'Identifier') {
      const name = callee.name;
      if (['createSignal', 'useEffect', 'createMemo', 'createResource'].includes(name)) {
        this.context.usedImports.add(name);
      }
    }
  }

  // Recursively collect from child nodes
  for (const key in node) {
    const child = (node as any)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        child.forEach((item) => this.collectUsedImports(item));
      } else if (child.type) {
        this.collectUsedImports(child);
      }
    }
  }
}
```

---

### Step 6: Other Transforms (2 hours)

**Pass-through transformers (no transformation needed):**

- `transform-interface-declaration.ts` → Return node as-is
- `transform-variable-declaration.ts` → Return node as-is (but transform init expression)
- `transform-function-declaration.ts` → Return node as-is (but transform body)
- `transform-expression.ts` → Return node as-is (reactivity calls preserved)
- `transform-jsx-element.ts` → Return node as-is (CodeGenerator handles it)

**Active transformers:**

- `transform-statement.ts` → Route to specific transformer
- `transform-program.ts` → Transform all statements + add imports

---

### Step 7: Main Transform Method (1 hour)

**File:** `src/transformer/prototypes/transform.ts`

```typescript
import type { ITransformResult } from '../transformer.types.js';
import type { ITransformer } from '../transformer.js';

export function transform(this: ITransformer): ITransformResult {
  // 1. Collect used imports from original AST
  this.collectUsedImports(this.ast);

  // 2. Transform program
  const transformedAst = this.transformProgram(this.ast);

  // 3. Add framework imports
  this.addFrameworkImports(transformedAst);

  // 4. Return result
  return {
    ast: transformedAst,
    context: this.context,
  };
}
```

---

### Step 8: Program Transformation (1 hour)

**File:** `src/transformer/prototypes/transform-program.ts`

```typescript
import type { IProgramNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

export function transformProgram(this: ITransformer, node: IProgramNode): IProgramNode {
  const transformedBody = node.body.map((stmt) => this.transformStatement(stmt));

  return {
    ...node,
    body: transformedBody,
  };
}
```

---

### Step 9: Statement Router (30 mins)

**File:** `src/transformer/prototypes/transform-statement.ts`

```typescript
import type { IStatementNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

export function transformStatement(this: ITransformer, node: IStatementNode): IStatementNode {
  switch (node.type) {
    case 'ComponentDeclaration':
      return this.transformComponentDeclaration(node);
    case 'InterfaceDeclaration':
      return this.transformInterfaceDeclaration(node);
    case 'VariableDeclaration':
      return this.transformVariableDeclaration(node);
    case 'FunctionDeclaration':
      return this.transformFunctionDeclaration(node);
    case 'ImportDeclaration':
    case 'ExportNamedDeclaration':
      return node; // Pass through
    default:
      return node;
  }
}
```

---

## TESTING STRATEGY

### Unit Tests

**One test file per prototype method:**

```
__tests__/transformer/
├── transform.test.ts
├── transform-component.test.ts ← CRITICAL
├── add-framework-imports.test.ts
├── collect-used-imports.test.ts
├── node-factory.test.ts
└── transform-program.test.ts
```

### Integration Tests

**Golden fixture tests:**

```typescript
it('transforms Counter.psr correctly', () => {
  const source = readFixture('real-psr/1-counter/counter.psr');
  const result = fullPipeline(source); // Lexer → Parser → Transformer → CodeGenerator

  expect(result).toContain('export const Counter');
  expect(result).toContain('$REGISTRY.execute');
  expect(result).toContain('import { createSignal }');
});
```

---

## SUCCESS CRITERIA

- [ ] All 3 golden fixtures transform correctly
- [ ] Framework imports injected properly
- [ ] Components wrapped in $REGISTRY.execute
- [ ] Reactivity calls preserved unchanged
- [ ] No ES6 classes used
- [ ] No `any` types used
- [ ] One function per file
- [ ] No stubs or TODOs
- [ ] Prototype pattern followed
- [ ] All tests pass
- [ ] Compiles without errors

---

## TIMELINE

| Task                     | Time    | Cumulative |
| ------------------------ | ------- | ---------- |
| Core infrastructure      | 1 hour  | 1 hour     |
| Node factory             | 1 hour  | 2 hours    |
| Component transformation | 2 hours | 4 hours    |
| Import injection         | 1 hour  | 5 hours    |
| Import collection        | 1 hour  | 6 hours    |
| Other transforms         | 2 hours | 8 hours    |
| Main transform           | 1 hour  | 9 hours    |
| Program transformation   | 1 hour  | 10 hours   |
| Statement router         | 0.5 hr  | 10.5 hours |
| Testing                  | 2 hours | 12.5 hours |
| Debug & integration      | 2 hours | 14.5 hours |
| Documentation            | 1 hour  | 15.5 hours |

**Total: ~15.5 hours (2 days)**

---

## RISKS & MITIGATION

| Risk                                  | Mitigation                                      |
| ------------------------------------- | ----------------------------------------------- |
| JSX transformation conflicts          | Let CodeGenerator handle JSX, we pass through   |
| Missing type definitions              | Define all interfaces upfront                   |
| Integration with CodeGenerator breaks | Test integration early and often                |
| Reactivity calls get transformed      | Explicit check to preserve function calls       |
| Import tracking incomplete            | Comprehensive traversal of all expression types |

---

**Status:** 🟡 Awaiting approval to proceed  
**Next:** Implement Step 1 - Core Infrastructure
