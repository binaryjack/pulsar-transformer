# PSR Transformer Scope Definition

**Created:** 2026-02-11  
**Purpose:** Clarify the boundary between transformer and runtime responsibilities

---

## 🎯 Core Principle

**The PSR Transformer is a SYNTAX TRANSFORMER, NOT a FEATURE IMPLEMENTER.**

It transforms PSR syntax → JavaScript. The runtime (`@pulsar-framework/pulsar.dev`) provides reactive primitives and behaviors.

---

## ✅ What PSR Transformer DOES

### 1. Parse PSR-Specific Syntax

**`component` Keyword:**

```psr
component Counter() {
  const [count, setCount] = createSignal(0);
  return <button>{count()}</button>;
}
```

**Transforms to:**

```js
export function Counter() {
  return $REGISTRY.execute('component:Counter', () => {
    const [count, setCount] = createSignal(0);
    return t_element('button', null, [count()]);
  });
}
```

### 2. Transform JSX to Runtime Calls

**Input:**

```psr
<div className="container">
  <button onClick={handleClick}>Submit</button>
</div>
```

**Output:**

```js
t_element('div', { className: 'container' }, [
  t_element('button', { onClick: handleClick }, ['Submit']),
]);
```

### 3. Handle Template Literals

**Input:**

```psr
const message = `Hello ${name}!`;
const className = `btn-${isActive ? 'active' : 'inactive'}`;
```

**Output:**

```js
const message = 'Hello ' + name + '!';
const className = 'btn-' + (isActive ? 'active' : 'inactive');
```

### 4. Auto-Import Used Primitives

**Input:**

```psr
const [count, setCount] = createSignal(0);
const double = createMemo(() => count() * 2);
```

**Output (auto-generated import):**

```js
import { createSignal, createMemo } from '@pulsar-framework/pulsar.dev';

const [count, setCount] = createSignal(0);
const double = createMemo(() => count() * 2);
```

### 5. Preserve TypeScript Types

**Input:**

```psr
component GenericList<T extends Item>(props: { items: T[] }) {
  return <div>{props.items.length}</div>;
}
```

**Output:** Preserve generics, transform syntax correctly.

### 6. Parse Directives

```psr
'use client';
'use server';
```

Transform: Detect directives, annotate output for bundler/framework.

---

## ❌ What PSR Transformer DOES NOT DO

### 1. Does NOT Implement Runtime Functions

**These are runtime features from `@pulsar-framework/pulsar.dev`:**

- ❌ `createSignal()` - Runtime function (already exists)
- ❌ `createMemo()` - Runtime function (already exists)
- ❌ `createEffect()` - Runtime function (already exists)
- ❌ `createResource()` - Runtime function (already exists)
- ❌ `lazy()` - Runtime function (already exists)
- ❌ `createContext()` - Runtime function (already exists)
- ❌ `useContext()` - Runtime function (already exists)
- ❌ `batch()`, `untrack()`, `defer()` - Runtime functions (already exist)

**Transformer's role:** Parse as normal function calls, auto-import if used. That's it.

### 2. Does NOT Implement Runtime Components

**These are JSX components from `@pulsar-framework/pulsar.dev`:**

- ❌ `<Show when={condition}>` - Runtime component (already exists)
- ❌ `<For each={items}>` - Runtime component (already exists)
- ❌ `<Portal mount="#root">` - Runtime component (already exists)
- ❌ `<Dynamic component={X}>` - Runtime component (already exists)
- ❌ `<Suspense>` / `<Waiting>` - Runtime components (already exist)
- ❌ `<Tryer>` / `<Catcher>` - Runtime components (already exist)

**Transformer's role:** Parse as normal JSX, transform to `t_element('Show', ...)`, auto-import if used. No special handling needed.

### 3. Does NOT Implement Runtime Behaviors

**These are runtime behaviors handled by the reactive system:**

- ❌ Dependency tracking - Runtime behavior
- ❌ Reactive updates - Runtime behavior
- ❌ Resource loading states (`.loading`, `.error`, `.state`) - Runtime properties
- ❌ Resource refetching (`refetch()`, `mutate()`) - Runtime methods
- ❌ Error boundary propagation - Runtime behavior
- ❌ Portal mounting/unmounting - Runtime behavior
- ❌ Context propagation - Runtime behavior
- ❌ Lazy loading/code splitting - Runtime + bundler features

**Transformer's role:** None. These are handled at runtime after transformation is complete.

### 4. Does NOT Handle Bundler Features

**These are Vite/bundler responsibilities:**

- ❌ Code splitting - Bundler feature (Vite handles this)
- ❌ Dynamic imports - Native JavaScript + bundler
- ❌ Preloading strategies - Bundler feature
- ❌ Tree shaking - Bundler feature

**Transformer's role:** Emit valid JavaScript/TypeScript. Bundler handles the rest.

---

## 🔍 Examples: Transformer vs Runtime

### Example 1: createResource()

**Input PSR:**

```psr
component UserProfile() {
  const [user] = createResource(fetchUser);

  return (
    <Show when={!user.loading}>
      <div>{user().name}</div>
    </Show>
  );
}
```

**What Transformer Does:**

1. Parse `component UserProfile()` → transform to `function UserProfile()`
2. Parse `createResource(fetchUser)` → leave as-is (normal function call)
3. Parse `<Show when={...}>` → transform to `t_element('Show', { when: ... }, [...])`
4. Parse `<div>` → transform to `t_element('div', null, [user().name])`
5. Auto-import: `createResource`, `Show` from runtime

**What Transformer Does NOT Do:**

- ❌ Implement `createResource()` logic (fetching, loading states, etc.)
- ❌ Implement `<Show>` component logic (conditional rendering)
- ❌ Implement reactivity tracking for `user.loading` or `user()`

**Runtime Handles:**

- ✅ `createResource()` fetches data, tracks loading/error states
- ✅ `<Show>` conditionally renders children based on `when` prop
- ✅ Reactivity system tracks `user()` reads and updates DOM

### Example 2: Portal

**Input PSR:**

```psr
component Modal() {
  return (
    <Portal mount={document.body}>
      <div className="modal">Content</div>
    </Portal>
  );
}
```

**What Transformer Does:**

1. Parse `component Modal()` → transform to function
2. Parse `<Portal mount={...}>` → transform to `t_element('Portal', { mount: document.body }, [...])`
3. Parse nested `<div>` → transform to `t_element('div', { className: 'modal' }, ['Content'])`
4. Auto-import: `Portal` from runtime

**What Transformer Does NOT Do:**

- ❌ Implement portal mounting logic
- ❌ Implement portal cleanup
- ❌ Handle DOM manipulation

**Runtime Handles:**

- ✅ `Portal` component mounts children to target element
- ✅ Portal cleanup on unmount
- ✅ Context preservation across portal boundary

### Example 3: Error Boundaries

**Input PSR:**

```psr
<Tryer fallback={<ErrorDisplay />}>
  <RiskyComponent />
</Tryer>
```

**What Transformer Does:**

1. Parse `<Tryer>` → transform to `t_element('Tryer', { fallback: ... }, [...])`
2. Auto-import: `Tryer` from runtime

**What Transformer Does NOT Do:**

- ❌ Implement error catching logic
- ❌ Implement error propagation
- ❌ Implement fallback rendering

**Runtime Handles:**

- ✅ `Tryer` component catches errors from children
- ✅ Error boundary propagation
- ✅ Fallback UI rendering

---

## 📋 Decision Matrix

When evaluating a new feature:

| Question                                       | Transformer Feature | Runtime Feature |
| ---------------------------------------------- | ------------------- | --------------- |
| Does it introduce new PSR syntax?              | ✅ YES              | ❌ NO           |
| Does it transform existing syntax differently? | ✅ YES              | ❌ NO           |
| Is it a JavaScript function/component?         | ❌ NO               | ✅ YES          |
| Does it involve runtime behavior?              | ❌ NO               | ✅ YES          |
| Does it require reactive tracking?             | ❌ NO               | ✅ YES          |
| Does it manipulate DOM directly?               | ❌ NO               | ✅ YES          |

**Rule:** If it's not new PSR syntax or a transformation rule change, it's a runtime feature.

---

## 🚫 Common Misconceptions

### ❌ WRONG: "Implement createResource() transformation"

**Why wrong:** `createResource()` is already implemented in the runtime. There's no special syntax to transform.

**✅ Correct:** "Ensure createResource() calls are parsed correctly and auto-imported."

### ❌ WRONG: "Implement Portal transformation"

**Why wrong:** `<Portal>` is a runtime component. It's just JSX.

**✅ Correct:** "Transform `<Portal>` JSX to `t_element('Portal', ...)` calls (like any other JSX)."

### ❌ WRONG: "Implement resource loading states"

**Why wrong:** Loading states (`.loading`, `.error`, `.state`) are runtime properties of the resource object.

**✅ Correct:** "No transformation needed. Runtime provides these properties."

### ❌ WRONG: "Implement lazy loading transformation"

**Why wrong:** `lazy()` is a runtime function. Dynamic `import()` is native JavaScript. Code splitting is a bundler feature.

**✅ Correct:** "Parse `lazy(() => import('./Component'))` as normal function call. Auto-import `lazy` if used."

---

## ✅ Valid Transformation Needs

These ARE transformer concerns:

1. **Template Literals** - Transform `${expr}` to concatenation
2. **Complex JSX Expressions** - Parse ternary, logical operators in JSX
3. **Generic Type Arguments** - Preserve TypeScript generics during transformation
4. **Type Inference** - Infer types from PSR syntax
5. **Static vs Dynamic JSX** - Detect static JSX at compile-time for optimization
6. **Client/Server Detection** - Parse `'use client'` / `'use server'` directives
7. **SSR Output** - Emit SSR-compatible JavaScript
8. **Hydration Markers** - Insert markers during JSX transformation for SSR hydration

---

## 🎯 Summary

**Transformer = Syntax Parser + Code Emitter**

- Transforms PSR syntax → JavaScript
- Handles JSX → runtime calls
- Auto-imports used primitives
- That's it

**Runtime = Reactive System + Component Library**

- Provides `createSignal()`, `createResource()`, etc.
- Provides `<Show>`, `<Portal>`, `<Tryer>`, etc.
- Handles reactive updates, error boundaries, portals, context, etc.
- Already fully implemented

**No Overlap. Clear Separation.**

---

**Last Updated:** 2026-02-11  
**Status:** Active scope definition
