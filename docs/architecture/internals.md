# Pulsar Transformer Internals - Deep Dive

**Understanding How Pulsar Transforms TSX to Optimized JavaScript**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The Three-Phase Pipeline](#the-three-phase-pipeline)
3. [Phase 1: JSX Analysis (Parser)](#phase-1-jsx-analysis-parser)
4. [Phase 2: Code Generation](#phase-2-code-generation)
5. [Phase 3: Optimization (Optional)](#phase-3-optimization-optional)
6. [Reactivity System](#reactivity-system)
7. [Key Concepts](#key-concepts)
8. [Component vs Element Handling](#component-vs-element-handling)
9. [Complete Transformation Examples](#complete-transformation-examples)
10. [Integration with Build Tools](#integration-with-build-tools)

---

## Architecture Overview

Pulsar's transformer is a **TypeScript compiler plugin** that intercepts TSX/JSX syntax during compilation and transforms it into optimized vanilla JavaScript DOM manipulation code.

### Core Philosophy

- ✅ **No Virtual DOM**: Direct DOM manipulation
- ✅ **Fine-grained Reactivity**: Only update what changes
- ✅ **Zero Runtime Overhead**: All transformations happen at compile-time
- ✅ **TypeScript-first**: Full type safety and compiler integration

### High-Level Flow

```
TSX Source Code
    ↓
[TypeScript Parser] → Creates AST (Abstract Syntax Tree)
    ↓
[Pulsar Transformer]
    ├─→ [JSXAnalyzer] → Analyzes JSX nodes → Creates IR (Intermediate Representation)
    ├─→ [ElementGenerator] → Generates TypeScript AST from IR
    └─→ [Optimizer] → Optional optimization passes
    ↓
Optimized JavaScript Output
```

---

## The Three-Phase Pipeline

### Entry Point: `visualSchemaTransformer()`

Located in: `packages/pulsar-transformer/src/index.ts`

```typescript
export default function visualSchemaTransformer(
  program: ts.Program,
  config?: IRegistryTransformConfig
): ts.TransformerFactory<ts.SourceFile>;
```

**What it does:**

1. Creates a `TransformationContext` with program, typeChecker, and sourceFile
2. Instantiates `JSXAnalyzer` and `ElementGenerator`
3. Sets up a recursive visitor to traverse the AST
4. Transforms JSX nodes when encountered
5. Adds runtime imports (`createEffect`, `createMemo`, `createSignal`)
6. Optionally runs optimization passes

### The Visitor Pattern

```typescript
const transformVisitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
  // ⚡ Key: Transform JSX immediately - don't visit children first!
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    const elementIR = analyzer.analyze(node);
    const generatedCode = generator.generate(elementIR);
    return generatedCode;
  }

  // For non-JSX nodes, visit children to find nested JSX
  return ts.visitEachChild(node, transformVisitor, context);
};
```

**Why this matters:**

- JSX nodes are transformed **immediately** without visiting their children first
- The analyzer handles ALL nested JSX during the analysis phase
- This prevents double-transformation and maintains correct nesting

---

## Phase 1: JSX Analysis (Parser)

**Location:** `packages/pulsar-transformer/src/parser/jsx-analyzer/`

The analyzer converts JSX syntax into an **Intermediate Representation (IR)** that the generator can work with.

### JSXAnalyzer Class (Prototype-based)

```typescript
export const JSXAnalyzer =
  function (this: IJSXAnalyzer, context: ITransformationContext) {
    Object.defineProperty(this, 'context', { value: context, writable: false });
  } -
  // Prototype methods:
  analyze() - // Main entry point
  analyzeProps() - // Extracts properties/attributes
  analyzeChildren() - // Processes child nodes
  extractDependencies() - // Finds reactive dependencies
  extractEvents() - // Identifies event handlers
  isStaticElement() - // Determines if element needs reactivity
  isStaticValue(); // Checks if expression is constant
```

### The `analyze()` Method

**File:** `src/parser/jsx-analyzer/prototype/analyze.ts`

```typescript
export const analyze = function (this: IJSXAnalyzer, node: ts.Node): any {
  // 1. Handle JSX Fragments (<></>)
  if (ts.isJsxFragment(node)) {
    return {
      type: 'fragment',
      children: this.analyzeChildren(node.children),
    };
  }

  // 2. Handle JSX Elements (<div>...</div>)
  if (ts.isJsxElement(node)) {
    const openingElement = node.openingElement;
    const { text: tagName } = getTagName(openingElement.tagName);

    // Check if it's a Component (uppercase) or element (lowercase)
    if (isComponentTag(tagName)) {
      return {
        type: 'component',
        component: tagExpression,
        props: this.analyzeProps(openingElement.attributes),
        children: this.analyzeChildren(node.children),
      };
    }

    // Regular HTML element
    return {
      type: 'element',
      tag: tagName,
      props: this.analyzeProps(openingElement.attributes),
      children: this.analyzeChildren(node.children),
      isStatic: this.isStaticElement(node),
      hasDynamicChildren: node.children.some(
        (child) => ts.isJsxExpression(child) && child.expression
      ),
      events: this.extractEvents(openingElement.attributes),
      key: null,
    };
  }

  // 3. Handle Self-Closing Elements (<Button />)
  if (ts.isJsxSelfClosingElement(node)) {
    // Similar logic as above, but no children
  }
};
```

### Analyzing Props

**File:** `src/parser/jsx-analyzer/prototype/analyze-props.ts`

```typescript
export const analyzeProps = function (attributes: ts.JsxAttributes): any[] {
  const props: any[] = [];

  attributes.properties.forEach((prop) => {
    if (ts.isJsxAttribute(prop)) {
      const name = prop.name.text;
      const initializer = prop.initializer;

      // Extract expression from JsxExpression wrapper
      let value: ts.Expression;
      if (ts.isJsxExpression(initializer)) {
        value = initializer.expression; // {count()} → count()
      } else {
        value = initializer; // "static" → "static"
      }

      const isStatic = ts.isStringLiteral(initializer) || ts.isNumericLiteral(initializer);

      props.push({
        name,
        value,
        isStatic,
        isDynamic: !isStatic,
        dependsOn: isStatic ? [] : this.extractDependencies(value),
      });
    } else if (ts.isJsxSpreadAttribute(prop)) {
      // Handle {...field.register()}
      props.push({
        name: '__spread',
        value: prop.expression,
        isSpread: true,
        isDynamic: true,
      });
    }
  });

  return props;
};
```

### Analyzing Children

**File:** `src/parser/jsx-analyzer/prototype/analyze-children.ts`

```typescript
export const analyzeChildren = function (children: ts.NodeArray<ts.JsxChild>): any[] {
  const result: any[] = [];

  children.forEach((child) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      // Nested JSX element - recursively analyze
      result.push(this.analyze(child));
    } else if (ts.isJsxExpression(child) && child.expression) {
      // Dynamic expression: {count()}
      result.push({
        type: 'expression',
        expression: child.expression,
        isStatic: this.isStaticValue(child.expression),
        dependsOn: this.extractDependencies(child.expression),
      });
    } else if (ts.isJsxText(child)) {
      // Static text
      const text = child.text.trim();
      if (text) {
        result.push({
          type: 'text',
          content: text,
          isStatic: true,
        });
      }
    }
  });

  return result;
};
```

### Intermediate Representation (IR)

**File:** `src/ir/types/index.ts`

The IR is a simplified, framework-agnostic representation of the UI structure:

```typescript
export interface IJSXElementIR {
  type: 'element' | 'fragment' | 'component' | 'expression' | 'text';
  tag?: string; // 'div', 'button', etc.
  props: IPropIR[]; // All attributes
  children: IJSXElementIR[]; // Nested elements
  isStatic: boolean; // No reactive dependencies?
  hasDynamicChildren: boolean; // Contains {expressions}?
  events: IEventIR[]; // onClick, onInput, etc.
  key?: string; // For list reconciliation
}

export interface IPropIR {
  name: string;
  value: ts.Expression;
  isStatic: boolean;
  isDynamic: boolean;
  dependsOn: string[]; // Reactive dependencies
}
```

**Example IR:**

```typescript
// Input: <button onClick={handleClick} className="btn">Count: {count()}</button>

{
  type: 'element',
  tag: 'button',
  props: [
    { name: 'className', value: 'btn', isStatic: true, isDynamic: false }
  ],
  events: [
    { type: 'click', handler: handleClick }
  ],
  children: [
    { type: 'text', content: 'Count: ', isStatic: true },
    { type: 'expression', expression: count(), isStatic: false, dependsOn: ['count'] }
  ],
  isStatic: false,
  hasDynamicChildren: true
}
```

---

## Phase 2: Code Generation

**Location:** `packages/pulsar-transformer/src/generator/element-generator/`

The generator takes the IR and produces TypeScript AST nodes representing optimized DOM manipulation code.

### ElementGenerator Class (Prototype-based)

```typescript
export const ElementGenerator =
  function (this: IElementGeneratorInternal, context: ITransformationContext) {
    Object.defineProperty(this, 'context', { value: context });
    Object.defineProperty(this, 'varCounter', { value: 0, writable: true });
  } -
  // Prototype methods:
  generate() - // Main entry point
  generateStaticElement() - // For fully static elements
  generateDynamicElement() - // For reactive elements
  generateComponentCall() - // For <Component /> syntax
  generateEventListeners() - // addEventListener() calls
  generateChildren() - // appendChild() logic
  generateDynamicProps() - // createEffect() for reactive props
  generateFragment() - // DocumentFragment for <>...</>
  generateRefAssignment(); // ref={elementRef} handling
```

### The `generate()` Method

**File:** `src/generator/element-generator/prototype/generate.ts`

```typescript
export const generate = function (elementIR: any): ts.Expression {
  // 1. Handle fragments
  if (elementIR.type === 'fragment') {
    return this.generateFragment(elementIR);
  }

  // 2. Handle component calls
  if (elementIR.type === 'component') {
    return this.generateComponentCall(elementIR);
  }

  // 3. Determine if element needs reactivity
  const hasDynamicProps = elementIR.props.some((prop) => prop.isDynamic);
  const hasDynamicChildren = elementIR.hasDynamicChildren;
  const hasEvents = elementIR.events.length > 0;

  // 4. Choose generation strategy
  if (!hasDynamicProps && !hasDynamicChildren && !hasEvents) {
    return this.generateStaticElement(elementIR); // Fully static
  }

  return this.generateDynamicElement(elementIR); // Needs reactivity
};
```

### Static Element Generation

**File:** `src/generator/element-generator/prototype/generate-static-element.ts`

For completely static elements with no reactivity:

```typescript
export const generateStaticElement = function (elementIR: IJSXElementIR): ts.Expression {
  // Generate:
  // (() => {
  //   const el0 = document.createElement('div')
  //   el0.className = 'container'
  //   el0.textContent = 'Hello'
  //   return el0
  // })()

  const statements: ts.Statement[] = [];
  const elementVar = `el${this.varCounter++}`;

  // 1. Create element
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            elementVar,
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createElement')
              ),
              undefined,
              [factory.createStringLiteral(elementIR.tag)]
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // 2. Set static properties
  elementIR.props.forEach((prop) => {
    if (prop.isStatic) {
      statements.push(
        factory.createExpressionStatement(
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(elementVar),
              factory.createIdentifier(prop.name)
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            prop.value
          )
        )
      );
    }
  });

  // 3. Append children
  const childStatements = this.generateChildren(elementIR.children, elementVar);
  statements.push(...childStatements);

  // 4. Return element
  statements.push(factory.createReturnStatement(factory.createIdentifier(elementVar)));

  // Wrap in IIFE (Immediately Invoked Function Expression)
  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
};
```

### Dynamic Element Generation

**File:** `src/generator/element-generator/prototype/generate-dynamic-element.ts`

For elements with reactive dependencies:

```typescript
export const generateDynamicElement = function (elementIR: IJSXElementIR): ts.Expression {
  // Generate:
  // (() => {
  //   const el0 = document.createElement('div')
  //   el0.className = 'container'  // Static props first
  //
  //   createEffect(() => {         // Dynamic props wrapped
  //     el0.textContent = count()
  //   })
  //
  //   el0.addEventListener('click', handleClick)  // Events
  //   return el0
  // })()

  const statements: ts.Statement[] = [];
  const elementVar = `el${this.varCounter++}`;

  // 1. Create element
  statements.push(/* createElement */);

  // 2. Set static properties FIRST (no reactivity needed)
  elementIR.props.forEach((prop) => {
    if (prop.isStatic && prop.value) {
      statements.push(/* el.prop = value */);
    }
  });

  // 3. Generate dynamic property updates with createEffect
  const dynamicPropStatements = this.generateDynamicProps(elementVar, elementIR);
  statements.push(...dynamicPropStatements);

  // 4. Generate event listeners
  const eventStatements = this.generateEventListeners(elementVar, elementIR);
  statements.push(...eventStatements);

  // 5. Handle children
  const childStatements = this.generateChildren(elementIR.children, elementVar);
  statements.push(...childStatements);

  // 6. Return element
  statements.push(factory.createReturnStatement(factory.createIdentifier(elementVar)));

  // Wrap in IIFE
  return factory.createCallExpression(/* arrow function */);
};
```

### Component Call Generation

**File:** `src/generator/element-generator/prototype/generate-component-call.ts`

```typescript
export const generateComponentCall = function (componentIR: any): ts.Expression {
  // Transform: <Counter initialCount={0} />
  // Into:      Counter({ initialCount: 0 })

  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  // Add regular props
  componentIR.props.forEach((prop) => {
    propsProperties.push(
      factory.createPropertyAssignment(factory.createIdentifier(prop.name), prop.value)
    );
  });

  // Add children if present
  if (componentIR.children && componentIR.children.length > 0) {
    // Check if component is a Provider (needs deferred children)
    const shouldDeferChildren = componentUsesProvider(
      componentIR.component,
      this.context.typeChecker,
      this.context.sourceFile
    );

    let childrenExpression: ts.Expression;

    if (shouldDeferChildren) {
      // Wrap in arrow function: () => [child1, child2]
      childrenExpression = factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createArrayLiteralExpression(/* children */)
      );
    } else {
      // Direct array: [child1, child2]
      childrenExpression = factory.createArrayLiteralExpression(/* children */);
    }

    propsProperties.push(
      factory.createPropertyAssignment(factory.createIdentifier('children'), childrenExpression)
    );
  }

  // Generate: Component({ prop1, prop2, children })
  return factory.createCallExpression(componentIR.component, undefined, [
    factory.createObjectLiteralExpression(propsProperties, true),
  ]);
};
```

---

## Phase 3: Optimization (Optional)

**Location:** `packages/pulsar-transformer/src/optimizer/`

### Available Optimizations

1. **Constant Folding**: Replace constant expressions with literal values
2. **Dead Code Elimination**: Remove unused variables and imports
3. **Bundle Size Warnings**: Alert about large dependencies

**File:** `src/optimizer/index.ts`

```typescript
export function optimize(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  context: ts.TransformationContext,
  config?: IOptimizerConfig
): IOptimizationResult {
  let optimized = sourceFile;
  const report = {
    optimizationsApplied: 0,
    totalBytesSaved: 0,
  };

  if (config?.constantFolding) {
    const result = constantAnalyzer.analyze(optimized, typeChecker);
    optimized = result.sourceFile;
    report.optimizationsApplied += result.count;
  }

  if (config?.deadCodeElimination) {
    const result = deadCodeAnalyzer.analyze(optimized, typeChecker);
    optimized = result.sourceFile;
    report.optimizationsApplied += result.count;
  }

  return { sourceFile: optimized, report };
}
```

---

## Reactivity System

Pulsar uses **fine-grained reactivity** with `createEffect()` from the runtime.

### When to Use createEffect

**Dynamic expressions are wrapped automatically:**

```typescript
// Input TSX
<div>{count()}</div>

// Generated Code
(() => {
  const el0 = document.createElement('div')
  const textNode0 = document.createTextNode('')

  createEffect(() => {
    textNode0.textContent = String(count())
  })

  el0.appendChild(textNode0)
  return el0
})()
```

### Static vs Dynamic Detection

**File:** `src/parser/jsx-analyzer/prototype/is-static-value.ts`

```typescript
export const isStaticValue = function (expr: ts.Expression): boolean {
  // String literal: "hello"
  if (ts.isStringLiteral(expr)) return true;

  // Number literal: 42
  if (ts.isNumericLiteral(expr)) return true;

  // Boolean: true/false
  if (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword)
    return true;

  // Null/undefined
  if (expr.kind === ts.SyntaxKind.NullKeyword || expr.kind === ts.SyntaxKind.UndefinedKeyword)
    return true;

  // Object literal: { key: "value" }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.every(
      (prop) => ts.isPropertyAssignment(prop) && this.isStaticValue(prop.initializer)
    );
  }

  // Array literal: [1, 2, 3]
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.every((el) => this.isStaticValue(el));
  }

  // Everything else is dynamic
  return false;
};
```

### Fine-Grained List Updates

**Special handling for `array.map()` patterns:**

```typescript
// Input
<div>
  {items().map(item => <Item key={item.id} data={item} />)}
</div>

// Generated (keyed reconciliation)
(() => {
  const container = document.createElement('div')
  const cache = new Map()

  createEffect(() => {
    const newItems = items()
    const newKeys = new Set(newItems.map(item => item.id))

    // Remove items no longer in list
    for (const [key, element] of cache) {
      if (!newKeys.has(key)) {
        element.remove()
        cache.delete(key)
      }
    }

    // Add/update items
    newItems.forEach((item, index) => {
      const key = item.id
      let element = cache.get(key)

      if (!element) {
        element = Item({ key: item.id, data: item })
        cache.set(key, element)
      }

      // Ensure correct position
      const currentElement = container.children[index]
      if (currentElement !== element) {
        container.insertBefore(element, currentElement || null)
      }
    })
  })

  return container
})()
```

---

## Key Concepts

### 1. IIFE (Immediately Invoked Function Expression)

All generated DOM code is wrapped in IIFEs:

```typescript
// Why: Creates isolated scope for variables
(() => {
  const el0 = document.createElement('div');
  return el0;
})();
```

### 2. Variable Counter

Ensures unique variable names:

```typescript
// this.varCounter starts at 0
const el0 = document.createElement('div'); // varCounter = 0
const el1 = document.createElement('span'); // varCounter = 1
```

### 3. Transformation Context

**File:** `src/context/transformation-context.ts`

Shared state throughout transformation:

```typescript
export interface ITransformationContext {
  program: ts.Program; // TypeScript program
  typeChecker: ts.TypeChecker; // For type information
  sourceFile: ts.SourceFile; // Current file being transformed
  context: ts.TransformationContext;
  jsxVisitor?: ts.Visitor; // For nested JSX in expressions
  currentComponent: string | null; // Current component name
  imports: Set<string>; // Track added imports

  addImport(name: string, from: string): void;
  isStateAccess(node: ts.Node): boolean;
}
```

### 4. TypeScript Factory API

All code generation uses `ts.factory.*`:

```typescript
// Create: const x = 42
ts.factory.createVariableStatement(
  undefined,
  ts.factory.createVariableDeclarationList(
    [
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier('x'),
        undefined,
        undefined,
        ts.factory.createNumericLiteral(42)
      ),
    ],
    ts.NodeFlags.Const
  )
);
```

---

## Component vs Element Handling

### Element (lowercase)

```tsx
<div className="container">Content</div>
```

**Generated:**

```javascript
document.createElement('div');
```

### Component (uppercase)

```tsx
<Counter initialCount={0} />
```

**Generated:**

```javascript
Counter({ initialCount: 0 });
```

### Detection Logic

```typescript
function isComponentTag(tagName: string): boolean {
  return tagName.length > 0 && tagName[0] === tagName[0].toUpperCase();
}
```

---

## Complete Transformation Examples

### Example 1: Static Button

**Input:**

```tsx
<button className="btn-primary" type="button">
  Click Me
</button>
```

**IR:**

```json
{
  "type": "element",
  "tag": "button",
  "props": [
    { "name": "className", "value": "btn-primary", "isStatic": true },
    { "name": "type", "value": "button", "isStatic": true }
  ],
  "children": [{ "type": "text", "content": "Click Me", "isStatic": true }],
  "isStatic": true,
  "hasDynamicChildren": false,
  "events": []
}
```

**Output:**

```javascript
(() => {
  const el0 = document.createElement('button');
  el0.className = 'btn-primary';
  el0.type = 'button';
  el0.appendChild(document.createTextNode('Click Me'));
  return el0;
})();
```

### Example 2: Counter with Reactivity

**Input:**

```tsx
function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div className="counter">
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}
```

**Output:**

```javascript
import { createEffect, createSignal } from 'pulsar/hooks';

function Counter() {
  const [count, setCount] = createSignal(0);

  return (() => {
    const el0 = document.createElement('div');
    el0.className = 'counter';

    // First child: <p>
    const el1 = (() => {
      const el2 = document.createElement('p');

      // Static text
      el2.appendChild(document.createTextNode('Count: '));

      // Dynamic text
      const textNode0 = document.createTextNode('');
      createEffect(() => {
        textNode0.textContent = String(count());
      });
      el2.appendChild(textNode0);

      return el2;
    })();
    el0.appendChild(el1);

    // Second child: <button>
    const el3 = (() => {
      const el4 = document.createElement('button');
      el4.addEventListener('click', () => setCount(count() + 1));
      el4.appendChild(document.createTextNode('Increment'));
      return el4;
    })();
    el0.appendChild(el3);

    return el0;
  })();
}
```

### Example 3: Component with Props

**Input:**

```tsx
<UserCard user={currentUser} onEdit={handleEdit} isActive={true} />
```

**Output:**

```javascript
UserCard({
  user: currentUser,
  onEdit: handleEdit,
  isActive: true,
});
```

### Example 4: List with Keys

**Input:**

```tsx
<ul>
  {users().map((user) => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>
```

**Output (simplified):**

```javascript
(() => {
  const el0 = document.createElement('ul');
  const cache = new Map();

  createEffect(() => {
    const items = users();

    // Keyed reconciliation logic
    items.forEach((user, index) => {
      let li = cache.get(user.id);
      if (!li) {
        li = document.createElement('li');
        li.textContent = user.name;
        cache.set(user.id, li);
      }

      // Update position if needed
      const current = el0.children[index];
      if (current !== li) {
        el0.insertBefore(li, current || null);
      }
    });

    // Remove deleted items
    for (const [id, element] of cache) {
      if (!items.some((u) => u.id === id)) {
        element.remove();
        cache.delete(id);
      }
    }
  });

  return el0;
})();
```

---

## Integration with Build Tools

### Vite Plugin

**File:** `packages/pulsar-vite-plugin/vite-plugin-temp/src/index.ts`

```typescript
function pulsarPlugin(): Plugin {
  return {
    name: 'pulsar-vite-plugin',
    enforce: 'pre', // Run before other plugins

    async transform(code: string, id: string) {
      // Only process .tsx files
      if (!id.endsWith('.tsx')) return null;

      // Import transformer
      const transformerModule = await import('@pulsar-framework/transformer');
      const transformer = transformerModule.default;

      // Create TypeScript source file
      const sourceFile = ts.createSourceFile(
        id,
        code,
        ts.ScriptTarget.ESNext,
        true,
        ts.ScriptKind.TSX
      );

      // Create minimal program
      const program = ts.createProgram([id], compilerOptions, host);

      // Get transformer factory
      const transformerFactory = transformer(program);

      // Transform
      const result = ts.transform(sourceFile, [transformerFactory]);
      const transformedFile = result.transformed[0];

      // Print output
      const printer = ts.createPrinter();
      const outputCode = printer.printFile(transformedFile);

      return { code: outputCode, map: null };
    },
  };
}
```

### TypeScript Plugin (ttypescript)

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@pulsar/transformer",
        "optimize": true,
        "optimizerConfig": {
          "constantFolding": true,
          "deadCodeElimination": true,
          "bundleWarnings": true
        }
      }
    ]
  }
}
```

---

## Summary

### The Complete Flow

1. **Developer writes TSX:**

   ```tsx
   <button onClick={handleClick}>Count: {count()}</button>
   ```

2. **TypeScript parser creates AST:**
   - JsxElement node with opening/closing tags
   - JsxAttribute nodes for props
   - JsxExpression for {count()}

3. **Pulsar's visitor finds JSX:**
   - Traverses AST recursively
   - Identifies JSX nodes

4. **JSXAnalyzer creates IR:**
   - Extracts tag, props, children
   - Determines static vs dynamic
   - Identifies events and dependencies

5. **ElementGenerator creates AST:**
   - Generates createElement() calls
   - Wraps dynamic expressions in createEffect()
   - Adds event listeners
   - Handles children recursively

6. **TypeScript printer outputs code:**

   ```javascript
   (() => {
     const el0 = document.createElement('button');
     el0.addEventListener('click', handleClick);
     el0.appendChild(document.createTextNode('Count: '));
     const textNode0 = document.createTextNode('');
     createEffect(() => {
       textNode0.textContent = String(count());
     });
     el0.appendChild(textNode0);
     return el0;
   })();
   ```

7. **Runtime executes:**
   - Creates actual DOM elements
   - Sets up reactive effects
   - Returns DOM node to parent

### Key Takeaways

- ✅ **Zero runtime overhead** - all JSX transformation happens at compile-time
- ✅ **Fine-grained reactivity** - only dynamic parts are wrapped in createEffect
- ✅ **Direct DOM manipulation** - no virtual DOM diffing
- ✅ **Type-safe** - full TypeScript compiler integration
- ✅ **Optimized output** - optional optimization passes reduce bundle size
- ✅ **Keyed reconciliation** - efficient list updates with minimal DOM operations

---

## Next Steps

Now that you understand the internals, you can:

1. **Extend the transformer** - add new JSX patterns or optimizations
2. **Debug transformations** - understand what's happening under the hood
3. **Optimize generated code** - tweak the generator for specific use cases
4. **Integrate with tools** - create custom build plugins
5. **Contribute** - improve the transformer's performance or features

---

**Ready to dive deeper?** Check out:

- [TSX Syntax Guide](./tsx-syntax.md)
- [Reactivity System](./reactivity.md)
- [Component Patterns](./component-architecture.md)
- [Test Suite](../../packages/pulsar-transformer/src/__tests__/)
