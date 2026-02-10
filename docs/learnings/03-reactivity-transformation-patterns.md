# Reactivity Transformation Patterns

**Research from: Solid.js, Vue 3, Svelte, React, Angular Signals**

---

## Core Concepts

### What is Reactive Transformation?

Reactive transformation is the process of converting declarative reactive code into imperative runtime calls that track dependencies and trigger updates automatically.

**PSR Input:**

```psr
component Counter() {
  const [count, setCount] = signal(0);
  return <div>{count()}</div>;
}
```

**Transformed Output:**

```typescript
function Counter() {
  const [count, setCount] = createSignal(0);
  return t_element('div', null, [count()]);
}
```

---

## Reactivity Models Overview

### 1. Fine-Grained Reactivity (Solid.js, Vue 3)

**Key:** Individual reactive primitives (signals) with automatic dependency tracking

```typescript
// Solid.js Model
const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log(count()); // Automatically tracked
});

setCount(1); // Automatically triggers effect
```

**Characteristics:**

- Getter functions for reactive reads: `count()`
- Setter functions for writes: `setCount(1)`
- Automatic subscription on read inside tracking scopes
- Synchronous updates by default
- No VDOM diffing needed

### 2. Compile-Time Reactivity (Svelte)

**Key:** Compiler analyzes code and injects tracking automatically

```svelte
<script>
  let count = 0; // Becomes reactive

  $: doubled = count * 2; // Reactive declaration

  function increment() {
    count += 1; // Compiler wraps this
  }
</script>
```

**Transformed:**

```javascript
let count = 0;

$$invalidate('count', count);

$: $$invalidate('doubled', (doubled = count * 2));

function increment() {
  $$invalidate('count', (count += 1));
}
```

### 3. Virtual DOM + Hooks (React)

**Key:** Re-render components, diff virtual DOMs

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return <div>{count}</div>; // Re-renders on setCount
}
```

**Characteristics:**

- Whole component re-executes
- VDOM diffing reconciles changes
- Batched updates
- Not fine-grained

### 4. Proxy-Based Reactivity (Vue 3)

**Key:** Proxies intercept property access

```javascript
const state = reactive({ count: 0 });

watchEffect(() => {
  console.log(state.count); // Tracked via proxy
});

state.count++; // Triggers effect
```

---

## Signal Transformation (Solid.js Pattern)

### Detection Phase

```typescript
// Detect signal calls in AST
function detectSignalCalls(ast: IProgramNode): ISignalInfo[] {
  const signals: ISignalInfo[] = [];

  walk(ast, {
    enter(node) {
      // Detect: const [x, setX] = signal(initialValue)
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'ArrayPattern' &&
        node.init?.type === 'CallExpression' &&
        node.init.callee.type === 'Identifier' &&
        node.init.callee.name === 'signal'
      ) {
        const [getter, setter] = node.id.elements;

        signals.push({
          getter: getter.name,
          setter: setter.name,
          initialValue: node.init.arguments[0],
          declarationNode: node,
        });
      }
    },
  });

  return signals;
}
```

### Transformation Phase

```typescript
function transformSignalDeclaration(node: IVariableDeclarator): IVariableDeclarator {
  // Transform: signal(0) → createSignal(0)
  if (node.init?.type === 'CallExpression' && node.init.callee.name === 'signal') {
    return {
      ...node,
      init: {
        ...node.init,
        callee: {
          type: 'Identifier',
          name: 'createSignal',
        },
      },
    };
  }

  return node;
}
```

### Tracking Signal Access

```typescript
interface ISignalAccess {
  signalName: string;
  isRead: boolean; // x() - getter call
  isWrite: boolean; // setX(value)
  location: INode;
}

function trackSignalAccess(ast: IProgramNode, signals: ISignalInfo[]): ISignalAccess[] {
  const accesses: ISignalAccess[] = [];
  const signalNames = new Set(signals.map((s) => s.getter));
  const setterNames = new Set(signals.map((s) => s.setter));

  walk(ast, {
    enter(node) {
      // Track getter calls: count()
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        signalNames.has(node.callee.name) &&
        node.arguments.length === 0
      ) {
        accesses.push({
          signalName: node.callee.name,
          isRead: true,
          isWrite: false,
          location: node,
        });
      }

      // Track setter calls: setCount(1)
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        setterNames.has(node.callee.name)
      ) {
        accesses.push({
          signalName: node.callee.name,
          isRead: false,
          isWrite: true,
          location: node,
        });
      }
    },
  });

  return accesses;
}
```

---

## Effect Transformation

### Detecting Effects

```typescript
// Detect: createEffect(() => { ... })
function detectEffects(ast: IProgramNode): IEffectInfo[] {
  const effects: IEffectInfo[] = [];

  walk(ast, {
    enter(node) {
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        (node.callee.name === 'createEffect' ||
          node.callee.name === 'createMemo' ||
          node.callee.name === 'createComputed')
      ) {
        effects.push({
          type: node.callee.name,
          callback: node.arguments[0],
          dependencies: extractDependencies(node.arguments[0]),
        });
      }
    },
  });

  return effects;
}

function extractDependencies(callback: IArrowFunctionExpression): string[] {
  const deps: string[] = [];

  // Find all signal getter calls inside effect
  walk(callback.body, {
    enter(node) {
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.arguments.length === 0
      ) {
        // Likely a signal getter
        deps.push(node.callee.name);
      }
    },
  });

  return deps;
}
```

### JSX Expression Wrapping

**Key Insight:** JSX expressions that read signals need to be wrapped in tracking scopes

```typescript
// Transform JSX expressions to track dependencies
function transformJSXExpression(node: IJSXExpressionContainer): IJSXExpressionContainer {
  const expression = node.expression;

  // Check if expression contains signal reads
  const hasSignalReads = containsSignalReads(expression);

  if (hasSignalReads) {
    // Wrap in tracking function
    return {
      ...node,
      expression: {
        type: 'ArrowFunctionExpression',
        params: [],
        body: expression,
        async: false,
      },
    };
  }

  return node;
}

// Example transformation:
// <div>{count()}</div>
// ↓
// t_element('div', null, [() => count()])
```

---

## Memo/Computed Transformation

### Solid.js createMemo

```typescript
// Input: const double = () => count() * 2;
// Should be: const double = createMemo(() => count() * 2);

function detectMemoOpportunities(ast: IProgramNode): IMemoCandidate[] {
  const candidates: IMemoCandidate[] = [];

  walk(ast, {
    enter(node) {
      // Detect arrow functions that read signals
      if (
        node.type === 'VariableDeclarator' &&
        node.init?.type === 'ArrowFunctionExpression' &&
        node.init.params.length === 0
      ) {
        const readsSignals = containsSignalReads(node.init.body);

        if (readsSignals) {
          candidates.push({
            name: node.id.name,
            function: node.init,
            shouldBeMemo: true,
          });
        }
      }
    },
  });

  return candidates;
}

function transformToMemo(node: IVariableDeclarator): IVariableDeclarator {
  return {
    ...node,
    init: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'createMemo',
      },
      arguments: [node.init],
    },
  };
}
```

### Vue Computed

```typescript
// Vue pattern: const double = computed(() => count.value * 2);
function transformVueComputed(node: IVariableDeclarator): IVariableDeclarator {
  if (
    node.init?.type === 'ArrowFunctionExpression' &&
    containsReactiveReads(node.init.body, 'value')
  ) {
    return {
      ...node,
      init: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'computed',
        },
        arguments: [node.init],
      },
    };
  }

  return node;
}
```

---

## Event Handler Transformation

### Solid.js Event Delegation

```typescript
// Transform: onClick={() => setCount(count() + 1)}
// To: onClick={[handleClick, count, setCount]}

function transformEventHandler(attr: IJSXAttribute): IJSXAttribute {
  if (attr.name.name.startsWith('on') && attr.value?.type === 'JSXExpressionContainer') {
    const handler = attr.value.expression;

    // Extract dependencies from handler
    const deps = extractDependencies(handler);

    // Solid uses event delegation for efficiency
    return {
      ...attr,
      value: {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'ArrayExpression',
          elements: [handler, ...deps.map((d) => ({ type: 'Identifier', name: d }))],
        },
      },
    };
  }

  return attr;
}
```

---

## Svelte Reactivity Transformation

### Reactive Declarations

```typescript
// Svelte: $: doubled = count * 2;
// Transformed: subscribe to dependencies, update on change

interface IReactiveDeclaration {
  dependencies: string[];
  statement: IStatement;
}

function transformSvelteReactiveDeclaration(node: IReactiveDeclaration): IExpressionStatement {
  // Generate reactive update code
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: '$$subscribe',
      },
      arguments: [
        // Dependencies
        {
          type: 'ArrayExpression',
          elements: node.dependencies.map((dep) => ({
            type: 'Identifier',
            name: dep,
          })),
        },
        // Update function
        {
          type: 'ArrowFunctionExpression',
          params: [],
          body: node.statement,
        },
      ],
    },
  };
}
```

### Svelte Stores

```typescript
// Svelte stores: $count (auto-subscribe)
function transformSvelteStoreAccess(node: IIdentifier): IMemberExpression {
  if (node.name.startsWith('$')) {
    const storeName = node.name.slice(1);

    return {
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: storeName,
      },
      property: {
        type: 'Identifier',
        name: 'value',
      },
      computed: false,
    };
  }

  return node;
}
```

---

## Vue Reactivity Transformation

### Ref Unwrapping

```typescript
// Vue: const count = ref(0);
// Access: count.value

function transformVueRef(node: IVariableDeclarator): IVariableDeclarator {
  if (node.init?.type === 'CallExpression' && node.init.callee.name === 'ref') {
    // Mark as ref for later unwrapping
    return {
      ...node,
      __isRef: true,
    };
  }

  return node;
}

function unwrapRef(node: IIdentifier, refs: Set<string>): INode {
  if (refs.has(node.name)) {
    return {
      type: 'MemberExpression',
      object: node,
      property: {
        type: 'Identifier',
        name: 'value',
      },
      computed: false,
    };
  }

  return node;
}
```

### Reactive Proxy

```typescript
// Vue: const state = reactive({ count: 0 });
// No transformation needed - runtime proxy handles it

function detectVueReactive(node: IVariableDeclarator): boolean {
  return (
    node.init?.type === 'CallExpression' &&
    (node.init.callee.name === 'reactive' ||
      node.init.callee.name === 'ref' ||
      node.init.callee.name === 'computed')
  );
}
```

---

## Dependency Graph Construction

### Track Dependencies Between Signals

```typescript
interface IDependencyGraph {
  nodes: Map<string, IDependencyNode>;
  edges: IDependencyEdge[];
}

interface IDependencyNode {
  name: string;
  type: 'signal' | 'memo' | 'effect';
  reads: string[];
  writes: string[];
}

interface IDependencyEdge {
  from: string;
  to: string;
  type: 'read' | 'write';
}

function buildDependencyGraph(ast: IProgramNode): IDependencyGraph {
  const graph: IDependencyGraph = {
    nodes: new Map(),
    edges: [],
  };

  // Find all reactive declarations
  const signals = detectSignalCalls(ast);
  const effects = detectEffects(ast);
  const memos = detectMemos(ast);

  // Add nodes
  signals.forEach((s) => {
    graph.nodes.set(s.getter, {
      name: s.getter,
      type: 'signal',
      reads: [],
      writes: [s.setter],
    });
  });

  effects.forEach((e) => {
    graph.nodes.set(e.id, {
      name: e.id,
      type: 'effect',
      reads: e.dependencies,
      writes: [],
    });

    // Add edges
    e.dependencies.forEach((dep) => {
      graph.edges.push({
        from: dep,
        to: e.id,
        type: 'read',
      });
    });
  });

  return graph;
}
```

### Detect Circular Dependencies

```typescript
function detectCircularDependencies(graph: IDependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (stack.includes(node)) {
      // Found cycle
      const cycleStart = stack.indexOf(node);
      cycles.push(stack.slice(cycleStart));
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    stack.push(node);

    // Follow edges
    const edges = graph.edges.filter((e) => e.from === node);
    edges.forEach((edge) => dfs(edge.to));

    stack.pop();
  }

  graph.nodes.forEach((_, nodeName) => {
    dfs(nodeName);
  });

  return cycles;
}
```

---

## Optimization: Static vs Dynamic

### Solid.js Static Optimization

```typescript
// Detect static JSX (no reactive reads)
function isStaticJSX(node: IJSXElement): boolean {
  let hasSignals = false;

  walk(node, {
    enter(n) {
      if (
        n.type === 'CallExpression' &&
        n.callee.type === 'Identifier' &&
        n.arguments.length === 0
      ) {
        // Likely signal read
        hasSignals = true;
      }
    },
  });

  return !hasSignals;
}

// Static JSX → Direct DOM creation (no tracking)
function transformStaticJSX(node: IJSXElement): ICallExpression {
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 't_element_static', // No reactivity overhead
    },
    arguments: [
      { type: 'StringLiteral', value: node.openingElement.name.name },
      transformAttributes(node.openingElement.attributes),
      transformChildren(node.children),
    ],
  };
}

// Dynamic JSX → Reactive DOM creation (with tracking)
function transformDynamicJSX(node: IJSXElement): ICallExpression {
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 't_element', // With reactivity
    },
    arguments: [
      { type: 'StringLiteral', value: node.openingElement.name.name },
      transformAttributes(node.openingElement.attributes),
      transformChildren(node.children, true), // Mark as reactive
    ],
  };
}
```

---

## Batch Updates

### Svelte Batching

```typescript
// Svelte batches updates within a tick
function transformSvelteBatch(statements: IStatement[]): IStatement {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'tick',
      },
      arguments: [
        {
          type: 'ArrowFunctionExpression',
          params: [],
          body: {
            type: 'BlockStatement',
            body: statements,
          },
        },
      ],
    },
  };
}
```

### Solid.js batch()

```typescript
// Wrap multiple updates in batch
function wrapInBatch(updates: IExpressionStatement[]): IExpressionStatement {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'batch',
      },
      arguments: [
        {
          type: 'ArrowFunctionExpression',
          params: [],
          body: {
            type: 'BlockStatement',
            body: updates,
          },
        },
      ],
    },
  };
}
```

---

## Untrack/Sample (Reading Without Tracking)

```typescript
// Sometimes we need to read a signal without creating a dependency
// Solid: untrack(() => count())

function transformUntrack(node: ICallExpression): ICallExpression {
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'untrack',
    },
    arguments: [
      {
        type: 'ArrowFunctionExpression',
        params: [],
        body: node,
      },
    ],
  };
}
```

---

## Critical Patterns for PSR

1. **Signal Detection**: Find `signal()` calls, extract getter/setter names
2. **Signal Transformation**: `signal()` → `createSignal()`
3. **Tracking Scopes**: Detect where signals are read (effects, JSX, memos)
4. **JSX Expression Wrapping**: Wrap reactive JSX expressions
5. **Dependency Extraction**: Build dependency graph
6. **Static Optimization**: Detect and optimize static JSX
7. **Event Delegation**: Transform event handlers for efficiency
8. **Batch Updates**: Group updates to minimize re-renders

---

**References:**

- Solid.js: `babel-preset-solid` transformer
- Vue 3: `@vue/reactivity`, `@vue/compiler-core`
- Svelte: Compiler reactive declarations
- React: Hooks model (for context)
- Angular: Signals RFC

**Next:** [04-jsx-to-runtime-transformation.md](./04-jsx-to-runtime-transformation.md)
