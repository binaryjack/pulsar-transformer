# 🎯 Getting Transformer Working On Screen

**Status:** Ready for Integration  
**Blocker:** Feature flag not enabled in production

---

## 📊 Current State

### ✅ What's Complete

- Transformer implementation (15 methods, all working)
- Pipeline integration with feature flag (`useTransformer: boolean`)
- Golden tests (3/3 passing: Counter, Badge, Drawer)
- Type safety fixes
- Zero rule violations

### ❌ What's Blocking "On Screen" Usage

- Vite plugin NOT passing `useTransformer: true`
- No demo .psr files to test with
- Transformer disabled by default (feature flag = false)

---

## 🚀 Action Plan - 3 Steps

### Step 1: Enable Transformer in Vite Plugin ⏳

**File:** `packages/pulsar-vite-plugin/src/index.ts`

**Current (line ~58):**

```typescript
const pipeline = createPipeline({
  filePath: id,
  debug: debug,
  debugLogger: debug ? { enabled: true, console: true, minLevel: 'debug' } : undefined,
});
```

**Change to:**

```typescript
const pipeline = createPipeline({
  filePath: id,
  debug: debug,
  useTransformer: true, // ✅ ENABLE TRANSFORMER
  debugLogger: debug ? { enabled: true, console: true, minLevel: 'debug' } : undefined,
});
```

---

### Step 2: Create Test PSR Component ⏳

**File:** `packages/pulsar-demo/src/TestComponent.psr`

```psr
/**
 * Test component to verify transformer on screen
 */

import { createSignal } from '@pulsar-framework/pulsar.dev';

export interface ITestProps {
  title?: string;
}

export component TestComponent({ title = 'Test' }: ITestProps) {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

---

### Step 3: Add Test Route ⏳

**File:** `packages/pulsar-demo/src/test-main.tsx`

```tsx
import { render } from '@pulsar-framework/pulsar.dev';
import { TestComponent } from './TestComponent.psr';

const App = () => {
  return (
    <div>
      <TestComponent title="Transformer Test" />
    </div>
  );
};

render(App, document.getElementById('app')!);
```

**File:** `packages/pulsar-demo/test.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transformer Test</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/test-main.tsx"></script>
  </body>
</html>
```

---

## 🔍 Verification Steps

### After Implementation

1. **Start dev server:**

   ```powershell
   cd packages/pulsar-demo
   pnpm dev
   ```

2. **Open in browser:**

   ```
   http://localhost:5173/test.html
   ```

3. **Expected behavior:**
   - Component renders on screen ✅
   - Button increments counter ✅
   - Console shows transformer being used ✅
   - No errors in console ✅

4. **Debug verification:**
   ```powershell
   # Enable debug mode in vite plugin
   # Check console for transformer logs
   # Should see: "Phase 3: Transformer" logs
   ```

---

## 🎯 Expected Output

### Console (with debug enabled):

```
[pulsar] Creating transformation pipeline...
📝 Phase 1: Lexer
  ⏱️  Lexer: 2.45ms
🌳 Phase 2: Parser
  ⏱️  Parser: 1.23ms
🔄 Phase 3: Transformer
  ✅ Transformed AST with 4 statements
  ⏱️  Transformer: 0.85ms
⚡ Phase 4: Code Generator
  ✅ Generated 523 characters
  ⏱️  CodeGenerator: 1.10ms
✨ Transformation complete in 5.63ms
```

### Generated Code:

```typescript
import { $REGISTRY, createSignal, t_element } from '@pulsar-framework/pulsar.dev';

export interface ITestProps {
  title?: string;
}

export const TestComponent = ({ title = 'Test' }: ITestProps) => {
  return $REGISTRY.execute('component:TestComponent', () => {
    const [count, setCount] = createSignal(0);

    return t_element('div', {}, [
      t_element('h1', {}, [title]),
      t_element('p', {}, ['Count: ', count()]),
      t_element('button', { onClick: () => setCount(count() + 1) }, ['Increment']),
    ]);
  });
};
```

---

## ⚠️ Known Issues to Watch

### CodeGenerator Handling

The CodeGenerator already handles `ExportNamedDeclaration` (line 17 in generate-statement.ts), but verify it properly generates:

- `VariableDeclaration` inside `ExportNamedDeclaration`
- `$REGISTRY.execute` call expressions
- Arrow function syntax

### If Issues Occur:

1. Check console for transformation errors
2. Verify AST structure matches expectations
3. Check golden tests are still passing
4. Debug with `debug: true` in vite plugin

---

## 📝 Summary

**What needs to happen:**

1. Add ONE line to vite plugin: `useTransformer: true`
2. Create test .psr component
3. Create test HTML entry point
4. Run dev server
5. Open browser

**Time estimate:** 5 minutes  
**Risk:** Low (transformer already tested)  
**Rollback:** Set `useTransformer: false`

---

**Ready to execute?** Say "do it in one go" and I'll implement all 3 steps.
