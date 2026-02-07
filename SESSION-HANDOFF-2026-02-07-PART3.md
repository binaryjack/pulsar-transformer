# AI Agent Handoff - Test Suite Validation & Fixes

**Handoff Date:** 2026-02-07 13:00 UTC  
**From:** AI Agent Session 4 (Issue #1 Fix Complete)  
**To:** Next AI Agent (Test Suite Validation)  
**Status:** ✅ Issue #1 FIXED | ⚠️ Test Suite Has Failures | 🎯 Task: Fix ALL Remaining Test Failures

---

## 🚨 CRITICAL: READ THIS FIRST - NON-NEGOTIABLE

### MANDATORY PRE-WORK (15 minutes)

**BEFORE YOU WRITE A SINGLE LINE OF CODE:**

1. **READ:** `.github/copilot-instructions.md` - ALL files referenced:
   - `00-CRITICAL-RULES.md` (2 min)
   - `01-ARCHITECTURE-PATTERNS.md` (5 min)
   - `02-WORKFLOW-PROCESS.md` (skim as needed)
   - `03-QUICK-REFERENCE.md` (3 min)

2. **READ:** This entire handoff document (10 min)

3. **UNDERSTAND:** The rules below are **ABSOLUTE**

---

## ⚠️ ABSOLUTE RULES - ZERO TOLERANCE

### Rule #1: NO SHORTCUTS

❌ **FORBIDDEN:**
- Stubbing functionality
- Placeholder implementations
- "TODO" comments
- "We'll fix this later"
- MVP mindset
- Partial implementations

✅ **REQUIRED:**
- Full, complete implementations
- All edge cases handled
- Proper error handling
- Complete test coverage
- Production-ready code

### Rule #2: NO BULLSHIT

❌ **FORBIDDEN:**
- Claiming tests pass when they don't
- Assuming code works without verification
- Guessing at solutions
- Making excuses for failures
- Skipping verification steps

✅ **REQUIRED:**
- Run tests BEFORE claiming success
- Show actual test output
- Verify every claim with evidence
- Be brutally honest about failures
- Test-first mentality

### Rule #3: VERIFY EVERYTHING

**After EVERY code change:**

```powershell
# Run affected tests
cd packages/pulsar-transformer
npm test

# If you changed analyzer code:
npx vitest run src/analyzer/**/*.test.ts

# If you changed parser code:
npx vitest run src/parser/**/*.test.ts

# If you changed emitter code:
npx vitest run src/emitter/**/*.test.ts
```

**DO NOT** claim something works until you have **PROOF**.

---

## 📊 Current State Overview

### ✅ What's Working (Verified)

**Issue #1 - Object/Array Signal Arguments: FIXED**

```typescript
// ✅ These transformations work correctly:
signal(5)                    → createSignal(5)
signal('Hi')                 → createSignal("Hi")
signal({ name: 'Alice' })    → createSignal({ name: "Alice" })
signal([1, 2, 3])            → createSignal([1, 2, 3])
```

**Proof:**
```powershell
cd packages/pulsar-transformer
npx tsx quick-test.mjs
# Output: 4/4 passed, 0 failed
```

**Files Modified:**
1. `src/analyzer/prototype/analyze.ts` (lines 156-158)
2. `src/analyzer/prototype/analyze-expression.ts` (lines 346-406)

---

### ❌ What's Broken (Test Failures)

**Test Suite Status:**
- Total test files: ~50+
- Passing: ~20-30 files
- **Failing: ~20-30 files**

**Major Categories of Failures:**

#### 1. **Parser Failures** (Unimplemented Features)
- ❌ Try-catch statements (`parse-try-statement.test.ts` - 10/10 failed)
- ❌ Await expressions (`parse-await-expression.test.ts` - 7/7 failed)
- ❌ Yield expressions (`parse-yield-expression.test.ts` - 9/9 failed)
- ❌ For loops (`parse-loop-statements.test.ts` - 16/16 failed)
- ❌ Switch statements (`parse-switch-statement.test.ts` - 11/12 failed)
- ❌ JSX fragments (`parse-jsx-fragment.test.ts` - 13/13 failed)
- ❌ Throw statements (`parse-flow-control.test.ts` - 13/13 failed)
- ❌ Enums (`real-world-enum.test.ts` - 3/3 failed)
- ❌ Namespaces (`real-world-namespace.test.ts` - 3/3 failed)
- ❌ Decorators (`real-world-advanced.test.ts` - 9/9 failed)

#### 2. **Type System Failures**
- ❌ Union types (`union-types-e2e.test.ts` - 6/6 failed)
- ❌ Type aliases with literals (`parse-type-alias.test.ts` - 22/29 failed)
- ❌ Generic types in interfaces (`parse-interface-declaration.test.ts` - 2/16 failed)

#### 3. **Export System Issues**
- ❌ Default exports (`export-e2e.test.ts` - 1/6 failed)
- ❌ Default export emission (`emit-export.test.ts` - 1/8 failed)
- ❌ Default export analysis (`analyze-export.test.ts` - 1/7 failed)

#### 4. **Import System Issues**
- ❌ Side-effect imports (`emit-import.test.ts` - 1/9 failed)
- ❌ Import metadata preservation (`import-analysis.test.ts` - 2/15 failed)

#### 5. **Pipeline Integration Issues**
- ❌ Pipeline tests (`pipeline.test.ts` - 12/12 failed)

#### 6. **Lexer Issues**
- ❌ Line/column tracking (`lexer.test.ts` - 1/20 failed)

#### 7. **Emitter Issues**
- ❌ Variable declaration emission (`emitter.test.ts` - 6/25 failed)

---

## 🎯 Your Mission

**Objective:** Fix ALL failing tests. Make the test suite 100% green.

**Success Criteria:**
```powershell
cd packages/pulsar-transformer
npm test
# Output: All tests passed
```

**NOT DONE until ALL tests pass.**

---

## 🔍 How Issue #1 Was Fixed (Learning Material)

### Problem Analysis

**Symptom:**
```typescript
// Input:
signal({ name: 'Alice' })

// Output (WRONG):
createSignal()  // ❌ Argument disappeared

// Expected:
createSignal({ name: "Alice" })  // ✅
```

### Root Cause Investigation

**Step 1: Verified transformation output**
```powershell
npx tsx quick-test.mjs
# Showed: createSignal() with NO arguments
```

**Step 2: Traced through pipeline**
- Lexer: ✅ Tokenized correctly
- Parser: ✅ Created ObjectExpression node
- Analyzer: ❓ Need to check
- Emitter: ❓ Need to check

**Step 3: Found problem in analyzer**
File: `src/analyzer/prototype/analyze.ts`

```typescript
function _analyzeNode(node: IASTNode): IIRNode | null {
  switch (node.type) {
    case ASTNodeType.CALL_EXPRESSION:
      return this._analyzeExpression(node);
    
    // ❌ MISSING: ObjectExpression and ArrayExpression cases
    // These weren't being routed to the expression analyzer
    // So they returned null and got filtered out
    
    default:
      return null; // ← Object/Array nodes fell through here
  }
}
```

**Step 4: First fix attempt**
Added cases to route to expression analyzer:

```typescript
case 'ObjectExpression':  // Not in enum, parser uses string literal
case 'ArrayExpression':
  return this._analyzeExpression(node);
```

**Step 5: Second problem discovered**
Emitter error: "Unsupported expression IR type: Literal"

The analyzer was storing raw AST nodes instead of analyzed IR nodes:

```typescript
// ❌ OLD CODE:
function _analyzeObjectExpression(node: any): ILiteralIR {
  return {
    type: IRNodeType.LITERAL_IR,
    value: node, // ← Raw AST node stored here
    // ...
  };
}
```

When emitter tried to process nested properties, it called `_emitExpression` on raw AST nodes with type `'Literal'` instead of IR nodes with type `'LiteralIR'`.

**Step 6: Final fix**
Recursively analyze all nested nodes:

```typescript
// ✅ NEW CODE:
function _analyzeObjectExpression(this: IAnalyzerInternal, node: any): ILiteralIR {
  // Analyze each property to convert to IR
  const analyzedProperties = (node.properties || []).map((prop: any) => {
    if (prop.type === 'SpreadElement') {
      return {
        type: 'SpreadElement',
        argument: this._analyzeNode(prop.argument), // Convert to IR
      };
    }
    return {
      key: prop.key,
      value: this._analyzeNode(prop.value), // Convert to IR ← KEY FIX
    };
  });

  const analyzedNode = {
    ...node,
    properties: analyzedProperties, // Store analyzed properties
  };

  return {
    type: IRNodeType.LITERAL_IR,
    value: analyzedNode,
    rawValue: 'ObjectExpression',
    metadata: {
      isObjectExpression: true,
      // ...
    },
  };
}
```

**Step 7: Verification**
```powershell
npx tsx quick-test.mjs
# Output: 4/4 passed ✅

npx tsx test-issue-1.mjs
# Output: PASSED ✅
```

### Key Lessons

1. **Trace the pipeline:** Lexer → Parser → Analyzer → Transformer → Emitter → Validator
2. **Check type consistency:** AST nodes vs IR nodes
3. **Recursive analysis:** Nested structures need recursive processing
4. **Test incrementally:** After each fix, run tests
5. **Verify with evidence:** Don't claim it works without proof

---

## 🛠️ Debugging Tools Available

### Quick Test Files (Already Created)

```powershell
# Fast validation (4 basic tests)
npx tsx quick-test.mjs

# Single test with verbose output
npx tsx debug-test.mjs

# Issue #1 specific test
npx tsx test-issue-1.mjs

# Show transformed code
npx tsx debug-issue-1.mjs
npx tsx show-transform.mjs
```

### Test Commands

```powershell
# Run all tests
npm test

# Run specific test file
npx vitest run src/path/to/test-file.test.ts

# Run tests matching pattern
npx vitest run src/parser/**/*.test.ts

# Watch mode
npx vitest watch

# With coverage
npx vitest run --coverage
```

### Useful Patterns

```powershell
# Find all failing tests
npm test 2>&1 | Select-String "failed"

# Get test summary
npm test 2>&1 | Select-String "Test Suites:|Tests:"

# Run tests for specific component
npx vitest run src/analyzer/**/*.test.ts
```

---

## 📝 Task Breakdown Strategy

### Phase 1: Assessment (MANDATORY FIRST STEP)

**DO NOT skip this. DO NOT start coding yet.**

1. **Run full test suite:**
   ```powershell
   cd packages/pulsar-transformer
   npm test > test-results.txt 2>&1
   ```

2. **Categorize failures:**
   - Parser issues (syntax not implemented)
   - Analyzer issues (IR generation)
   - Emitter issues (code generation)
   - Type system issues
   - Integration issues

3. **Create prioritized list:**
   - Blockers (affect multiple tests)
   - High impact (many tests)
   - Low impact (few tests)

4. **Document findings** in this handoff file

### Phase 2: Implementation (One Category at a Time)

**For EACH category:**

1. **Pick the simplest failing test first**
2. **Read the test to understand what it expects**
3. **Trace through the code to find the gap**
4. **Implement the missing functionality**
5. **Run the test:** `npx vitest run path/to/test.ts`
6. **Verify it passes** (green output)
7. **Run related tests** to check for regressions
8. **Move to next test**

**REPEAT until category is 100% green.**

### Phase 3: Validation (After Each Category)

```powershell
# Run all tests in category
npx vitest run src/parser/**/*.test.ts

# Run full suite to check for regressions
npm test

# Verify specific transformations
npx tsx quick-test.mjs
```

### Phase 4: Final Verification

```powershell
# Clean build
npm run build

# Full test suite
npm test

# All should be green ✅
```

---

## 🔍 Common Patterns in This Codebase

### Pattern #1: Prototype-Based Classes

**REQUIRED pattern:**

```typescript
// ❌ WRONG:
class Parser {
  parse() { }
}

// ✅ CORRECT:
function Parser() {
  // Constructor
}

Parser.prototype.parse = function() {
  // Method
};

// Or:
Object.defineProperty(Parser.prototype, 'parse', {
  value: function parse() { },
  writable: true,
  enumerable: false,
  configurable: false,
});
```

### Pattern #2: AST Node Type Detection

Parser creates nodes with **string literal types**, not enum values:

```typescript
// Parser output:
{ type: 'ObjectExpression', ... }  // ← String literal

// NOT:
{ type: ASTNodeType.OBJECT_EXPRESSION, ... }  // ← Enum (not used by parser)

// So in analyzer:
switch (node.type) {
  case 'ObjectExpression':  // ✅ String literal
  case ASTNodeType.CALL_EXPRESSION:  // ✅ Enum for documented types
  // ...
}
```

### Pattern #3: IR Node Types

Analyzer creates IR nodes with **enum types**:

```typescript
// IR output:
{
  type: IRNodeType.LITERAL_IR,  // ← Enum
  value: ...,
  metadata: { ... }
}
```

### Pattern #4: Recursive Analysis

Always analyze nested structures recursively:

```typescript
function _analyzeArrayExpression(node: any): ILiteralIR {
  // ✅ Recursively analyze each element
  const analyzedElements = node.elements.map(elem => 
    this._analyzeNode(elem)  // ← Convert to IR
  );
  
  return {
    type: IRNodeType.LITERAL_IR,
    value: { ...node, elements: analyzedElements },
    // ...
  };
}
```

### Pattern #5: Error Handling

Provide clear error messages with location:

```typescript
if (!node) {
  throw new Error(
    `Unsupported node type '${node.type}' at ` +
    `${node.location?.start?.line}:${node.location?.start?.column}`
  );
}
```

---

## 📂 Codebase Structure

```
packages/pulsar-transformer/
├── src/
│   ├── lexer/              # Tokenization
│   │   └── __tests__/
│   ├── parser/             # AST generation
│   │   ├── prototype/      # Parser methods
│   │   │   └── __tests__/
│   │   └── __tests__/
│   ├── analyzer/           # IR generation
│   │   ├── prototype/      # Analyzer methods
│   │   │   └── __tests__/
│   │   └── ir/             # IR type definitions
│   ├── transformer/        # IR optimization
│   │   └── __tests__/
│   ├── emitter/            # Code generation
│   │   ├── prototype/      # Emitter methods
│   │   │   └── __tests__/
│   │   └── __tests__/
│   ├── validator/          # Output validation
│   │   └── __tests__/
│   ├── pipeline/           # Orchestration
│   │   └── __tests__/
│   ├── testing/            # Test utilities
│   │   └── prototype/      # Mock framework, DOM execution
│   └── __tests__/          # E2E tests
│
├── quick-test.mjs          # Fast validation (4 tests)
├── debug-test.mjs          # Single test debug
├── test-issue-1.mjs        # Issue #1 validation
└── package.json
```

---

## 🧪 Test Categories Explained

### Unit Tests
Test individual functions in isolation.

**Location:** `src/*/prototype/__tests__/`

**Example:** `src/analyzer/prototype/__tests__/analyze-expression.test.ts`

**Run:** `npx vitest run src/analyzer/prototype/__tests__/analyze-expression.test.ts`

### Integration Tests
Test multiple components working together.

**Location:** `src/parser/__tests__/integration/`

**Example:** `src/parser/__tests__/integration/real-world-control-flow.test.ts`

### E2E Tests
Test entire pipeline (source → transformed code).

**Location:** `src/__tests__/`

**Example:** `src/__tests__/signal-transformation-e2e.test.ts`

**Run:** `npx vitest run src/__tests__/`

---

## 🚨 Known Issues & Gotchas

### Issue #1: Node Type String Literals

Parser uses **string literals** for some node types:
- `'ObjectExpression'` (not in ASTNodeType enum)
- `'ArrayExpression'` (not in ASTNodeType enum)
- `'SpreadElement'` (not in ASTNodeType enum)

**Solution:** Check for string literals in switch statements.

### Issue #2: Recursive Analysis Required

When analyzing complex structures (objects, arrays, call expressions with nested args), you **MUST** recursively analyze all children.

**Wrong:**
```typescript
return {
  type: IRNodeType.LITERAL_IR,
  value: node,  // ❌ Raw AST node
};
```

**Correct:**
```typescript
const analyzedChildren = node.children.map(child => 
  this._analyzeNode(child)  // ✅ Convert to IR
);

return {
  type: IRNodeType.LITERAL_IR,
  value: { ...node, children: analyzedChildren },
};
```

### Issue #3: Test Isolation

Some tests may have shared state. If tests pass individually but fail in suite, check for:
- Global state mutation
- Mock cleanup
- File system side effects

### Issue #4: Windows Path Handling

Tests may have path separator issues on Windows. Use `path.normalize()` or replace:
```typescript
const normalizedPath = filePath.replace(/\\/g, '/');
```

---

## 📋 Checklist for Each Fix

**Before claiming a fix is complete:**

- [ ] Test passes when run individually: `npx vitest run path/to/test.ts`
- [ ] Test passes in full suite: `npm test`
- [ ] No regressions in related tests
- [ ] Code follows prototype-based pattern
- [ ] Error messages are clear and helpful
- [ ] Edge cases are handled
- [ ] No TODO comments
- [ ] No shortcuts or stubs
- [ ] Verified with actual test output (not assumptions)

---

## 🎯 Success Criteria

**You are NOT DONE until:**

```powershell
cd packages/pulsar-transformer
npm test

# Output shows:
# ✅ Test Files  XX passed (XX)
# ✅ Tests  XXX passed (XXX)
# ✅ Duration: XX.XXs
```

**ALL tests green. NO exceptions. NO excuses.**

---

## 📊 Progress Tracking Template

**As you work, update this section:**

### Test Fixes Progress

#### Parser Fixes
- [ ] Try-catch statements (0/10 passing)
- [ ] Await expressions (0/7 passing)
- [ ] Yield expressions (0/9 passing)
- [ ] For loops (0/16 passing)
- [ ] Switch statements (1/12 passing)
- [ ] JSX fragments (0/13 passing)
- [ ] Throw statements (0/13 passing)
- [ ] Enums (0/3 passing)
- [ ] Namespaces (0/3 passing)
- [ ] Decorators (0/9 passing)

#### Type System Fixes
- [ ] Union types (0/6 passing)
- [ ] Type aliases (7/29 passing)
- [ ] Generic types (14/16 passing)

#### Export System Fixes
- [ ] Default exports - E2E (5/6 passing)
- [ ] Default exports - Emitter (7/8 passing)
- [ ] Default exports - Analyzer (6/7 passing)

#### Import System Fixes
- [ ] Side-effect imports (8/9 passing)
- [ ] Import metadata (13/15 passing)

#### Other Fixes
- [ ] Pipeline integration (0/12 passing)
- [ ] Lexer line tracking (19/20 passing)
- [ ] Variable emission (19/25 passing)

**Total Tests Fixed:** 0 / ~200+

**Remaining:** ALL OF THEM

---

## 🔗 Related Documentation

**Read these for context:**
- [PSR_TRANSFORMATION_FIX.md](../../PSR_TRANSFORMATION_FIX.md)
- [TRANSFORMER-FIX-SUMMARY.md](../../TRANSFORMER-FIX-SUMMARY.md)
- [PSR-IMPLEMENTATION-VERIFICATION.md](../../PSR-IMPLEMENTATION-VERIFICATION.md)

**Architecture:**
- [docs/architecture/](../../docs/architecture/)

**Copilot Instructions (MANDATORY):**
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md)

---

## 💬 Communication Style

**Expected from you:**

✅ **Good:**
- "Running parser tests to assess failures..."
- "Test X fails because Y. Investigating..."
- "Fixed try-catch parsing. Running tests..."
- "Test output shows: [actual output]"
- "All parser tests now pass. Moving to analyzer tests..."

❌ **Bad:**
- "I'll implement try-catch parsing" (without afterward showing proof)
- "This should work..." (test it!)
- "Tests probably pass now" (run them!)
- "I think this fixes it" (verify!)
- "We can skip this test" (NO)

**Be precise. Be honest. Be thorough.**

---

## 🚀 Getting Started (Your First Steps)

```powershell
# 1. Navigate to package
cd e:\Sources\visual-schema-builder\packages\pulsar-transformer

# 2. Verify Issue #1 fix still works
npx tsx quick-test.mjs
# Expected: 4/4 passed

# 3. Run full test suite and save output
npm test > test-results-baseline.txt 2>&1

# 4. Analyze failures
code test-results-baseline.txt

# 5. Create work plan based on failures
# (Update "Progress Tracking" section above)

# 6. Start with simplest category
# Example: Pick export system (only 3 failures)

# 7. Fix one test at a time
npx vitest run src/__tests__/export-e2e.test.ts

# 8. Verify fix
npx vitest run src/__tests__/export-e2e.test.ts

# 9. Check for regressions
npm test

# 10. Move to next test
```

---

## 🎓 Final Words

**Tadeo expects:**
- Brutal honesty
- Zero shortcuts
- Complete implementations
- Proof of success
- Professional engineering

**You deliver:**
- 100% passing test suite
- Clean, maintainable code
- Thorough documentation
- Evidence-based claims

**No excuses. No bullshit. Just results.**

---

**Good luck. Make every test green. 🟢**

---

**Session End:** 2026-02-07 13:00 UTC  
**Next Agent Start:** When you read this  
**Expected Completion:** When ALL tests pass (not before)
