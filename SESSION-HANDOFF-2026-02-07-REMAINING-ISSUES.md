# AI Agent Handoff - PSR Transformer Remaining Issues

**⚠️ THIS IS THE LATEST HANDOFF DOCUMENT - START HERE ⚠️**

**Handoff Date:** 2026-02-07 12:15 UTC  
**From:** AI Agent Session (Analysis & Issue #1 Verification)  
**To:** Next AI Agent (Fix Remaining Transformer Issues)  
**Status:** ✅ Issue #1 Fixed | ❌ ~200 Tests Still Failing | 🎯 Full Implementation Required

**Previous Handoff Documents (Historical Context):**

- `SESSION-HANDOFF-2026-02-07-PART2.md` - Issue #1 fix attempts
- `SESSION-HANDOFF-2026-02-07-PART3.md` - May exist with additional context

---

## 🚨 MANDATORY READING - DO THIS FIRST

**BEFORE YOU WRITE A SINGLE LINE OF CODE:**

### 1. Read Codebase Rules (NON-NEGOTIABLE)

```
.github/copilot-instructions.md
```

**This file contains links to ALL rules. Read them in this order:**

1. **`00-CRITICAL-RULES.md`** (2 min) - Zero-tolerance rules
2. **`01-ARCHITECTURE-PATTERNS.md`** (5 min) - Prototype-based patterns
3. **`03-QUICK-REFERENCE.md`** (3 min) - Boilerplate and patterns
4. **`02-WORKFLOW-PROCESS.md`** (as needed) - Implementation workflow
5. **`05-TESTING-STANDARDS.md`** (as needed) - Testing requirements

**Total reading time: 10-15 minutes. DO IT.**

---

## 🔥 THE RULES - ZERO EXCEPTIONS

### Critical Behavior Rules:

1. **❌ NO SHORTCUTS** - No stubbing, no placeholders, no "TODO" comments
2. **❌ NO MVP MINDSET** - Full, proper, complete implementation ONLY
3. **❌ NO CLAIMS WITHOUT PROOF** - Test it. Verify it. Then claim it works.
4. **❌ NO BULLSHIT** - If you don't know, say so. If it's broken, admit it.
5. **✅ VERIFY EVERYTHING** - Run tests. Check output. Prove your claims.
6. **✅ FOLLOW PATTERNS** - Prototype-based classes. One item per file. Type safety.
7. **✅ TEST FIRST** - Write/fix tests alongside implementation

### Why These Rules Exist:

**Context:** Tadeo has been paralyzed for weeks/months because previous AI agents claimed things were "fixed" when they weren't. This caused:

- Broken PSR transformations
- Components crashing on render
- Infinite loops from lost data
- Wasted hours debugging generated code
- Complete loss of trust in the transformer

**Your job:** Fix the remaining issues COMPLETELY. Make the transformer RELIABLE. Restore trust.

---

## ✅ WHAT'S ALREADY FIXED

### Issue #1: Object/Array Signal Arguments - VERIFIED WORKING ✅

**Problem (WAS):**

```typescript
// Input PSR:
const user = signal({ name: 'Alice' });
const items = signal([1, 2, 3]);

// Old broken output:
const [user] = createSignal(); // ❌ Object lost
const [items] = createSignal(); // ❌ Array lost

// Result: Crashes with "Cannot read properties of undefined"
```

**Solution (NOW):**

```typescript
// Current correct output:
const [user] = createSignal({ name: 'Alice' }); // ✅ Object preserved
const [items] = createSignal([1, 2, 3]); // ✅ Array preserved
```

**Verification:**

```powershell
cd packages/pulsar-transformer
npx tsx quick-test.mjs
# Output: 4/4 passed ✅
```

**Files Modified (by previous agents):**

- `src/analyzer/prototype/analyze-expression.ts` - Added ObjectExpression/ArrayExpression handling
- `src/analyzer/prototype/index.ts` - Registered new analyzer methods
- `src/analyzer/analyzer.types.ts` - Added type declarations
- `src/emitter/prototype/emit-expression.ts` - Added recursive emission for objects/arrays
- `src/testing/prototype/execute-in-dom.ts` - Fixed component extraction from transformed code

**What This Fixed:**

- ✅ Basic signal transformations (number, string, object, array)
- ✅ DOM execution without crashes
- ✅ Property access on signal values
- ✅ Core PSR component rendering

**This is THE critical blocker - it's now resolved.**

---

## ❌ WHAT'S STILL BROKEN - YOUR RESPONSIBILITY

### Test Suite Status:

```
Total Test Files: ~95
Passing: ~55 files
Failing: ~40 files (~200 individual tests)
```

### Categories of Failures:

#### 1. **Parser - Advanced TypeScript Features** (High Priority)

**Failing Areas:**

- Yield expressions (9 tests) - Generator functions
- Await expressions (7 tests) - Async/await
- Decorators (9 tests) - Class/method decorators
- Enums (3 tests) - TypeScript enums
- Namespaces (3 tests) - TypeScript namespaces

**Why It Matters:**
Real-world TypeScript code uses these features. The parser must handle them.

**Files Affected:**

- `src/parser/prototype/__tests__/parse-yield-expression.test.ts`
- `src/parser/prototype/__tests__/parse-await-expression.test.ts`
- `src/parser/__tests__/integration/real-world-advanced.test.ts`
- `src/parser/__tests__/integration/real-world-enum.test.ts`
- `src/parser/__tests__/integration/real-world-namespace.test.ts`

**Example Failure:**

```typescript
// Input:
async function fetchUser() {
  const response = await fetch('/api/user');
  return response.json();
}

// Error: Cannot read properties of undefined (reading 'type')
// Root cause: Await expression parser not implemented correctly
```

---

#### 2. **Parser - Control Flow Statements** (High Priority)

**Failing Areas:**

- Try/catch/finally statements (10 tests)
- Switch/case statements (11 tests)
- For/while loops (16 tests)
- Throw statements (13 tests)

**Why It Matters:**
Error handling and control flow are fundamental. PSR components will use these.

**Files Affected:**

- `src/parser/prototype/__tests__/parse-try-statement.test.ts`
- `src/parser/prototype/__tests__/parse-switch-statement.test.ts`
- `src/parser/prototype/__tests__/parse-loop-statements.test.ts`
- `src/parser/prototype/__tests__/parse-flow-control.test.ts`
- `src/parser/__tests__/integration/real-world-control-flow.test.ts`

**Example Failure:**

```typescript
// Input:
try {
  const data = riskyOperation();
} catch (error) {
  console.error(error);
} finally {
  cleanup();
}

// Error: "Try statement must have at least a catch or finally clause"
// Root cause: Parser not recognizing finally block correctly
```

---

#### 3. **Parser - JSX Fragments** (Critical for UI)

**Failing Areas:**

- JSX fragments (13 tests) - `<>...</>` syntax
- Fragment closing tags
- Nested fragments

**Why It Matters:**
React/JSX fragments are ESSENTIAL for PSR UI components. Without this, developers can't write clean JSX.

**Files Affected:**

- `src/parser/__tests__/parse-jsx-fragment.test.ts`

**Example Failure:**

```typescript
// Input:
function Component() {
  return (
    <>
      <div>First</div>
      <div>Second</div>
    </>
  );
}

// Error: Expected "<" for fragment closing (found EOF)
// Root cause: Fragment parser incomplete
```

---

#### 4. **Type System** (Medium Priority)

**Failing Areas:**

- Union types (6 tests) - `string | number`
- Type aliases (22 tests) - Literal types
- Generic types (2 tests) - `Array<T>`, `Generic<Base>`

**Why It Matters:**
TypeScript type preservation is a core feature. Types must survive transformation.

**Files Affected:**

- `src/__tests__/union-types-e2e.test.ts`
- `src/parser/prototype/__tests__/parse-type-alias.test.ts`
- `src/parser/prototype/__tests__/parse-interface-declaration.test.ts`

**Example Failure:**

```typescript
// Input:
type Status = 'active' | 'inactive' | 'pending';
const value: string | number = 42;

// Expected output: Types preserved
// Actual output: Types stripped/mangled
// Error: expected 'const value = 42;' to contain 'string | number'
```

---

#### 5. **Export System** (Low Priority but Important)

**Failing Areas:**

- Default exports (3 tests) - `export default Component`
- Export tracking/analysis

**Why It Matters:**
Proper module exports are required for component libraries.

**Files Affected:**

- `src/__tests__/export-e2e.test.ts`
- `src/analyzer/prototype/__tests__/analyze-export.test.ts`
- `src/emitter/prototype/__tests__/emit-export.test.ts`

**Example Failure:**

```typescript
// Input:
export default function MyComponent() { ... }

// Expected: export default MyComponent;
// Actual: export {}; (empty export)
```

---

#### 6. **Import System** (Low Priority)

**Failing Areas:**

- Side-effect imports (1 test) - `import './styles.css'`
- Import metadata tracking (2 tests)

**Files Affected:**

- `src/emitter/prototype/__tests__/emit-import.test.ts`
- `src/analyzer/__tests__/import-analysis.test.ts`

---

#### 7. **Lexer Issues** (Minor)

**Failing:**

- Line/column tracking (1 test)

**File:**

- `src/parser/lexer/__tests__/lexer.test.ts`

---

#### 8. **Pipeline Integration** (Critical for E2E)

**Failing Areas:**

- Pipeline integration tests (12 tests)
- End-to-end transformation scenarios

**Files Affected:**

- `src/pipeline/__tests__/pipeline.test.ts`

**Why It Matters:**
These tests verify the ENTIRE transformation pipeline working together. If these fail, real-world usage will fail.

---

## 🏗️ ARCHITECTURE OVERVIEW - UNDERSTAND THIS

### Transformation Pipeline (How It Works):

```
Input PSR Code
    ↓
[1] LEXER: Tokenize source → Token stream
    ↓
[2] PARSER: Build AST → Abstract Syntax Tree
    ↓
[3] ANALYZER: Generate IR → Intermediate Representation
    ↓
[4] TRANSFORMER: Optimize IR → Reactivity transformation
    ↓
[5] EMITTER: Generate TypeScript → Output code
    ↓
[6] VALIDATOR: Check output → Validation results
    ↓
Output TypeScript Code
```

### Key Files (Read These):

**Parser:**

- `src/parser/parser.types.ts` - AST node definitions
- `src/parser/prototype/parser.ts` - Main parser class
- `src/parser/prototype/parse-*.ts` - Individual parsers for each construct

**Analyzer:**

- `src/analyzer/analyzer.types.ts` - IR definitions
- `src/analyzer/prototype/index.ts` - Main analyzer
- `src/analyzer/prototype/analyze-*.ts` - Individual analyzers

**Emitter:**

- `src/emitter/emitter.types.ts` - Emitter types
- `src/emitter/prototype/index.ts` - Main emitter
- `src/emitter/prototype/emit-*.ts` - Individual emitters

**Lexer:**

- `src/parser/lexer/lexer.ts` - Tokenization

**Pipeline:**

- `src/pipeline/pipeline.ts` - Orchestrates the entire flow

### Prototype-Based Pattern (MANDATORY):

All classes in this codebase use **prototype-based patterns** (NO `class` keyword in implementation):

```typescript
// ❌ FORBIDDEN:
class Parser {
  parse() { ... }
}

// ✅ REQUIRED:
function Parser() {
  // Constructor
}

Parser.prototype.parse = function() {
  // Implementation
};

// OR modern equivalents that compile to prototype:
export const Parser = Object.assign(
  function Parser() { /* constructor */ },
  {
    parse() { /* implementation */ }
  }
);
```

**Read `.github/01-ARCHITECTURE-PATTERNS.md` for complete details.**

---

## 🎯 YOUR MISSION - STEP BY STEP

### Phase 1: Understand & Verify (1-2 hours)

1. **Read ALL required documentation** (`.github/copilot-instructions.md` and linked files)
2. **Run the quick test** to verify Issue #1 is fixed:
   ```powershell
   cd packages/pulsar-transformer
   npx tsx quick-test.mjs
   # Should show: 4/4 passed
   ```
3. **Run full test suite** to see all failures:
   ```powershell
   npm test
   # Note all failing test categories
   ```
4. **Read the architecture files** listed above
5. **Understand the pipeline** - trace through one transformation manually

### Phase 2: Fix Parser Issues (High Priority)

**Start with control flow (most impactful):**

1. **Try/Catch/Finally Statements**
   - File: `src/parser/prototype/parse-try-statement.ts`
   - Tests: `src/parser/prototype/__tests__/parse-try-statement.test.ts`
   - Fix finally block recognition
   - Ensure catch/finally clause validation works

2. **Switch/Case Statements**
   - File: `src/parser/prototype/parse-switch-statement.ts`
   - Tests: `src/parser/prototype/__tests__/parse-switch-statement.test.ts`
   - Fix case clause parsing
   - Handle default case correctly

3. **Loop Statements**
   - File: `src/parser/prototype/parse-loop-statements.ts`
   - Tests: `src/parser/prototype/__tests__/parse-loop-statements.test.ts`
   - Fix for/while/do-while parsing
   - Handle complex loop headers

4. **JSX Fragments**
   - File: `src/parser/parse-jsx.ts` or relevant JSX parser
   - Tests: `src/parser/__tests__/parse-jsx-fragment.test.ts`
   - Implement fragment opening `<>`
   - Implement fragment closing `</>`
   - Handle nested fragments

**Then async/await features:**

5. **Await Expressions**
   - File: `src/parser/prototype/parse-await-expression.ts`
   - Tests: `src/parser/prototype/__tests__/parse-await-expression.test.ts`

6. **Yield Expressions**
   - File: `src/parser/prototype/parse-yield-expression.ts`
   - Tests: `src/parser/prototype/__tests__/parse-yield-expression.test.ts`

### Phase 3: Fix Type System (Medium Priority)

7. **Union Types**
   - Files: Analyzer + Emitter for type handling
   - Tests: `src/__tests__/union-types-e2e.test.ts`
   - Ensure types are preserved through pipeline

8. **Type Aliases**
   - File: `src/parser/prototype/parse-type-alias.ts`
   - Tests: `src/parser/prototype/__tests__/parse-type-alias.test.ts`
   - Fix literal type parsing

### Phase 4: Fix Export/Import System (Lower Priority)

9. **Default Exports**
   - Files: Parser → Analyzer → Emitter for exports
   - Tests: All export-related test files
   - Track default vs named correctly

10. **Side-effect Imports**
    - Files: Import emitter
    - Tests: Import emission tests

### Phase 5: Integration Testing

11. **Pipeline Integration Tests**
    - File: `src/pipeline/__tests__/pipeline.test.ts`
    - Run real-world scenarios end-to-end
    - Verify transformer handles complex code

### Phase 6: Real-World Validation

12. **Test with actual PSR components**
    - Use real component code from `packages/pulsar-formular-ui`
    - Transform and execute in DOM
    - Verify no crashes, no infinite loops
    - Verify correct reactivity

---

## 🧪 TESTING REQUIREMENTS

### For Every Fix:

1. **Write/fix the test FIRST**
2. **Verify test fails** (proves it's testing the right thing)
3. **Implement the fix**
4. **Verify test passes**
5. **Run related tests** (not just the one test)
6. **Run full suite** periodically to catch regressions

### Test Commands:

```powershell
# Quick validation (4 core tests):
npx tsx quick-test.mjs

# Full test suite:
npm test

# Specific test file:
npm test -- parse-try-statement

# Watch mode:
npm test -- --watch

# Coverage:
npm test -- --coverage
```

### Coverage Target: 95%+

From `.github/05-TESTING-STANDARDS.md`:

- Unit tests: 95%+ coverage required
- Integration tests for all major features
- E2E tests for real-world scenarios

---

## 🚫 WHAT NOT TO DO

### DO NOT:

1. **❌ Stub or mock complex logic** - Implement it properly
2. **❌ Skip tests** - Fix them or mark as TODO with explanation
3. **❌ Change test expectations to pass** - Fix the implementation
4. **❌ Use `any` types** - Proper TypeScript types required
5. **❌ Copy-paste without understanding** - Know what the code does
6. **❌ Commit code with errors** - Must compile and test
7. **❌ Claim "it works" without proof** - Run the tests, show output
8. **❌ Create half-implemented solutions** - Complete each feature fully
9. **❌ Ignore architecture patterns** - Follow prototype-based design
10. **❌ Rush** - Quality over speed. Get it RIGHT.

### DO:

1. **✅ Read the docs first** (`.github/` folder)
2. **✅ Understand before coding** - Trace through the logic
3. **✅ Follow existing patterns** - Match the codebase style
4. **✅ Write tests** - Alongside implementation
5. **✅ Verify thoroughly** - Test multiple scenarios
6. **✅ Ask questions** - If requirements are unclear
7. **✅ Document complex logic** - Comments for non-obvious code
8. **✅ Commit incrementally** - Small, tested changes
9. **✅ Run tests frequently** - Catch issues early
10. **✅ Be honest** - If stuck, say so. If broken, admit it.

---

## 📝 VERIFICATION CHECKLIST

Before claiming you're done:

### Core Functionality:

- [ ] All parser tests pass (control flow, async/await, JSX)
- [ ] All type system tests pass
- [ ] All export/import tests pass
- [ ] All pipeline integration tests pass
- [ ] Quick test shows 4/4 passing
- [ ] Full test suite passes completely

### Code Quality:

- [ ] No TypeScript errors
- [ ] No `any` types (except where absolutely necessary)
- [ ] Follows prototype-based pattern
- [ ] One item per file maintained
- [ ] Code matches existing style

### Testing:

- [ ] 95%+ coverage achieved
- [ ] All tests run and pass
- [ ] No skipped tests without justification
- [ ] Integration tests verify E2E scenarios

### Real-World:

- [ ] Tested with actual PSR component code
- [ ] Transformation produces valid JavaScript
- [ ] No crashes in DOM execution
- [ ] No infinite loops
- [ ] Reactivity works correctly

### Documentation:

- [ ] Complex logic documented
- [ ] API changes noted
- [ ] Breaking changes highlighted

---

## 🎓 KEY UNDERSTANDING FOR SUCCESS

### 1. The Pipeline Must Be Bulletproof

Every stage must handle:

- Valid input → Correct output
- Invalid input → Clear error message
- Edge cases → Graceful handling
- Real-world code → No crashes

### 2. Type Safety Is Critical

The transformer preserves TypeScript types. Losing types breaks:

- IDE autocomplete
- Type checking
- Refactoring safety
- Documentation

### 3. JSX Is Non-Negotiable

PSR is for UI components. JSX must work perfectly:

- Elements
- Fragments
- Attributes
- Children
- Expressions
- Event handlers

### 4. Async/Await Is Essential

Modern JavaScript is async. Must support:

- Async functions
- Await expressions
- Promise handling
- Error boundaries

### 5. Error Handling Is Everywhere

Real code has try/catch/finally. Must support:

- Error boundaries
- Cleanup in finally
- Re-throwing errors
- Multiple catch clauses

---

## 🔍 DEBUGGING TIPS

### When Tests Fail:

1. **Read the error message** - What exactly failed?
2. **Find the test** - What is it testing?
3. **Run just that test** - Isolate the failure
4. **Add debug logging** - Trace through the logic
5. **Check the AST** - Is parsing correct?
6. **Check the IR** - Is analysis correct?
7. **Check the output** - Is emission correct?
8. **Compare with working cases** - What's different?

### Debug Scripts Available:

```powershell
# Show transformation output:
npx tsx show-transform.mjs

# Debug single test:
npx tsx debug-test.mjs

# Check AST structure:
npx tsx debug-issue-1.mjs
```

### Add Your Own:

Create test scripts in root of `packages/pulsar-transformer/`:

```javascript
// test-my-fix.mjs
import { transform } from './dist/index.js';

const code = `
  // Your test code here
`;

const result = transform(code);
console.log('Result:', result.code);
```

---

## 📊 PROGRESS TRACKING

### Expected Timeline:

- **Phase 1 (Understanding):** 1-2 hours
- **Phase 2 (Parser fixes):** 4-8 hours
- **Phase 3 (Type system):** 2-4 hours
- **Phase 4 (Export/import):** 1-2 hours
- **Phase 5 (Integration):** 2-3 hours
- **Phase 6 (Validation):** 1-2 hours

**Total: 11-21 hours** for complete fix

### Metrics:

Track your progress:

```powershell
# Test pass rate:
npm test 2>&1 | Select-String "Test Files.*passed"

# Count failing tests:
npm test 2>&1 | Select-String "failed" | Measure-Object
```

---

## 💬 COMMUNICATION WITH USER

### Report Format:

When updating Tadeo:

1. **What you fixed** (specific, with proof)
2. **What tests now pass** (numbers and names)
3. **What remains broken** (honest assessment)
4. **Blockers encountered** (if any)
5. **Next steps** (concrete plan)

### Example Good Update:

```
✅ Fixed try/catch/finally parsing
   - All 10 tests in parse-try-statement.test.ts now pass
   - Verified with: npm test -- parse-try-statement

Current status:
   - Control flow: 10/10 ✅ (was 0/10)
   - Switch/case: Still failing 11/12
   - Total suite: 65/95 files passing (was 55/95)

Next: Fixing switch statement case clause parsing
```

### Example Bad Update:

```
❌ "I think I fixed it" - NO PROOF
❌ "Should be working now" - NOT VERIFIED
❌ "Mostly done" - VAGUE
❌ "Just need to polish" - INCOMPLETE
```

---

## 🎯 SUCCESS CRITERIA

You're DONE when:

1. **All ~200 failing tests pass** ✅
2. **No TypeScript compilation errors** ✅
3. **95%+ test coverage maintained** ✅
4. **Quick test shows 4/4 passing** ✅
5. **Real PSR components transform correctly** ✅
6. **No crashes in DOM execution** ✅
7. **No infinite loops or lost data** ✅
8. **Code follows architecture patterns** ✅
9. **Documentation is updated** ✅
10. **You can prove it all works** ✅

---

## 📚 RESOURCES

### Documentation:

- `.github/copilot-instructions.md` - Start here
- `README.md` in package root - Project overview
- `src/*/README.md` - Module-specific docs

### Test Files:

- `src/**/__tests__/**/*.test.ts` - All unit tests
- Quick tests in root for rapid validation

### Reference Code:

- Existing working parsers (e.g., `parse-expression.ts`)
- Successful transformations (Issue #1 fixes)

---

## 🔥 FINAL WORDS

**You have ONE job:** Make this transformer RELIABLE.

Tadeo has been burned too many times by AI agents claiming things work when they don't. You will NOT be that agent.

Every test must pass. Every claim must be proven. Every feature must be complete.

**No shortcuts. No bullshit. No excuses.**

Read the docs. Follow the patterns. Write the tests. Fix the bugs. Verify everything.

When you're done, the transformer will be production-ready and TRUSTWORTHY.

**That's the standard. Meet it.**

---

**Session Start:** [Timestamp when you begin]  
**Session End:** [Timestamp when you finish]  
**Total Tests Fixed:** [Your count here]  
**Final Status:** [COMPLETE / INCOMPLETE / BLOCKED]

Good luck. You'll need it. 🔥

---

## 📎 APPENDIX: Quick Test Script Results

```powershell
PS> npx tsx quick-test.mjs

=== Test Results ===
✅ Basic signal (number): PASSED
✅ String signal: PASSED
✅ Object signal: PASSED
✅ Array signal: PASSED

4/4 passed, 0 failed
```

**This proves Issue #1 is fixed. Build on this success.**
