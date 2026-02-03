# Pulsar Transformer Architecture

**Visual Guide to the Transformation Pipeline**

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PULSAR TRANSFORMER                           │
│                    (TypeScript Compiler Plugin)                      │
└─────────────────────────────────────────────────────────────────────┘

INPUT: TSX Source Code
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TypeScript Compiler (tsc)                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Lexer → Parser → AST (Abstract Syntax Tree)                │    │
│  │                                                              │    │
│  │  <button onClick={handler}>                                 │    │
│  │    ↓                                                         │    │
│  │  JsxElement {                                                │    │
│  │    openingElement: JsxOpeningElement                        │    │
│  │    children: [JsxText]                                       │    │
│  │    closingElement: JsxClosingElement                        │    │
│  │  }                                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PULSAR TRANSFORMER VISITOR                         │
│                                                                      │
│  function transformVisitor(node: ts.Node) {                         │
│    if (isJSX(node)) {                                               │
│      return transform(node) // ← Transform JSX immediately          │
│    }                                                                 │
│    return visitChildren(node) // Continue traversal                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PHASE 1: JSX ANALYZER                            │
│                  (JSX → Intermediate Representation)                 │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ JSXAnalyzer  │                                                   │
│  ├──────────────┤                                                   │
│  │ • analyze()           ────►  Creates IR                          │
│  │ • analyzeProps()      ────►  Extracts attributes                 │
│  │ • analyzeChildren()   ────►  Processes nested JSX                │
│  │ • extractEvents()     ────►  Finds onClick, etc.                 │
│  │ • extractDependencies()──►  Tracks reactive deps                 │
│  │ • isStaticElement()   ────►  Static vs Dynamic                   │
│  └──────────────┘                                                   │
│                                                                      │
│  INPUT:  <button onClick={handler}>Count: {count()}</button>        │
│                                                                      │
│  OUTPUT: {                                                           │
│    type: 'element',                                                  │
│    tag: 'button',                                                    │
│    props: [],                                                        │
│    events: [{ type: 'click', handler }],                            │
│    children: [                                                       │
│      { type: 'text', content: 'Count: ' },                          │
│      { type: 'expression', expr: count(), isStatic: false }         │
│    ],                                                                │
│    isStatic: false,                                                  │
│    hasDynamicChildren: true                                          │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: CODE GENERATOR                            │
│              (Intermediate Representation → TypeScript AST)          │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │ ElementGenerator │                                               │
│  ├──────────────────┤                                               │
│  │ • generate()                ────► Main dispatcher                │
│  │ • generateStaticElement()   ────► For static elements            │
│  │ • generateDynamicElement()  ────► For reactive elements          │
│  │ • generateComponentCall()   ────► For <Component />              │
│  │ • generateEventListeners()  ────► addEventListener()             │
│  │ • generateChildren()        ────► appendChild() logic            │
│  │ • generateDynamicProps()    ────► createEffect() wrapping        │
│  └──────────────────┘                                               │
│                                                                      │
│  STRATEGY DECISION TREE:                                             │
│                                                                      │
│         Is it a Fragment?                                            │
│              │                                                       │
│         ┌────┴────┐                                                 │
│        YES       NO                                                  │
│         │         │                                                  │
│    generateFragment()                                                │
│                   │                                                  │
│              Is Component?                                           │
│              (uppercase)                                             │
│              │                                                       │
│         ┌────┴────┐                                                 │
│        YES       NO                                                  │
│         │         │                                                  │
│   generateComponentCall()                                            │
│                   │                                                  │
│         Has dynamic aspects?                                         │
│    (props/children/events)                                           │
│              │                                                       │
│         ┌────┴────┐                                                 │
│        YES       NO                                                  │
│         │         │                                                  │
│  generateDynamicElement()  generateStaticElement()                   │
│                                                                      │
│  OUTPUT: TypeScript AST nodes representing:                          │
│    (() => {                                                          │
│      const el0 = document.createElement('button')                    │
│      el0.addEventListener('click', handler)                          │
│      el0.appendChild(document.createTextNode('Count: '))             │
│      const textNode0 = document.createTextNode('')                   │
│      createEffect(() => {                                            │
│        textNode0.textContent = String(count())                       │
│      })                                                              │
│      el0.appendChild(textNode0)                                      │
│      return el0                                                      │
│    })()                                                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│               PHASE 3: OPTIMIZER (Optional)                          │
│                                                                      │
│  ┌───────────────────┐   ┌──────────────────┐                      │
│  │ Constant Folding  │   │ Dead Code Elim   │                      │
│  ├───────────────────┤   ├──────────────────┤                      │
│  │ const API = "..." │   │ Remove unused    │                      │
│  │ fetch(API)        │   │ • variables      │                      │
│  │      ↓            │   │ • imports        │                      │
│  │ fetch("...")      │   │ • functions      │                      │
│  └───────────────────┘   └──────────────────┘                      │
│                                                                      │
│  ┌────────────────────────────────────────┐                         │
│  │ Bundle Size Warnings                   │                         │
│  ├────────────────────────────────────────┤                         │
│  │ ⚠️  Import 'lodash' is large (~70KB)    │                         │
│  │ 💡 Use lodash-es for tree-shaking       │                         │
│  └────────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ADD RUNTIME IMPORTS                                │
│                                                                      │
│  Automatically inject at top of file:                                │
│                                                                      │
│  import {                                                            │
│    createEffect,                                                     │
│    createMemo,                                                       │
│    createSignal                                                      │
│  } from 'pulsar/hooks'                                               │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   TypeScript Printer                                 │
│              (AST → JavaScript Source Code)                          │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
OUTPUT: Optimized JavaScript
```

---

## Data Flow Through Components

```
┌────────────────────────────────────────────────────────────────────┐
│                    TRANSFORMATION CONTEXT                           │
│                 (Shared State Across Pipeline)                      │
├────────────────────────────────────────────────────────────────────┤
│  • program: ts.Program                                              │
│  • typeChecker: ts.TypeChecker                                      │
│  • sourceFile: ts.SourceFile                                        │
│  • currentComponent: string | null                                  │
│  • imports: Set<string>                                             │
│  • jsxVisitor: ts.Visitor (for nested JSX)                          │
│  • varCounter: number (for unique var names)                        │
└────────────────────────────────────────────────────────────────────┘
           ↑                    ↑                    ↑
           │                    │                    │
     ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
     │           │       │           │       │           │
┌────┴─────┐ ┌──┴──────┐ ┌──────────┴──┐ ┌──┴──────────┐
│ JSX      │ │ Element │ │  Optimizer  │ │   Import    │
│ Analyzer │ │Generator│ │             │ │   Manager   │
└──────────┘ └─────────┘ └─────────────┘ └─────────────┘
```

---

## Class Structure (Prototype-based)

```
┌──────────────────────────────────────────────────────────┐
│                    JSXAnalyzer                            │
├──────────────────────────────────────────────────────────┤
│ Constructor:                                              │
│   new JSXAnalyzer(context: ITransformationContext)       │
│                                                           │
│ Properties:                                               │
│   • context: ITransformationContext (readonly)           │
│                                                           │
│ Prototype Methods:                                        │
│   • analyze(node: ts.Node): IR                           │
│       ├─► analyzeProps(attrs: JsxAttributes): IPropIR[]  │
│       ├─► analyzeChildren(children: JsxChild[]): IR[]    │
│       ├─► extractEvents(attrs): IEventIR[]               │
│       ├─► extractDependencies(expr): string[]            │
│       ├─► isStaticElement(node): boolean                 │
│       └─► isStaticValue(expr): boolean                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  ElementGenerator                         │
├──────────────────────────────────────────────────────────┤
│ Constructor:                                              │
│   new ElementGenerator(context: ITransformationContext)  │
│                                                           │
│ Properties:                                               │
│   • context: ITransformationContext (readonly)           │
│   • varCounter: number (mutable, for unique names)       │
│                                                           │
│ Prototype Methods:                                        │
│   • generate(ir: IR): ts.Expression                      │
│       ├─► generateStaticElement(ir): ts.Expression       │
│       ├─► generateDynamicElement(ir): ts.Expression      │
│       ├─► generateComponentCall(ir): ts.Expression       │
│       ├─► generateEventListeners(var, ir): Statement[]   │
│       ├─► generateChildren(children, parent): Statement[]│
│       ├─► generateDynamicProps(var, ir): Statement[]     │
│       ├─► generateFragment(ir): ts.Expression            │
│       └─► generateRefAssignment(var, ref): Statement     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              TransformationContext                        │
├──────────────────────────────────────────────────────────┤
│ Constructor:                                              │
│   new TransformationContext(                             │
│     program: ts.Program,                                 │
│     sourceFile: ts.SourceFile,                           │
│     context: ts.TransformationContext                    │
│   )                                                       │
│                                                           │
│ Properties:                                               │
│   • program: ts.Program (readonly)                       │
│   • typeChecker: ts.TypeChecker (readonly)               │
│   • sourceFile: ts.SourceFile (readonly)                 │
│   • context: ts.TransformationContext (readonly)         │
│   • jsxVisitor: ts.Visitor (mutable)                     │
│   • currentComponent: string | null (mutable)            │
│   • imports: Set<string> (readonly set, mutable contents)│
│   • typeAnalyzer: TypeAnalyzer                           │
│   • propValidator: PropValidator                         │
│   • diValidator: DIValidator                             │
│                                                           │
│ Prototype Methods:                                        │
│   • addImport(name: string, module: string): void        │
│   • isStateAccess(node: ts.Node): boolean                │
│   • getDependencies(expr: ts.Expression): string[]       │
└──────────────────────────────────────────────────────────┘
```

---

## Reactivity Detection Flow

```
Expression Analysis
        │
        ▼
┌────────────────┐
│  isStatic?     │
└────────┬───────┘
         │
    ┌────┴────┐
   YES       NO
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ Direct  │ │ Wrap in      │
│ assign  │ │ createEffect │
└─────────┘ └──────────────┘

STATIC EXPRESSIONS:
• String literals: "hello"
• Number literals: 42
• Boolean: true/false
• Null/undefined
• Static objects: { x: 1 }
• Static arrays: [1, 2, 3]

DYNAMIC EXPRESSIONS:
• Function calls: count()
• Property access: obj.prop
• Binary expressions: a + b
• Conditional: a ? b : c
• Array methods: arr.map()
• Anything with identifiers
```

---

## Event Handler Processing

```
JSX Attribute Analysis
        │
        ▼
  ┌─────────────┐
  │ Event prop? │
  │ (on*)       │
  └──────┬──────┘
         │
    ┌────┴────┐
   YES       NO
    │         │
    ▼         ▼
┌─────────────────┐  ┌──────────────┐
│ Extract handler │  │ Regular prop │
│ Remove 'on'     │  └──────────────┘
│ toLowerCase     │
└────────┬────────┘
         │
         ▼
   ┌──────────────┐
   │ onClick      │
   │   ↓          │
   │ 'click'      │
   └──────┬───────┘
          │
          ▼
   ┌────────────────────────────────┐
   │ el.addEventListener('click',   │
   │   handler, options)            │
   └────────────────────────────────┘

EVENT MODIFIERS (planned):
• onClick$capture → { capture: true }
• onClick$once    → { once: true }
• onClick$passive → { passive: true }
```

---

## Children Generation Strategy

```
Child Analysis
      │
      ▼
┌───────────┐
│ Child Type│
└─────┬─────┘
      │
  ┌───┴────────────┬──────────────┐
  │                │              │
  ▼                ▼              ▼
┌──────┐      ┌─────────┐    ┌──────────┐
│ Text │      │ Element │    │Expression│
└──┬───┘      └────┬────┘    └────┬─────┘
   │               │              │
   ▼               ▼              ▼
createTextNode()  Recurse     isStatic?
                 analyze()        │
                    │         ┌───┴───┐
                    │        YES     NO
                    ▼         │       │
              appendChild()   │       ▼
                              │   Array.map?
                              │       │
                              │   ┌───┴───┐
                              │  YES     NO
                              │   │       │
                              │   ▼       ▼
                              │  Keyed   Regular
                              │  Recon.  Effect
                              │   │       │
                              └───┴───────┴──►
                                      │
                                      ▼
                               appendChild()
```

---

## Keyed Reconciliation for Lists

```
Detect Pattern:
  items().map(item => <Element key={item.id} />)
       │
       ▼
┌─────────────────────────────────────┐
│ KEYED RECONCILIATION ALGORITHM      │
├─────────────────────────────────────┤
│                                     │
│ 1. Create cache: Map<key, element> │
│                                     │
│ 2. createEffect(() => {             │
│      const newItems = items()       │
│                                     │
│      // Remove deleted              │
│      for (key in cache) {           │
│        if (!inNewItems(key)) {      │
│          element.remove()           │
│          cache.delete(key)          │
│        }                             │
│      }                               │
│                                     │
│      // Add/update/reorder          │
│      newItems.forEach((item, i) => {│
│        let el = cache.get(key)      │
│        if (!el) {                   │
│          el = createElement()       │
│          cache.set(key, el)         │
│        }                             │
│                                     │
│        // Ensure correct position   │
│        if (parent.children[i]!==el) │
│          parent.insertBefore(...)   │
│      })                              │
│    })                                │
│                                     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ BENEFITS:                           │
│ • Minimal DOM operations            │
│ • Preserve element state            │
│ • Maintain event listeners          │
│ • Handle reordering efficiently     │
└─────────────────────────────────────┘
```

---

## TypeScript Factory API Usage

```
Creating AST Nodes with ts.factory:

┌─────────────────────────────────────────────────────┐
│ COMMON PATTERNS                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Variable Declaration:                               │
│   const x = value                                   │
│                                                     │
│   ts.factory.createVariableStatement(               │
│     undefined,                                      │
│     ts.factory.createVariableDeclarationList([      │
│       ts.factory.createVariableDeclaration(         │
│         ts.factory.createIdentifier('x'),           │
│         undefined, undefined,                       │
│         valueExpression                             │
│       )                                             │
│     ], ts.NodeFlags.Const)                          │
│   )                                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Function Call:                                      │
│   fn(arg1, arg2)                                    │
│                                                     │
│   ts.factory.createCallExpression(                  │
│     ts.factory.createIdentifier('fn'),              │
│     undefined,                                      │
│     [arg1Expression, arg2Expression]                │
│   )                                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Property Access:                                    │
│   obj.prop                                          │
│                                                     │
│   ts.factory.createPropertyAccessExpression(        │
│     ts.factory.createIdentifier('obj'),             │
│     ts.factory.createIdentifier('prop')             │
│   )                                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Arrow Function:                                     │
│   () => { statements }                              │
│                                                     │
│   ts.factory.createArrowFunction(                   │
│     undefined, undefined, [],                       │
│     undefined,                                      │
│     ts.factory.createToken(                         │
│       ts.SyntaxKind.EqualsGreaterThanToken          │
│     ),                                              │
│     ts.factory.createBlock(statements, true)        │
│   )                                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ IIFE:                                               │
│   (() => { ... })()                                 │
│                                                     │
│   ts.factory.createCallExpression(                  │
│     ts.factory.createParenthesizedExpression(       │
│       arrowFunction                                 │
│     ),                                              │
│     undefined,                                      │
│     []                                              │
│   )                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Performance Characteristics

```
┌────────────────────────────────────────────────────────┐
│             COMPILE TIME vs RUNTIME                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  COMPILE TIME (Transformer):                            │
│    • Parse TSX                         ~5-10ms/file    │
│    • Analyze IR                        ~2-5ms/file     │
│    • Generate code                     ~5-10ms/file    │
│    • Optimize (optional)               ~2-8ms/file     │
│    ─────────────────────────────────────────────────   │
│    TOTAL:                              ~15-35ms/file   │
│                                                         │
│  RUNTIME (Browser):                                     │
│    • No JSX parsing                    0ms ✅          │
│    • No virtual DOM diffing            0ms ✅          │
│    • Direct DOM operations             Native speed   │
│    • Fine-grained reactivity           Optimal ✅      │
│                                                         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│               BUNDLE SIZE IMPACT                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│  JSX Syntax:           +0 bytes (removed at compile)   │
│  Runtime Imports:      ~2-3KB (createEffect, etc.)     │
│  Generated Code:       Similar to hand-written         │
│  No Virtual DOM lib:   -50KB+ (vs React) ✅            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Debugging Tips

### Enable Verbose Output

```typescript
// In transformer config
{
  optimize: true,
  optimizerConfig: {
    verbose: true  // Logs transformation details
  }
}
```

### Inspect IR

```typescript
// In JSXAnalyzer
export const analyze = function (node: ts.Node): any {
  const ir = {
    /* ... */
  };
  console.log('IR:', JSON.stringify(ir, null, 2)); // Debug
  return ir;
};
```

### Check Generated AST

```typescript
// After generation
const code = generator.generate(ir);
const printer = ts.createPrinter();
console.log('Generated:', printer.printNode(ts.EmitHint.Expression, code, sourceFile));
```

---

## Common Patterns

### Pattern 1: Conditional Rendering

```tsx
// Input
<Show when={isVisible}>
  <Content />
</Show>;

// Generated
Show({
  when: isVisible,
  children: () => [Content()], // Deferred
});
```

### Pattern 2: Event Handling

```tsx
// Input
<button onClick={handler} onMouseEnter={onHover}>

// Generated
(() => {
  const el = document.createElement('button')
  el.addEventListener('click', handler)
  el.addEventListener('mouseenter', onHover)
  return el
})()
```

### Pattern 3: Dynamic Attributes

```tsx
// Input
<div className={active ? 'active' : ''}>

// Generated
(() => {
  const el = document.createElement('div')
  createEffect(() => {
    el.className = active ? 'active' : ''
  })
  return el
})()
```

### Pattern 4: Refs

```tsx
// Input
<input ref={inputRef} />;

// Generated
(() => {
  const el = document.createElement('input');
  if (typeof inputRef === 'function') {
    inputRef(el);
  } else {
    inputRef.current = el;
  }
  return el;
})();
```

---

## Future Enhancements

1. **Server-Side Rendering (SSR)**
   - Generate HTML strings at compile-time
   - Hydration markers

2. **Advanced Optimizations**
   - Static hoisting (move static elements outside functions)
   - Inline small components
   - Memoization hints

3. **Developer Experience**
   - Source maps for better debugging
   - Better error messages with suggestions
   - IDE integration for real-time feedback

4. **Type System Integration**
   - Infer prop types from components
   - Validate prop usage at compile-time
   - Generate TypeScript definitions

---

**See Also:**

- [Transformer Internals Deep Dive](./TRANSFORMER_INTERNALS.md)
- [TSX Syntax Guide](./tsx-syntax.md)
- [Component Patterns](./component-architecture.md)
