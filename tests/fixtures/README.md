# Test Fixtures

**Golden test cases for PSR → TypeScript transformation**

## Structure

```
fixtures/
  real-psr/           ← Input PSR files (from pulsar-ui.dev)
  expected-output/    ← Manually written expected TypeScript output
```

## Golden Test Cases

### 01-counter.psr

**Tests:**

- `component` keyword transformation
- Signal creation (`createSignal`)
- Reactive expressions in JSX (`{count()}`)
- Event handlers (`onClick={increment}`)
- Basic JSX structure

**Expected transformation:**

- `component Counter()` → `function Counter()`
- Wrap in `$REGISTRY.execute()`
- JSX → `t_element()` calls
- Preserve signal logic
- Auto-import runtime functions

---

### 02-badge.psr

**Tests:**

- Function component (no `component` keyword)
- Props destructuring with defaults
- Conditional rendering (`icon && <span>`)
- Static JSX (no reactivity)
- External function calls (`cn()`)

**Expected transformation:**

- Preserve function structure
- Wrap in `$REGISTRY.execute()`
- JSX → `t_element()` calls
- Preserve conditional logic
- Auto-import runtime functions

---

### 03-drawer.psr

**Tests:**

- `useEffect` hook
- Lifecycle (cleanup functions)
- Early return (`if (!open) return`)
- Complex JSX with children
- Props with function types

**Expected transformation:**

- Preserve `useEffect` as-is
- Wrap in `$REGISTRY.execute()`
- Handle early returns correctly
- JSX → `t_element()` calls
- Preserve cleanup function

---

## Test Strategy

**Comparison method:**

1. Read input PSR file
2. Transform using pipeline
3. Normalize whitespace
4. Compare with expected output
5. Binary pass/fail

**Normalization:**

- Remove extra whitespace
- Consistent indentation
- Preserve structure

**Success criteria:**

- Exact match after normalization
- All imports present
- Registry pattern applied
- JSX fully transformed
- No stubs or TODOs
