# AI Agent Testing Prompt - PSR Transformer Validation

**Role:** Testing & Transformer Fix Agent  
**Mission:** Validate ALL Pulsar framework features using main.psr bootstrapper and fix transformer issues  
**Documentation:** Record ALL issues precisely in side document  

---

## 🎯 Your Mission

You are an AI agent responsible for:

1. **Testing PSR transformations** using the PSR Test Runner from `pulsar-ui.dev/src/main.psr`
2. **Validating ALL Pulsar framework features** comprehensively
3. **Finding and documenting transformer bugs** with precision
4. **Fixing transformer issues** when found
5. **Maintaining issue tracking document** throughout testing

**Critical:** NO SHORTCUTS. NO MVP. Full validation of every feature. Document everything.

---

## 🏗️ Architecture Context

### Pulsar Framework Overview

**Pulsar** is a reactive framework with:
- **Signals** - Reactive primitives (like SolidJS/Vue refs)
- **Effects** - Side effects that run on signal changes
- **Computed/Memos** - Derived reactive values
- **Components** - Declarative UI building blocks
- **$REGISTRY** - Global component lifecycle manager
- **PSR Syntax** - Custom syntax (.psr files) transformed to TypeScript

### Transformation Pipeline (5 Phases)

```
PSR Source Code
    ↓
1. Lexer → Tokens
    ↓
2. Parser → AST (Abstract Syntax Tree)
    ↓
3. Analyzer → Semantic Analysis
    ↓
4. Transform → Registry Pattern + Signal Detection
    ↓
5. Emitter → TypeScript Output
    ↓
Browser Execution (via Vite plugin)
```

### Key Transformation Rules

**Signal Detection:**
```psr
const [count, setCount] = signal(0);
```
↓ Transforms to:
```typescript
const [count, setCount] = createSignal(0);
```

**Component Registration:**
```psr
component Counter() { return <div>...</div>; }
```
↓ Transforms to:
```typescript
export function Counter(): HTMLElement {
  return $REGISTRY.execute('component:Counter', () => {
    return t_element('div', {}, [...]);
  });
}
```

**JSX Elements:**
```psr
<button onClick={() => increment()}>Click</button>
```
↓ Transforms to:
```typescript
t_element('button', { onClick: () => increment() }, ['Click'])
```

---

## 🧪 PSR Test Runner - Your Primary Tool

### What It Does

The PSR Test Runner validates the **entire pipeline**:

1. ✅ Transforms PSR source → TypeScript
2. ✅ Executes transformed code in mock DOM
3. ✅ Validates DOM structure matches expectations
4. ✅ Tests reactivity (signal updates → DOM updates)
5. ✅ Tests event handlers work correctly
6. ✅ Validates CSS styles are applied
7. ✅ Custom assertions for edge cases

### Location

```
packages/pulsar-transformer/src/testing/
├── psr-test-runner.types.ts       # Type definitions
├── create-psr-test-runner.ts      # Factory function
├── README.md                      # Full documentation
├── examples/comprehensive-demo.ts # Usage examples
└── __tests__/psr-test-runner.test.ts # Test suite
```

### Basic Usage

```typescript
import { createPSRTestRunner } from '@pulsar-framework/transformer/testing';

const runner = createPSRTestRunner({ verbose: true });

const result = await runner.runTest({
  description: 'Test component rendering',
  source: `
    component TestComp() {
      const [count] = signal(0);
      return <div class="test">{count()}</div>;
    }
  `,
  expectedDOM: [
    { selector: '.test', textContent: '0' }
  ]
});

if (!result.passed) {
  console.error('Test failed:', result.errors);
}
```

### Complete Test Example

```typescript
// Test with reactivity and events
const result = await runner.runTest({
  description: 'Counter with increment button',
  source: `
    component Counter() {
      const [count, setCount] = signal(0);
      
      return (
        <div>
          <span class="count">{count()}</span>
          <button class="increment" onClick={() => setCount(count() + 1)}>
            +
          </button>
        </div>
      );
    }
  `,
  expectedDOM: [
    { selector: '.count', textContent: '0' },
    { selector: '.increment', textContent: '+' }
  ],
  reactivityTests: [
    {
      description: 'Increment updates count display',
      signalName: 'count',
      newValue: 5,
      expectedDOM: [
        { selector: '.count', textContent: '5' }
      ]
    }
  ],
  eventTests: [
    {
      description: 'Click increment button',
      selector: '.increment',
      eventType: 'click',
      afterEvent: {
        signalName: 'count',
        expectedValue: 1
      }
    }
  ]
});
```

---

## 📋 Testing Strategy - Using main.psr Bootstrapper

### File Location

```
packages/pulsar-ui.dev/src/main.psr
```

This file **bootstraps the entire application** and imports comprehensive test suites.

### Your Testing Workflow

**Step 1: Understand main.psr**
```bash
# Read the bootstrapper file
cat packages/pulsar-ui.dev/src/main.psr
```

**Step 2: Identify Test Suite Files**

Look for imported test files:
- `test-comprehensive-reactivity.psr`
- `test-comprehensive-new.psr`
- `test-advanced.psr`
- `test-edge-cases.psr`
- All other test-*.psr files

**Step 3: Extract Test Cases**

For each test file:
1. Read the PSR source code
2. Identify what features are being tested
3. Create PSR Test Runner test cases
4. Run validation through test runner

**Step 4: Run Comprehensive Tests**

```typescript
// Your test script template
import { createPSRTestRunner } from '@pulsar-framework/transformer/testing';
import { readFileSync } from 'fs';
import { join } from 'path';

const runner = createPSRTestRunner({ verbose: true });

// Read test files from pulsar-ui.dev
const testFiles = [
  'test-comprehensive-new.psr',
  'test-advanced.psr',
  'test-edge-cases.psr'
  // ... all test files
];

const results = [];

for (const file of testFiles) {
  const source = readFileSync(
    join('packages/pulsar-ui.dev/src', file),
    'utf-8'
  );
  
  const result = await runner.runTest({
    description: `Testing ${file}`,
    source,
    // Add expected assertions based on file content
    expectedDOM: [...],
    reactivityTests: [...],
    // etc.
  });
  
  results.push({ file, result });
  
  if (!result.passed) {
    // DOCUMENT THE ISSUE IMMEDIATELY
    documentIssue({
      file,
      error: result.errors,
      transformedCode: result.transformedCode,
      phase: result.failurePhase
    });
  }
}
```

---

## ✅ All Pulsar Features to Validate

### 1. Signal Primitives

**Features:**
- [x] `signal(initialValue)` → `createSignal(initialValue)`
- [x] Signal read: `count()`
- [x] Signal write: `setCount(5)`
- [x] Signal with objects
- [x] Signal with arrays
- [x] Signal with nested structures

**Test:**
```psr
component SignalTest() {
  const [count, setCount] = signal(0);
  const [user, setUser] = signal({ name: 'Alice' });
  const [items, setItems] = signal([1, 2, 3]);
  
  return (
    <div>
      <span class="count">{count()}</span>
      <span class="user">{user().name}</span>
      <span class="items">{items().length}</span>
    </div>
  );
}
```

### 2. Effects

**Features:**
- [x] `effect(() => { ... })` → `createEffect(() => { ... })`
- [x] Effects run when signals change
- [x] Effects cleanup
- [x] Effects with dependencies
- [x] Nested effects

**Test:**
```psr
component EffectTest() {
  const [count, setCount] = signal(0);
  const [log, setLog] = signal('');
  
  effect(() => {
    setLog(`Count is ${count()}`);
  });
  
  return (
    <div>
      <span class="log">{log()}</span>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}
```

### 3. Computed / Memos

**Features:**
- [x] `computed(() => ...)` → `createMemo(() => ...)`
- [x] Memoization works
- [x] Only recomputes when dependencies change
- [x] Computed with multiple dependencies

**Test:**
```psr
component ComputedTest() {
  const [a, setA] = signal(2);
  const [b, setB] = signal(3);
  const sum = computed(() => a() + b());
  
  return (
    <div>
      <span class="sum">{sum()}</span>
    </div>
  );
}
```

### 4. JSX Elements

**Features:**
- [x] Basic elements: `<div>`, `<span>`, `<button>`, etc.
- [x] Self-closing: `<input />`, `<br />`
- [x] Nested elements
- [x] Text content
- [x] Expressions in children: `{count()}`
- [x] Multiple children
- [x] Fragment: `<>...</>`

**Test:**
```psr
component JSXTest() {
  return (
    <div class="container">
      <h1>Title</h1>
      <p>Paragraph</p>
      <input type="text" />
      <br />
      <span>End</span>
    </div>
  );
}
```

### 5. Attributes

**Features:**
- [x] Static attributes: `class="foo"`
- [x] Dynamic attributes: `class={className()}`
- [x] Boolean attributes: `disabled`, `checked`
- [x] Data attributes: `data-test-id="foo"`
- [x] ARIA attributes: `aria-label="foo"`
- [x] Event handlers: `onClick`, `onInput`, etc.
- [x] Style attribute: `style={{ color: 'red' }}`

**Test:**
```psr
component AttributeTest() {
  const [disabled, setDisabled] = signal(false);
  const [className, setClassName] = signal('active');
  
  return (
    <button 
      class={className()}
      disabled={disabled()}
      data-test-id="btn"
      aria-label="Test button"
      style={{ background: 'blue' }}
    >
      Click me
    </button>
  );
}
```

### 6. Event Handlers

**Features:**
- [x] `onClick` → click events
- [x] `onInput` → input events
- [x] `onChange` → change events
- [x] `onSubmit` → submit events
- [x] `onFocus`, `onBlur` → focus events
- [x] `onMouseEnter`, `onMouseLeave` → mouse events
- [x] `onKeyDown`, `onKeyUp` → keyboard events
- [x] Event handler receives event object
- [x] Arrow functions in handlers
- [x] Inline vs defined handlers

**Test:**
```psr
component EventTest() {
  const [clicked, setClicked] = signal(false);
  const [inputValue, setInputValue] = signal('');
  
  const handleClick = () => setClicked(true);
  
  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onInput={(e) => setInputValue(e.target.value)} />
      <span class="clicked">{clicked() ? 'Yes' : 'No'}</span>
      <span class="value">{inputValue()}</span>
    </div>
  );
}
```

### 7. Conditional Rendering

**Features:**
- [x] Ternary: `{condition() ? <A /> : <B />}`
- [x] Logical AND: `{condition() && <Component />}`
- [x] if/else blocks (if supported)
- [x] Nested conditionals
- [x] Conditionals with signals

**Test:**
```psr
component ConditionalTest() {
  const [show, setShow] = signal(true);
  const [mode, setMode] = signal('light');
  
  return (
    <div>
      {show() && <span class="visible">Visible</span>}
      {mode() === 'light' ? <span>Light</span> : <span>Dark</span>}
    </div>
  );
}
```

### 8. Lists / Iteration

**Features:**
- [x] `array.map()` in JSX
- [x] Dynamic lists with signals
- [x] Keys (if supported)
- [x] Nested lists
- [x] List add/remove/update

**Test:**
```psr
component ListTest() {
  const [items, setItems] = signal(['a', 'b', 'c']);
  
  return (
    <ul>
      {items().map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
```

### 9. Component Composition

**Features:**
- [x] Component definition
- [x] Component usage: `<Counter />`
- [x] Props: `<Counter initial={5} />`
- [x] Children props
- [x] Nested components
- [x] Component returns element

**Test:**
```psr
component Child({ name }) {
  return <span class="child">{name}</span>;
}

component Parent() {
  return (
    <div class="parent">
      <Child name="Alice" />
      <Child name="Bob" />
    </div>
  );
}
```

### 10. Props

**Features:**
- [x] Props destructuring: `({ name, age })`
- [x] Props access: `props.name`
- [x] Default props
- [x] Optional props
- [x] Props type checking (TypeScript)
- [x] Props spreading: `{...props}`

**Test:**
```psr
component PropsTest({ title = 'Default', count }) {
  return (
    <div>
      <h1>{title}</h1>
      <span>{count}</span>
    </div>
  );
}
```

### 11. TypeScript Integration

**Features:**
- [x] Type annotations
- [x] Interfaces
- [x] Type inference
- [x] Generic types
- [x] Union types
- [x] Enums
- [x] Type guards

**Test:**
```psr
interface IUser {
  name: string;
  age: number;
}

component TypedComponent({ user }: { user: IUser }) {
  return <div>{user.name}, {user.age}</div>;
}
```

### 12. Advanced Syntax

**Features:**
- [x] Arrow functions
- [x] Template literals
- [x] Destructuring (arrays, objects)
- [x] Spread operator
- [x] Rest parameters
- [x] Optional chaining: `user?.name`
- [x] Nullish coalescing: `value ?? default`
- [x] Async/await
- [x] Generators
- [x] Decorators

### 13. Registry Pattern

**Features:**
- [x] `$REGISTRY.execute()` wraps components
- [x] Component isolation
- [x] Lifecycle management
- [x] HMR support (hot module replacement)
- [x] `$REGISTRY.wire()` for reactive connections

**Validate:**
- Every component wrapped in `$REGISTRY.execute()`
- Correct component IDs: `'component:ComponentName'`
- Registry available in transformed code

### 14. Error Handling

**Features:**
- [x] Try-catch in components
- [x] Error boundaries (if supported)
- [x] Transformation errors
- [x] Runtime errors
- [x] Helpful error messages

---

## 🐛 Issue Documentation Template

**CRITICAL:** Document EVERY issue you find immediately in this format.

### Issue Document Structure

Create: `packages/pulsar-transformer/TESTING-ISSUES.md`

```markdown
# PSR Transformer Testing Issues

**Testing Date:** [DATE]  
**Agent:** AI Testing Agent  
**Test Suite:** pulsar-ui.dev/main.psr  

---

## Issue #1: [Short Description]

**Severity:** Critical | High | Medium | Low  
**Status:** Open | In Progress | Fixed  
**Feature:** [Signal | Effect | JSX | Events | etc.]

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
- **Stack Trace:** [If available]
- **Line Numbers:** [PSR line X → TS line Y]

### DOM Impact

- [ ] DOM renders incorrectly
- [ ] Elements missing
- [ ] Attributes wrong
- [ ] Events don't fire
- [ ] Reactivity broken

### Reproduction Steps

1. Create file with test case
2. Run transformation
3. Execute in browser
4. Observe [specific behavior]

### Root Cause Analysis

[Your analysis of why this is happening - which transformer phase is broken]

### Suggested Fix

[Specific file/function to modify, proposed solution]

### Related Issues

- Issue #X (similar pattern)
- Issue #Y (same phase)

---

## Issue #2: ...

[Continue for each issue]
```

### Issue Priority Guide

**Critical:**
- Transformation fails completely
- Core features broken (signals, components)
- Security issues
- Data corruption

**High:**
- Features don't work as expected
- Reactivity broken
- Events don't fire
- Performance problems

**Medium:**
- Edge cases fail
- Minor functionality issues
- Suboptimal output

**Low:**
- Cosmetic issues
- Non-standard patterns
- Nice-to-have features

---

## 🔴 Critical Rules (From Copilot Instructions)

**YOU MUST FOLLOW THESE RULES:**

### 1. Declarative Components ONLY

❌ **FORBIDDEN:**
- `useImperativeHandle`
- `forwardRef` with methods
- Component methods via refs

✅ **REQUIRED:**
- Props control everything
- No imperative APIs

### 2. Prototype-Based Classes ONLY

❌ **FORBIDDEN:**
```typescript
class Signal<T> { ... }
```

✅ **REQUIRED:**
```typescript
const Signal = function<T>(this: ISignalInternal<T>, val: T) { ... }
```

### 3. One Item Per File

❌ **FORBIDDEN:**
```typescript
// signal.ts - Multiple items
export interface ISignal {}
export const Signal = function() {};
```

✅ **REQUIRED:**
```
signal/
├── signal.types.ts    # ONLY types
├── signal.ts          # ONLY constructor
├── create-signal.ts   # ONLY factory
```

### 4. No Type Compromises

❌ **FORBIDDEN:**
- `any` types
- `unknown` without guards
- Missing type annotations

✅ **REQUIRED:**
- Full type safety
- Type guards for unknown
- Explicit interfaces

### 5. File Naming: kebab-case ONLY

❌ **FORBIDDEN:**
- `Signal.ts`
- `createSignal.ts`
- `mockRuntime.ts`

✅ **REQUIRED:**
- `signal.ts`
- `create-signal.ts`
- `mock-runtime.ts`

---

## 🎯 Your Working Process

### Phase 1: Setup (30 min)

1. **Read all context files:**
   - [ ] This prompt (you're here)
   - [ ] `packages/pulsar-transformer/src/testing/README.md`
   - [ ] `packages/pulsar-transformer/README.md`
   - [ ] `.github/00-CRITICAL-RULES.md`

2. **Understand the codebase:**
   - [ ] Read `packages/pulsar-ui.dev/src/main.psr`
   - [ ] List all test-*.psr files
   - [ ] Understand bootstrapApp() function

3. **Set up testing script:**
   - Create `test-runner-script.ts` in pulsar-transformer
   - Import PSR Test Runner
   - Set up file reading logic

### Phase 2: Feature Testing (3-5 hours)

**For EACH feature category:**

1. **Find test files** that use the feature
2. **Extract PSR source** from those files
3. **Create test cases** for PSR Test Runner
4. **Run tests** and capture results
5. **Document issues** immediately if test fails

**Example workflow:**

```typescript
// Testing signals
const signalTests = [
  {
    description: 'Basic signal creation and read',
    source: `
      component SignalTest() {
        const [count] = signal(0);
        return <div>{count()}</div>;
      }
    `,
    expectedDOM: [{ selector: 'div', textContent: '0' }]
  },
  // ... more signal tests
];

for (const test of signalTests) {
  const result = await runner.runTest(test);
  if (!result.passed) {
    documentIssue({
      feature: 'Signals',
      test: test.description,
      errors: result.errors,
      transformedCode: result.transformedCode
    });
  }
}
```

### Phase 3: Issue Analysis (2-3 hours)

**For EACH documented issue:**

1. **Identify the phase** where it breaks:
   - Lexer? (tokenization)
   - Parser? (AST creation)
   - Analyzer? (semantic analysis)
   - Transform? (code generation)
   - Emitter? (output formatting)
   - Runtime? (execution)

2. **Find the source file:**
   ```
   packages/pulsar-transformer/src/
   ├── lexer/        # Phase 1
   ├── parser/       # Phase 2
   ├── analyzer/     # Phase 3
   ├── transform/    # Phase 4
   └── emitter/      # Phase 5
   ```

3. **Trace the bug:**
   - Add logging
   - Check AST structure
   - Verify token types
   - Compare expected vs actual

### Phase 4: Fixing (variable time)

**For EACH issue to fix:**

1. **Create a branch** (if using git)
2. **Write failing test** in transformer test suite
3. **Fix the bug** in appropriate phase file
4. **Run all tests** to ensure no regression
5. **Update documentation** if needed
6. **Mark issue as fixed** in TESTING-ISSUES.md

### Phase 5: Validation (1-2 hours)

1. **Re-run all tests** that previously failed
2. **Run full test suite** of transformer
3. **Test in actual browser** with pulsar-ui.dev
4. **Verify no regressions** in existing features
5. **Update TESTING-ISSUES.md** with final status

---

## 📊 Success Criteria

Your testing is complete when:

- [x] **ALL 14 feature categories** validated
- [x] **Every test-*.psr file** in pulsar-ui.dev tested
- [x] **main.psr bootstrapper** works end-to-end
- [x] **All issues documented** in TESTING-ISSUES.md
- [x] **Critical issues fixed** (transformation failures)
- [x] **No regressions** introduced
- [x] **Test coverage** added for fixes
- [x] **Documentation updated** with findings

### Metrics to Report

At the end, provide:

```markdown
## Testing Summary

**Date:** [DATE]  
**Duration:** [HOURS]  
**Agent:** AI Testing Agent  

### Coverage
- ✅ Features tested: X/14
- ✅ PSR files tested: X/Y
- ✅ Test cases run: X
- ✅ Test cases passed: X
- ❌ Test cases failed: X

### Issues Found
- Critical: X
- High: X
- Medium: X
- Low: X

### Issues Fixed
- Critical: X/X
- High: X/X
- Medium: X/X
- Low: X/X

### Transformer Health
- Lexer: ✅ | ❌ [details]
- Parser: ✅ | ❌ [details]
- Analyzer: ✅ | ❌ [details]
- Transform: ✅ | ❌ [details]
- Emitter: ✅ | ❌ [details]

### Recommendations
1. [Priority fixes needed]
2. [Architecture improvements]
3. [Test coverage gaps]
```

---

## 🔧 Useful Commands

### Testing Commands

```bash
# Run transformer tests
cd packages/pulsar-transformer
npm test

# Run specific test file
npm test -- run-test.test.ts

# Run with coverage
npm test -- --coverage

# Build transformer
npm run build

# Watch mode
npm run dev
```

### Development Server

```bash
# Start pulsar-ui.dev server
cd packages/pulsar-ui.dev
npm run dev

# Open browser to http://localhost:5173
# Check console for transformation errors
```

### Debugging

```bash
# Enable verbose transformer logs
export DEBUG=pulsar:transformer

# Run with debug
npm run dev -- --debug

# Check transformed output
cat packages/pulsar-ui.dev/src/.pulsar-cache/main.psr.ts
```

---

## 📚 Additional Resources

### Documentation to Read

1. **Transformer Architecture:**
   - `packages/pulsar-transformer/README.md`
   - `packages/pulsar-transformer/docs/architecture.md`

2. **PSR Syntax:**
   - `packages/pulsar-transformer/docs/psr-syntax.md`
   - `docs/pulsar/PSR-LANGUAGE-SPEC.md`

3. **Registry Pattern:**
   - `docs/architecture/REGISTRY-PATTERN.md`

4. **Critical Rules:**
   - `.github/00-CRITICAL-RULES.md`
   - `.github/01-ARCHITECTURE-PATTERNS.md`

### Example Files

- `packages/pulsar-transformer/src/testing/examples/comprehensive-demo.ts`
- `packages/pulsar-ui.dev/src/test-comprehensive-new.psr`
- `packages/pulsar-ui.dev/src/test-advanced.psr`

---

## 🎬 Getting Started Checklist

Before you begin testing:

- [ ] Read this entire document
- [ ] Read PSR Test Runner README
- [ ] Read Critical Rules
- [ ] Understand Pulsar architecture
- [ ] Set up testing environment
- [ ] Create TESTING-ISSUES.md document
- [ ] Familiarize with main.psr structure
- [ ] Review existing test-*.psr files
- [ ] Plan testing order (start with basics)
- [ ] Set up logging/debugging

**Then start with Phase 1: Setup**

---

## 🤝 Communication

### What to Report

**After each testing session:**
1. Features tested
2. Issues found (with IDs)
3. Issues fixed
4. Blockers encountered
5. Next steps

**Format:**
```
Session Report - [DATE]
- Tested: [Features]
- Found: Issue #X, #Y, #Z
- Fixed: Issue #A
- Blocker: [If any]
- Next: [Plan]
```

### When to Ask for Help

- Unclear transformer architecture
- Can't locate bug source
- Breaking change needed
- Multiple related issues
- Architectural decision required

---

## ⚠️ Important Reminders

1. **NO SHORTCUTS** - Test everything thoroughly
2. **DOCUMENT IMMEDIATELY** - Don't skip issue docs
3. **ONE ITEM PER FILE** - Follow codebase rules
4. **PROTOTYPE PATTERN** - Use constructor functions
5. **kebab-case** - All file names
6. **TYPE SAFETY** - No `any` types
7. **TEST BEFORE FIX** - Write failing test first
8. **NO REGRESSIONS** - Run full suite after fixes
9. **PRECISION** - Exact line numbers, error messages
10. **COMPLETENESS** - All 14 feature categories

---

**Good luck! Be thorough, be precise, document everything.**

---

**Version:** 1.0.0  
**Created:** 2026-02-07  
**Maintainer:** Tadeo (binaryjack)  
**AI Agent:** Testing & Transformer Fix Agent
