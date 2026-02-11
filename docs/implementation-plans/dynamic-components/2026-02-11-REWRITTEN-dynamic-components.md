# Dynamic Components - JSX Transformation (REWRITTEN)

**Date:** 2026-02-11  
**Status:** ✅ VALID (Rewritten to focus on actual transformer concerns)

---

## ⚠️ CRITICAL CLARIFICATION

**`<Dynamic>` is a RUNTIME COMPONENT from `@pulsar-framework/pulsar.dev`, NOT a transformer feature.**

The transformer does NOT implement `<Dynamic>` switching logic. The runtime already provides it.

**See:** `packages/pulsar.dev/src/control-flow/dynamic/` (if exists)

---

## 🎯 What This Plan Actually Covers

**Transformer's ONLY responsibility for `<Dynamic>`:**

1. Parse `<Dynamic component={...}>` as normal JSX
2. Transform to `t_element('Dynamic', { component: ... }, [children])`
3. Auto-import `Dynamic` from `@pulsar-framework/pulsar.dev` if used
4. Preserve reactive expressions in `component` prop
5. Handle spread props correctly
6. **That's it.**

No special transformation needed. `<Dynamic>` is handled like any other JSX component.

---

## ✅ Actual Transformation Requirements

### 1. Basic Dynamic Component

**Input:**

```psr
<Dynamic component={currentComponent()} />
```

**Output:**

```js
t_element('Dynamic', { component: currentComponent() }, []);
```

**Auto-import:**

```js
import { Dynamic } from '@pulsar-framework/pulsar.dev';
```

### 2. Preserve Reactive Expressions

**Input:**

```psr
<Dynamic component={getComponent()} name={getName()} />
```

**Transformer must:**

- ✅ Preserve `getComponent()` call in `component` prop
- ✅ Preserve `getName()` call in `name` prop
- ✅ NOT evaluate or transform reactive expressions
- ✅ Let runtime handle reactivity

### 3. Dynamic with Children

**Input:**

```psr
<Dynamic component={Wrapper()}>
  <div>Content</div>
</Dynamic>
```

**Output:**

```js
t_element(
  'Dynamic',
  {
    component: Wrapper(),
  },
  [t_element('div', null, ['Content'])]
);
```

### 4. Dynamic with Spread Props

**Input:**

```psr
<Dynamic component={Button} {...props()} onClick={handleClick} />
```

**Output:**

```js
t_element(
  'Dynamic',
  {
    component: Button,
    ...props(),
    onClick: handleClick,
  },
  []
);
```

**Transformer must:**

- ✅ Preserve spread operator: `...props()`
- ✅ Handle prop merging correctly
- ✅ Preserve order: spread before explicit props

### 5. Conditional Dynamic Components

**Input:**

```psr
<Dynamic component={isAdmin() ? AdminPanel : UserPanel} />
```

**Transformer must:**

- ✅ Parse ternary expression in `component` prop
- ✅ Preserve reactive call: `isAdmin()`
- ✅ NOT evaluate the ternary at compile-time

### 6. Dynamic with String Component Names

**Input:**

```psr
<Dynamic component={elementType()} />
```

**Where `elementType()` returns `'div'`, `'span'`, etc.**

**Transformer must:**

- ✅ Preserve dynamic expression
- ✅ Let runtime handle string → element conversion

---

## ❌ What Transformer Does NOT Do

### 1. Does NOT Implement Component Switching

**Runtime handles:**

- ✅ Evaluating `component` prop
- ✅ Rendering the correct component
- ✅ Switching components when prop changes
- ✅ Cleanup on component switch

**Transformer:**

- ❌ DOES NOT implement switching logic
- ❌ DOES NOT render components
- ❌ Just transforms JSX to function calls

### 2. Does NOT Handle Component Resolution

**Runtime handles:**

- ✅ Resolving component references
- ✅ Handling string component names (`'div'`, `'button'`, etc.)
- ✅ Error handling for invalid components

**Transformer:**

- ❌ No resolution logic
- ❌ Runtime decides how to resolve

### 3. Does NOT Implement Cleanup

**Runtime handles:**

- ✅ Cleanup when component switches
- ✅ Disposal of previous component's subscriptions

**Transformer:**

- ❌ No cleanup logic
- ❌ Runtime handles lifecycle

---

## 🧪 Test Requirements

### Test 1: Basic Dynamic Component

**Input:**

```psr
<Dynamic component={Button} />
```

**Expected Output:**

```js
t_element('Dynamic', { component: Button }, []);
```

### Test 2: Dynamic with Props

**Input:**

```psr
<Dynamic component={Input} value={text()} onChange={setText} />
```

**Expected Output:**

```js
t_element(
  'Dynamic',
  {
    component: Input,
    value: text(),
    onChange: setText,
  },
  []
);
```

### Test 3: Dynamic with Children

**Input:**

```psr
<Dynamic component={Wrapper}>
  <span>Child</span>
</Dynamic>
```

**Expected Output:**

```js
t_element('Dynamic', { component: Wrapper }, [t_element('span', null, ['Child'])]);
```

### Test 4: Dynamic with Spread Props

**Input:**

```psr
<Dynamic component={Button} {...buttonProps()} />
```

**Expected Output:**

```js
t_element(
  'Dynamic',
  {
    component: Button,
    ...buttonProps(),
  },
  []
);
```

### Test 5: Auto-Import Detection

**Input:**

```psr
component App() {
  return <Dynamic component={Button} />;
}
```

**Expected:**

- ✅ Auto-import: `import { Dynamic } from '@pulsar-framework/pulsar.dev';`

### Test 6: Conditional Component

**Input:**

```psr
<Dynamic component={loading() ? Spinner : Content} />
```

**Expected:**

- ✅ Preserve ternary: `component: loading() ? Spinner : Content`
- ✅ Do NOT evaluate at compile-time

---

## ✅ Validation Checklist

Before marking this plan complete:

- [ ] `<Dynamic>` JSX transforms to `t_element('Dynamic', ...)` (like any JSX)
- [ ] Reactive expressions in `component` prop are preserved
- [ ] Additional props are transformed correctly
- [ ] Children are transformed correctly
- [ ] Spread props (`...props()`) work correctly
- [ ] Auto-import for `Dynamic` works
- [ ] Ternary expressions in `component` prop are preserved
- [ ] **Confirmed:** No special transformation logic beyond normal JSX handling

---

## 📖 Related

- Runtime implementation: `packages/pulsar.dev/src/control-flow/dynamic/` (if exists)
- Scope definition: `packages/pulsar-transformer/docs/PSR-TRANSFORMER-SCOPE.md`
- JSX transformation: `packages/pulsar-transformer/src/transformer/prototypes/transform-jsx-element.ts`

---

**Last Updated:** 2026-02-11  
**Status:** ✅ Rewritten to reflect actual transformer scope
