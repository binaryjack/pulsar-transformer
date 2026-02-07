#

## Issue #16: Multiple children - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Multiple children

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #15: Self-closing elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Self-closing elements

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Nested elements

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

PSR Transformer Testing Issues

**Testing Date:** Not yet started  
**Agent:** AI Testing Agent  
**Test Suite:** pulsar-ui.dev/main.psr  
**Status:** Ready for testing

---

## Overview

This document tracks all issues found during comprehensive PSR transformer testing. Each issue is documented with:

- **Severity** (Critical/High/Medium/Low)
- **Status** (Open/In Progress/Fixed)
- **Feature category** (Signal/Effect/JSX/etc.)
- **Complete reproduction steps**
- **Root cause analysis**
- **Suggested fixes**

---

## Testing Progress

### Feature Coverage

| Feature Category       | Status      | Tests Run | Passed | Failed | Issues |
| ---------------------- | ----------- | --------- | ------ | ------ | ------ |
| Signals                | ❌ Failures | 6         | 0      | 6      | 6      |
| Effects                | ❌ Failures | 3         | 0      | 3      | 3      |
| Computed/Memos         | ❌ Failures | 3         | 0      | 3      | 3      |
| JSX Elements           | ❌ Failures | 4         | 0      | 4      | 4      |
| Attributes             | ⏳ Pending  | 0         | 0      | 0      | -      |
| Event Handlers         | ⏳ Pending  | 0         | 0      | 0      | -      |
| Conditional Rendering  | ⏳ Pending  | 0         | 0      | 0      | -      |
| Lists/Iteration        | ⏳ Pending  | 0         | 0      | 0      | -      |
| Component Composition  | ⏳ Pending  | 0         | 0      | 0      | -      |
| Props                  | ⏳ Pending  | 0         | 0      | 0      | -      |
| TypeScript Integration | ⏳ Pending  | 0         | 0      | 0      | -      |
| Advanced Syntax        | ⏳ Pending  | 0         | 0      | 0      | -      |
| Registry Pattern       | ⏳ Pending  | 0         | 0      | 0      | -      |
| Error Handling         | ⏳ Pending  | 0         | 0      | 0      | -      |

**Legend:**

- ⏳ Pending
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked

---

## Issues Summary


## Issue #4: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Nested elements

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function NestedTest() {
  return $REGISTRY.execute('component:NestedTest', null, () => {
    return ((_el0) => { _el0.append(((_el1) => { _el1.append(document.createTextNode("Nested")); return _el1; })(t_element('span', {}))); return _el0; })(t_element('div', {}));
  });
}
export { NestedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Nested elements

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function NestedTest() {
  return $REGISTRY.execute('component:NestedTest', null, () => {
    return ((_el0) => { _el0.append(((_el1) => { _el1.append(document.createTextNode("Nested")); return _el1; })(t_element('span', {}))); return _el0; })(t_element('div', {}));
  });
}
export { NestedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Nested elements

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function NestedTest() {
  return $REGISTRY.execute('component:NestedTest', null, () => {
    return ((_el0) => { _el0.append(((_el1) => { _el1.append(document.createTextNode("Nested")); return _el1; })(t_element('span', {}))); return _el0; })(t_element('div', {}));
  });
}
export { NestedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07  

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07  

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07  

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---


## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07  

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

No error details available

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** Unknown error  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Nested elements

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function NestedTest() {
  return $REGISTRY.execute('component:NestedTest', null, () => {
    return ((_el0) => { _el0.append(((_el1) => { _el1.append(document.createTextNode("Nested")); return _el1; })(t_element('span', {}))); return _el0; })(t_element('div', {}));
  });
}
export { NestedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #16: Multiple children - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Multiple children

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #15: Self-closing elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Self-closing elements

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #14: Nested elements - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Nested elements

### Test Case

```psr
Source code not available
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #13: Simple div element - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** JSX Elements  
**Found:** 2026-02-07

### Description

Test failed: Simple div element

### Test Case

```psr
import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function DivTest() {
  return $REGISTRY.execute('component:DivTest', null, () => {
    return ((_el0) => { _el0.append(document.createTextNode("Hello")); return _el0; })(t_element('div', {}));
  });
}
export { DivTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #12: Multiple computed values - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Multiple computed values

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiComputedTest() {
  return $REGISTRY.execute('component:MultiComputedTest', null, () => {
    const [x, setX] = createSignal(10);
    const doubled = createMemo(() => (x() * 2));
    const quadrupled = createMemo(() => (doubled() * 2));
    return ((_el0) => { _el0.append(quadrupled()); return _el0; })(t_element('div', {}));
  });
}
export { MultiComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #11: Computed with string concatenation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Computed with string concatenation

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedStringTest() {
  return $REGISTRY.execute('component:ComputedStringTest', null, () => {
    const [first, setFirst] = createSignal("Hello");
    const [last, setLast] = createSignal("World");
    const full = createMemo(() => ((first() + " ") + last()));
    return ((_el0) => { _el0.append(full()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedStringTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #10: Basic computed value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Computed  
**Found:** 2026-02-07

### Description

Test failed: Basic computed value

### Test Case

```psr
import { $REGISTRY, createMemo, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ComputedTest() {
  return $REGISTRY.execute('component:ComputedTest', null, () => {
    const [a, setA] = createSignal(2);
    const [b, setB] = createSignal(3);
    const sum = createMemo(() => (a() + b()));
    return ((_el0) => { _el0.append(sum()); return _el0; })(t_element('div', {}));
  });
}
export { ComputedTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #9: Multiple effects in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Multiple effects in one component

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiEffectTest() {
  return $REGISTRY.execute('component:MultiEffectTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(0);
    const [c, setC] = createSignal(0);
    createEffect(() => setB((a() * 2)));
    createEffect(() => setC((b() * 2)));
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiEffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #8: Effect that depends on signal - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Effect that depends on signal

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectDependencyTest() {
  return $REGISTRY.execute('component:EffectDependencyTest', null, () => {
    const [count, setCount] = createSignal(0);
    const [doubled, setDoubled] = createSignal(0);
    createEffect(() => {     setDoubled((count() * 2)); });
    return ((_el0) => { _el0.append(doubled()); return _el0; })(t_element('div', {}));
  });
}
export { EffectDependencyTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #7: Basic effect that runs on mount - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Effects  
**Found:** 2026-02-07

### Description

Test failed: Basic effect that runs on mount

### Test Case

```psr
import { $REGISTRY, createEffect, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function EffectTest() {
  return $REGISTRY.execute('component:EffectTest', null, () => {
    const [log, setLog] = createSignal("");
    createEffect(() => {     setLog("Effect ran"); });
    return ((_el0) => { _el0.append(log()); return _el0; })(t_element('div', {}));
  });
}
export { EffectTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #6: Signal write operation - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal write operation

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalWriteTest() {
  return $REGISTRY.execute('component:SignalWriteTest', null, () => {
    const [count, setCount] = createSignal(0);
    setCount(42);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalWriteTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #5: Multiple signals in one component - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Multiple signals in one component

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function MultiSignalTest() {
  return $REGISTRY.execute('component:MultiSignalTest', null, () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const [c, setC] = createSignal(3);
    return ((_el0) => { _el0.append(a(), b(), c()); return _el0; })(t_element('div', {}));
  });
}
export { MultiSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #4: Signal with array value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with array value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ArraySignalTest() {
  return $REGISTRY.execute('component:ArraySignalTest', null, () => {
    const [items, setItems] = createSignal();
    return ((_el0) => { _el0.append(items().length); return _el0; })(t_element('div', {}));
  });
}
export { ArraySignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #3: Signal with object value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with object value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function ObjectSignalTest() {
  return $REGISTRY.execute('component:ObjectSignalTest', null, () => {
    const [user, setUser] = createSignal();
    return ((_el0) => { _el0.append(user().name); return _el0; })(t_element('div', {}));
  });
}
export { ObjectSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #2: Signal with string value - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Signal with string value

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function StringSignalTest() {
  return $REGISTRY.execute('component:StringSignalTest', null, () => {
    const [text, setText] = createSignal("Hello");
    return ((_el0) => { _el0.append(text()); return _el0; })(t_element('span', {}));
  });
}
export { StringSignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

## Issue #1: Basic signal creation with number - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** Signals  
**Found:** 2026-02-07

### Description

Test failed: Basic signal creation with number

### Test Case

```psr
import { $REGISTRY, createSignal } from '@pulsar-framework/pulsar.dev';
import { t_element } from '@pulsar-framework/pulsar.dev/jsx-runtime';

function SignalTest() {
  return $REGISTRY.execute('component:SignalTest', null, () => {
    const [count, setCount] = createSignal(0);
    return ((_el0) => { _el0.append(count()); return _el0; })(t_element('div', {}));
  });
}
export { SignalTest };
```

### Errors

- [object Object]

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** [object Object]

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

| Severity  | Open  | In Progress | Fixed | Total |
| --------- | ----- | ----------- | ----- | ----- |
| Critical  | 0     | 0           | 0     | 0     |
| High      | 0     | 0           | 0     | 0     |
| Medium    | 0     | 0           | 0     | 0     |
| Low       | 0     | 0           | 0     | 0     |
| **Total** | **0** | **0**       | **0** | **0** |

---

## Known Blockers

### ❌ Critical Blocker: JSX Parser Failures

**Impact:** Prevents testing of nested JSX, self-closing tags, and multiple children  
**Issues:** #4, #5, #6  
**Status:** Must fix before continuing JSX tests  
**Root Cause:** Parser not handling whitespace/indent in JSX correctly

---

## Issues

### Template (Remove after first issue)

```markdown
## Issue #N: [Short Description]

**Severity:** Critical | High | Medium | Low  
**Status:** Open | In Progress | Fixed  
**Feature:** [Signal | Effect | JSX | Events | etc.]  
**Found:** [DATE]  
**Fixed:** [DATE or N/A]

### Description

Clear description of what's wrong.

### Test Case

\`\`\`psr
component BrokenTest() {
const [count, setCount] = signal(0);
return <div>{count()}</div>;
}
\`\`\`

### Expected Transformation

\`\`\`typescript
export function BrokenTest(): HTMLElement {
return $REGISTRY.execute('component:BrokenTest', () => {
const [count, setCount] = createSignal(0);
return t_element('div', {}, [count()]);
});
}
\`\`\`

### Actual Transformation

\`\`\`typescript
// Paste actual output here
\`\`\`

### Error Details

- **Phase:** Lexer | Parser | Analyzer | Transform | Emitter | Runtime
- **Error Message:** [Exact error]
- **Stack Trace:**
  \`\`\`
  [Stack trace if available]
  \`\`\`
- **Line Numbers:** PSR line X → TS line Y

### DOM Impact

- [ ] DOM renders incorrectly
- [ ] Elements missing
- [ ] Attributes wrong
- [ ] Events don't fire
- [ ] Reactivity broken
- [ ] Other: [describe]

### Reproduction Steps

1. Create file with test case
2. Run transformation: `npm run transform`
3. Execute in browser via pulsar-ui.dev
4. Observe: [specific behavior]

### Root Cause Analysis

[Your analysis of why this is happening - which transformer phase is broken, what code is causing it]

**Affected Files:**

- `packages/pulsar-transformer/src/[phase]/[file].ts`

**Code Location:**

- Function: `[functionName]`
- Lines: [X-Y]

### Suggested Fix

**Approach:**
[Describe the fix strategy]

**Code Changes:**
\`\`\`typescript
// Before
[current code]

// After
[proposed fix]
\`\`\`

**Testing:**

- [ ] Add failing test to transformer suite
- [ ] Implement fix
- [ ] Verify test passes
- [ ] Run regression tests
- [ ] Test in browser

### Related Issues

- Issue #X (similar pattern)
- Issue #Y (same phase)

### Notes

[Any additional context, workarounds, or observations]
```

---

## Testing Sessions

### Session 1 - [DATE]

**Duration:** [TIME]  
**Focus:** [Features tested]  
**Results:** X tests run, Y passed, Z failed  
**Issues Found:** #N, #M, #O  
**Issues Fixed:** None yet

---

## Regression Tracking

### Fixed Issues That Regressed

_None yet_

---

## Performance Issues

### Transformation Performance

| Issue | Severity | Status | Target | Actual |
| ----- | -------- | ------ | ------ | ------ |
| -     | -        | -      | -      | -      |

### Runtime Performance

| Issue | Severity | Status | Target | Actual |
| ----- | -------- | ------ | ------ | ------ |
| -     | -        | -      | -      | -      |

---

## Architecture Concerns

### Structural Issues

_Document any architectural problems found that aren't single bugs but systemic issues_

### Technical Debt

_Note any technical debt discovered during testing_

---

## Recommendations

### Priority Fixes (Do First)

_Critical and High severity issues that block functionality_

### Improvements (Do Next)

_Medium severity issues and enhancements_

### Nice-to-Have (Do Later)

_Low severity issues and polish_

### Architecture Refactoring

_Larger structural changes needed_

---

## Testing Methodology Notes

### What Worked Well

_Document effective testing strategies_

### What Needs Improvement

_Note testing gaps or difficulties_

### Tools Used

- PSR Test Runner
- Browser DevTools
- [Other tools]

### Insights

_Key learnings from testing process_

---

**Last Updated:** [DATE]  
**Next Testing Session:** [PLANNED DATE]  
**Primary Tester:** AI Testing Agent  
**Reviewer:** Tadeo

---

## Appendix

### Common Error Patterns

_Document recurring error patterns for quick reference_

### Transformer Phase Breakdown

**Lexer Issues:**

- Count: 0
- Most common: -

**Parser Issues:**

- Count: 0
- Most common: -

**Analyzer Issues:**

- Count: 0
- Most common: -

**Transform Issues:**

- Count: 0
- Most common: -

**Emitter Issues:**

- Count: 0
- Most common: -

**Runtime Issues:**

- Count: 0
- Most common: -

---

## Quick Reference

### Severity Definitions

**Critical:**

- Transformation fails completely
- Core features broken (signals, components)
- Security vulnerabilities
- Data corruption

**High:**

- Features don't work as expected
- Reactivity broken
- Events don't fire
- Significant performance issues

**Medium:**

- Edge cases fail
- Minor functionality issues
- Suboptimal output
- Performance degradation

**Low:**

- Cosmetic issues
- Non-standard patterns
- Nice-to-have features
- Documentation issues

### Status Definitions

**Open:**

- Issue identified and documented
- Not yet being worked on
- Needs investigation

**In Progress:**

- Actively being investigated or fixed
- Has assigned developer
- Work in progress

**Fixed:**

- Fix implemented
- Tests pass
- Merged to main branch
- Verified in browser

---

**Template Version:** 1.0.0  
**Created:** 2026-02-07
