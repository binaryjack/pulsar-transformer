# AI Agent Quick Reference Card

**For:** PSR Transformer Testing Agent  
**Read This:** Before starting, bookmark this page  

---

## 🎯 Your Mission (30 seconds)

Test ALL Pulsar features → Find bugs → Document precisely → Fix issues → No shortcuts

**Start here:** [`AI-AGENT-TESTING-PROMPT.md`](./AI-AGENT-TESTING-PROMPT.md)  
**Track issues:** [`../../TESTING-ISSUES.md`](../../TESTING-ISSUES.md)  

---

## ⚡ Quick Start (5 minutes)

1. Read [`AI-AGENT-TESTING-PROMPT.md`](./AI-AGENT-TESTING-PROMPT.md) (10 min)
2. Read [`HANDOFF-DOCUMENTATION.md`](./HANDOFF-DOCUMENTATION.md) (5 min)
3. Run: `cd packages/pulsar-transformer && pnpm test`
4. Create: `test-runner-script.ts`
5. Begin: Phase 1 - Setup

---

## 📐 Architecture (1 minute)

### Transformation Pipeline
```
PSR Source → Lexer → Parser → Analyzer → Transform → Emitter → TypeScript → Browser
```

### Key Concepts
- **PSR** = Pulsar Syntax (like JSX but for Pulsar)
- **Signals** = Reactive primitives (like React useState)
- **$REGISTRY** = Component lifecycle manager
- **t_element** = SSR-aware element creation

### Example Transformation
```psr
component Counter() {
  const [count, setCount] = signal(0);
  return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
}
```
↓ Transforms to:
```typescript
export function Counter(): HTMLElement {
  return $REGISTRY.execute('component:Counter', () => {
    const [count, setCount] = createSignal(0);
    return t_element('button', { onClick: () => setCount(count() + 1) }, [count()]);
  });
}
```

---

## 🧪 PSR Test Runner (2 minutes)

### Import
```typescript
import { createPSRTestRunner } from '@pulsar-framework/transformer/testing';
```

### Basic Test
```typescript
const runner = createPSRTestRunner({ verbose: true });

const result = await runner.runTest({
  description: 'Test description',
  source: `component Test() { return <div>Hello</div>; }`,
  expectedDOM: [{ selector: 'div', textContent: 'Hello' }]
});

console.log(result.passed ? '✓' : '✗', result.description);
```

### With Reactivity
```typescript
const result = await runner.runTest({
  description: 'Counter increments',
  source: `
    component Counter() {
      const [count, setCount] = signal(0);
      return <span class="count">{count()}</span>;
    }
  `,
  expectedDOM: [{ selector: '.count', textContent: '0' }],
  reactivityTests: [{
    signalName: 'count',
    newValue: 5,
    expectedDOM: [{ selector: '.count', textContent: '5' }]
  }]
});
```

### With Events
```typescript
reactivityTests: [{
  description: 'Button click',
  selector: 'button',
  eventType: 'click',
  afterEvent: { signalName: 'count', expectedValue: 1 }
}]
```

---

## ✅ 14 Features to Test

### Quick Checklist

1. [ ] **Signals** - `signal(0)`, read `count()`, write `setCount(5)`
2. [ ] **Effects** - `effect(() => { ... })`, runs on signal change
3. [ ] **Computed** - `computed(() => a() + b())`, memoization
4. [ ] **JSX Elements** - `<div>`, `<button>`, self-closing
5. [ ] **Attributes** - `class`, `data-*`, `aria-*`, boolean
6. [ ] **Events** - `onClick`, `onInput`, `onChange`
7. [ ] **Conditionals** - `{show() && <div />}`, ternary
8. [ ] **Lists** - `items().map(i => <li>{i}</li>)`
9. [ ] **Components** - `<Counter />`, nesting, composition
10. [ ] **Props** - `({ name, age })`, defaults, spreading
11. [ ] **TypeScript** - interfaces, types, generics
12. [ ] **Advanced** - async/await, generators, decorators
13. [ ] **Registry** - `$REGISTRY.execute()` wrapping
14. [ ] **Errors** - try-catch, helpful messages

---

## 📋 Issue Documentation (30 seconds)

### Quick Template

```markdown
## Issue #N: [Short title]

**Severity:** Critical/High/Medium/Low  
**Status:** Open/In Progress/Fixed  
**Feature:** [Category]  

**PSR:** `const [x] = signal(0);`  
**Expected:** `const [x] = createSignal(0);`  
**Actual:** [What you got]  
**Error:** [Exact message]  
**Phase:** Lexer/Parser/Analyzer/Transform/Emitter  
**Fix:** [What to change]  
```

### Severity Guide
- **Critical** = Transformation fails, core features broken
- **High** = Features don't work, reactivity broken
- **Medium** = Edge cases, suboptimal output
- **Low** = Cosmetic, nice-to-have

---

## 🔴 Critical Rules (NON-NEGOTIABLE)

1. ✅ **Declarative components ONLY** - No useImperativeHandle
2. ✅ **Prototype-based classes** - No `class` keyword
3. ✅ **One item per file** - Strict separation
4. ✅ **No `any` types** - Full type safety
5. ✅ **kebab-case files** - e.g., `create-signal.ts`

---

## 📁 File Locations

### Testing Framework
```
packages/pulsar-transformer/src/testing/
├── AI-AGENT-TESTING-PROMPT.md    ← YOUR MAIN INSTRUCTIONS
├── HANDOFF-DOCUMENTATION.md       ← Context and workflow
├── README.md                      ← API reference
├── psr-test-runner.types.ts       ← Type definitions
├── create-psr-test-runner.ts      ← Factory function
└── examples/comprehensive-demo.ts ← Usage examples
```

### Test Files to Analyze
```
packages/pulsar-ui.dev/src/
├── main.psr                       ← BOOTSTRAPPER (START HERE)
├── test-comprehensive-new.psr     ← Comprehensive tests
├── test-advanced.psr              ← Advanced features
├── test-edge-cases.psr            ← Edge cases
└── test-*.psr                     ← All test files
```

### Issue Tracking
```
packages/pulsar-transformer/
└── TESTING-ISSUES.md              ← DOCUMENT ALL ISSUES HERE
```

### Transformer Source (To Fix)
```
packages/pulsar-transformer/src/
├── lexer/          ← Phase 1: Tokenization
├── parser/         ← Phase 2: AST creation
├── analyzer/       ← Phase 3: Semantic analysis
├── transform/      ← Phase 4: Code generation
└── emitter/        ← Phase 5: Output formatting
```

---

## 🔧 Essential Commands

### Testing
```bash
cd packages/pulsar-transformer
pnpm test                    # Run all tests
pnpm test -- run-test        # Run specific test
pnpm test -- --coverage      # With coverage
```

### Development
```bash
cd packages/pulsar-ui.dev
pnpm run dev                 # Start dev server (localhost:5173)
# Check browser console for transformation errors
```

### Debugging
```bash
export DEBUG=pulsar:transformer  # Enable verbose logs
node --inspect test-script.ts    # Debug mode
```

---

## 🎯 Success Criteria

**You're done when:**

- [x] All 14 feature categories tested
- [x] Every test-*.psr file analyzed
- [x] main.psr bootstrapper works
- [x] All issues documented in TESTING-ISSUES.md
- [x] Critical issues fixed
- [x] No regressions
- [x] Final report generated

**Report format:**
```
Coverage: 14/14 features
Tests: X run, Y passed, Z failed
Issues: X found (N critical, M high, P medium, Q low)
Fixed: X/X critical, Y/M high
Transformer: [phase-by-phase health]
Recommendations: [prioritized list]
```

---

## ⚡ 5-Phase Workflow

```
Phase 1: Setup (30 min)
   │ Read docs, understand architecture, create test script
   ↓
Phase 2: Feature Testing (3-5 hours)
   │ Test all 14 categories, document issues immediately
   ↓
Phase 3: Issue Analysis (2-3 hours)
   │ Identify phases, locate bugs, trace root causes
   ↓
Phase 4: Fixing (variable)
   │ Write failing tests, implement fixes, verify no regressions
   ↓
Phase 5: Validation (1-2 hours)
   │ Re-test everything, confirm fixes, generate report
```

---

## 💡 Pro Tips

### Testing
- Start with simple features (Signals, JSX)
- Move to complex (Events, Reactivity)
- Test edge cases last
- Document as you go (don't batch)

### Issue Finding
- Check transformed code first
- Look for missing imports
- Verify $REGISTRY wrapping
- Check signal → createSignal conversion
- Validate t_element calls

### Debugging
- Add `console.log` in transformer phases
- Check AST structure with `.toString()`
- Compare working vs broken examples
- Use VSCode debugger with breakpoints

### Fixing
1. Write failing test FIRST
2. Run test (should fail)
3. Implement fix
4. Run test again (should pass)
5. Run ALL tests (no regressions)
6. Test in browser
7. Document fix in TESTING-ISSUES.md

---

## 🚨 Common Pitfalls

❌ **Don't:**
- Skip documenting issues
- Fix without tests
- Batch completions
- Use shortcuts or MVPs
- Ignore critical rules
- Create regressions

✅ **Do:**
- Document immediately
- Test before fixing
- Update progress tables
- Follow prototype pattern
- Use kebab-case names
- Run regression tests

---

## 📞 When Stuck

### Can't Find Bug?
1. Check which phase fails (add logs)
2. Examine AST at each phase
3. Compare with working example
4. Search for similar patterns
5. Ask for help (document what you tried)

### Test Failing?
1. Verify PSR syntax is correct
2. Check expected vs actual output
3. Validate DOM selectors
4. Confirm signal names match
5. Check browser console

### Transformation Error?
1. Identify the phase (error message)
2. Look at token stream (lexer)
3. Check AST structure (parser)
4. Verify semantic analysis (analyzer)
5. Inspect code generation (transform)
6. Review output formatting (emitter)

---

## 📚 Key Documents

| Document | Purpose | Time |
|----------|---------|------|
| [AI-AGENT-TESTING-PROMPT.md](./AI-AGENT-TESTING-PROMPT.md) | Main instructions | 10 min |
| [HANDOFF-DOCUMENTATION.md](./HANDOFF-DOCUMENTATION.md) | Context & workflow | 5 min |
| [README.md](./README.md) | API reference | As needed |
| [../../TESTING-ISSUES.md](../../TESTING-ISSUES.md) | Issue tracking | Ongoing |
| `.github/00-CRITICAL-RULES.md` | Code rules | 2 min |

---

## 🎬 First Steps (Right Now)

1. ✅ You're reading this (good start!)
2. → Open [`AI-AGENT-TESTING-PROMPT.md`](./AI-AGENT-TESTING-PROMPT.md)
3. → Scroll to "Getting Started Checklist"
4. → Begin Phase 1: Setup
5. → Start testing!

---

**Remember:** NO SHORTCUTS. Document everything. Test thoroughly. Fix carefully.

**Good luck! 🚀**

---

**Version:** 1.0.0  
**Created:** 2026-02-07  
**Purpose:** Quick reference for AI Testing Agent
