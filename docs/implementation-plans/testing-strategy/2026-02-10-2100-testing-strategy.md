# Testing Strategy for Pulsar Transformer

**Date:** 2026-02-10 21:00  
**Approach:** B+ (Hybrid with Real PSR Fixtures)  
**Status:** Infrastructure complete, ready for implementation

---

## Decision

**Approved approach:** Fixture-driven testing with real PSR files from pulsar-ui.dev

**Rationale:**

- 94 existing PSR files = real requirements
- Manual expected outputs = EXACT transformation spec
- Binary verification (works/doesn't work)
- Incremental complexity (simple → complex)
- No BS claims possible

---

## Golden Test Cases

### Test 1: counter.psr (Basic Reactivity)

**Input:** Component with signals, event handlers, reactive JSX  
**Output:** Function with $REGISTRY.execute, t_element calls, signal preservation

**Features tested:**

- `component` keyword → function
- `createSignal()` preservation
- `{count()}` reactive expression
- `onClick={fn}` event handlers
- Basic JSX structure → `t_element()`

---

### Test 2: badge.psr (Static Component)

**Input:** Function component with props, conditional rendering  
**Output:** Function with $REGISTRY.execute, static JSX transformation

**Features tested:**

- Function component (no `component` keyword)
- Props destructuring
- Default parameters
- Conditional rendering (`icon && <span>`)
- External function calls (`cn()`)

---

### Test 3: drawer.psr (Complex Component)

**Input:** Component with useEffect, lifecycle, early returns  
**Output:** Function with effect preservation, lifecycle handling

**Features tested:**

- `useEffect()` preservation
- Cleanup functions
- Early returns
- Complex JSX nesting
- Children handling
- Event listeners

---

## Test Infrastructure

**Created:**

```
tests/
  fixtures/
    real-psr/
      01-counter.psr
      02-badge.psr
      03-drawer.psr
    expected-output/
      01-counter.expected.ts
      02-badge.expected.ts
      03-drawer.expected.ts
    README.md
  integration/
    full-pipeline.test.ts
```

**Test execution:**

1. Read PSR input
2. Transform via pipeline
3. Normalize whitespace
4. Compare with expected
5. Binary pass/fail

---

## Implementation Order

**Phase 1: Make Test 1 Pass (counter.psr)**

- Build basic lexer (tokens)
- Build basic parser (AST)
- Build component transformer
- Build JSX transformer
- Build code emitter
- Run test: `vitest tests/integration/full-pipeline.test.ts`

**Phase 2: Make Test 2 Pass (badge.psr)**

- Add conditional rendering
- Handle function components
- Preserve external calls

**Phase 3: Make Test 3 Pass (drawer.psr)**

- Add effect preservation
- Handle early returns
- Complex JSX handling

**Phase 4: Expand Coverage**

- Add more PSR files from pulsar-ui.dev
- Test edge cases
- Performance tests

---

## Success Metrics

**Binary criteria:**

- ✅ Test passes = transformer works
- ❌ Test fails = transformer doesn't work

**No gray area:**

- Output matches expected OR it doesn't
- No "almost works"
- No "looks correct"
- No assumptions

---

## Next Steps

1. ✅ Test infrastructure created
2. **Next:** Begin Phase 1 implementation (Lexer)
3. Create implementation plan for Lexer phase
4. Implement until Test 1 passes

---

**Files created:**

- 3 PSR test fixtures
- 3 expected TypeScript outputs
- Integration test file
- Fixture documentation

**Ready for implementation.**
