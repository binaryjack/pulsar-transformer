# Phase 3-5: Transformer & Emitter Implementation Plan

**Date:** 2026-02-10 23:48  
**Goal:** Transform AST → TypeScript code for counter.psr  
**Status:** In Progress

---

## Objective

Transform PSR AST → TypeScript code with:

- `component Counter()` → `function Counter()` wrapped in `$REGISTRY.execute()`
- JSX → `t_element()` calls
- Auto-import runtime functions
- Preserve signal calls

---

## Simplified Approach

**Skip separate phases, combine into Code Generator:**

- Input: PSR AST from Parser
- Output: TypeScript code string
- Direct AST traversal → code emission

---

## Transformations Required

### 1. Component Declaration

```psr
component Counter({id}: ICounterProps) { ... }
```

↓

```typescript
function Counter({id}: ICounterProps): HTMLElement {
  return $REGISTRY.execute('component:Counter', () => {
    ... body ...
  });
}
```

### 2. JSX Elements

```psr
<div>
  <h2>Counter: {count()}</h2>
  <button onClick={increment}>Increment</button>
</div>
```

↓

```typescript
t_element('div', {}, [
  t_element('h2', {}, ['Counter: ', count()]),
  t_element('button', { onClick: increment }, ['Increment']),
]);
```

### 3. Auto-Imports

```typescript
import { createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev';
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
```

---

## Implementation

**Single CodeGenerator class:**

```
src/code-generator/
  code-generator.ts         ← Constructor
  code-generator.types.ts   ← Options interface
  prototypes/
    generate.ts             ← Main entry
    generate-program.ts     ← Program
    generate-import.ts      ← Import statements
    generate-component.ts   ← Component transformation
    generate-statement.ts   ← Statements
    generate-expression.ts  ← Expressions
    generate-jsx.ts         ← JSX → t_element()
    collect-imports.ts      ← Track needed imports
```

---

## Time Estimate

- Code generator core: 30min
- Component transformation: 30min
- JSX transformation: 45min
- Expression generation: 30min
- Import management: 20min
- Testing: 30min

**Total: ~3 hours**

---

## Next Action

Create CodeGenerator class with JSX transformation.
