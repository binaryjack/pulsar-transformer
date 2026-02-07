# 🤖 AI Agent Handoff - Session 4 (February 7, 2026)

## Pulsar Transformer - Lexer Refactoring for Generic Type Support

---

## ⚡ QUICK STATUS - END OF SESSION 3

**Session 3 Achievements:**

- ✅ **JSX Fragment Fix** - 13/13 tests passing (was 12/13)
- ✅ **Interface Generic Parameters** - 15/16 tests passing (was 14/16)  
- ⚠️ **Critical Discovery** - Lexer cannot distinguish `<>` contexts

**Blocked by Lexer:**

- Interface function types with generics: `Promise<void>`
- Signal generic parameters: `createSignal<IUser | null>`
- All generic type expressions in non-declaration contexts

**Estimated Tests Blocked:** 10-15 tests across multiple features

---

## 🚨 MANDATORY READING ORDER FOR NEXT AGENT

**READ IN THIS EXACT ORDER:**

### 0. CRITICAL PROJECT RULES (NON-NEGOTIABLE)

1. **`.github/copilot-instructions.md`** (10 minutes) - MANDATORY! Read FIRST before ANY code changes!

### 1. ZERO TOLERANCE RULES

2. **NO Shortcuts** - Full proper implementation only
3. **NO MVP** - "Let me stub this out..." = REJECTED
4. **NO Bullshit** - "This should work..." without test proof = REJECTED
5. **NO Claiming Success** - Until you see: `✅ Tests X passed (X)` in terminal output
6. **Prototype Pattern ONLY** - NO ES6 classes in implementation files
7. **One Item Per File** - One class/function/interface per file
8. **Test After EVERY Change** - Run tests immediately, don't batch

### 2. SESSION CONTEXT

9. **This file - "YOUR MISSION" section** (5 minutes) - Your specific tasks
10. **SESSION-3-IMPLEMENTATION-REPORT.md** (10 minutes) - What was just fixed
11. **FRAMEWORK-INTELLIGENCE-REPORT-SESSION-3.md** (15 minutes) - Research findings
12. **AGENT-HANDOFF-2026-02-07-SESSION-2.md** (10 minutes) - Previous session context

**TOTAL READING TIME:** 50 minutes → Will save you DAYS of trial and error!

---

## 🎯 YOUR MISSION - SESSION 4

You are a **Lexer Architecture Specialist**. Your job is to refactor the lexer to support context-aware generic type tokenization.

### TASK 1: Research Lexer Strategies

**Time Estimate: 2-3 hours**

Research how production lexers handle the `<>` ambiguity:

**Framework Targets:**

1. **TypeScript Compiler** (`microsoft/TypeScript`)
   - File: `src/compiler/scanner.ts`
   - How it distinguishes `<` contexts
   - State machine implementation

2. **Babel Parser** (`babel/babel`)
   - File: `packages/babel-parser/src/tokenizer/index.ts`
   - JSX mode switching
   - Type annotation handling

3. **SWC Parser** (`swc-project/swc`)
   - File: `crates/swc_ecma_parser/src/lexer/mod.rs`
   - Rust implementation patterns
   - Performance optimizations

**Research Tools:**

- `github_repo` tool to search repositories
- `fetch_webpage` for documentation
- Focus on lookahead and context tracking

**Questions to Answer:**

- How do they detect generic type parameter start (`<`)?
- What's the lookahead strategy?
- Do they use parser feedback to the lexer?
- How do they handle nested generics `Map<string, Set<number>>`?

### TASK 2: Design Lexer Context System

**Time Estimate: 2 hours**

Based on research, design a context-aware lexer architecture:

**Requirements:**

1. **Context Stack** - Track current parsing context (CODE, GENERIC_TYPE, JSX)
2. **Lookahead** - Peek ahead to disambiguate `<` character
3. **Mode Switching** - Enter/exit generic type mode
4. **Backwards Compatibility** - Don't break existing working tests

**Design Deliverable:**

Create `docs/architecture/LEXER-CONTEXT-DESIGN.md` with:

- Context state machine diagram
- Token type additions needed
- Lookahead algorithm pseudocode
- Example token sequences before/after

### TASK 3: Implement Lexer Context Tracking

**Time Estimate: 4-6 hours**

Implement the context-aware lexing system:

**File to Modify:** `src/parser/lexer/lexer.ts`

**Implementation Steps:**

1. Add context stack to lexer state
2. Implement lookahead buffer (2-3 tokens)
3. Add `_isGenericTypeStart()` detection method
4. Update `_scanLT()` to check context
5. Add mode switching methods

**Critical Pattern:**

```typescript
// Detect generic type start vs comparison operator
_isGenericTypeStart(): boolean {
  // Look ahead for type identifier patterns
  // e.g., <T>, <IUser, <string |
  const next1 = this._peek(1);
  const next2 = this._peek(2);
  
  // Patterns that indicate generic type:
  // - <Identifier
  // - <Identifier>
  // - <Identifier,
  // - <Identifier |
  // NOT: < 123, < "string", < (expression)
}
```

### TASK 4: Update Token Types

**Time Estimate: 1 hour**

Add new token types for generic context:

**File to Modify:** `src/parser/lexer/token.types.ts`

**Add:**

```typescript
export enum TokenType {
  // ... existing types ...
  
  // Generic type delimiters
  GENERIC_OPEN = 'GENERIC_OPEN',      // < in generic context
  GENERIC_CLOSE = 'GENERIC_CLOSE',    // > in generic context
  
  // Keep existing for backwards compatibility
  LT = 'LT',   // < as less-than
  GT = 'GT',   // > as greater-than
}
```

### TASK 5: Test Incrementally

**Time Estimate: 2 hours**

Test each change immediately:

**Test Sequence:**

1. **Baseline** - Run full suite, document current status
2. **Context Stack** - Add stack, verify no regressions
3. **Lookahead** - Add peek logic, verify no regressions
4. **Detection** - Add `_isGenericTypeStart()`, test on simple cases
5. **Integration** - Update `_scanLT()`, test target failures:
   - `parse-interface-declaration.test.ts` - "function types"
   - `union-types-e2e.test.ts` - "component signals"

**Test Command:**

```bash
# Test specific files
npm test -- parse-interface-declaration
npm test -- union-types-e2e

# Full suite
npm test
```

### TASK 6: Documentation

**Time Estimate: 1 hour**

Document the lexer refactoring:

**Create:** `docs/architecture/LEXER-CONTEXT-IMPLEMENTATION.md`

**Contents:**

- Problem statement
- Solution architecture
- Code examples
- Test results comparison
- Known limitations
- Future improvements

---

## 🔍 THE PROBLEM IN DETAIL

### Current Lexer Behavior (WRONG)

```typescript
// Source:
const signal = createSignal<IUser | null>(null);

// Current tokenization:
[
  CONST, IDENTIFIER('signal'), EQUALS,
  IDENTIFIER('createSignal'),
  LT,  // ← Treated as less-than operator!
  IDENTIFIER('IUser'),
  // ... rest is lost or mis-tokenized
]

// Parser receives incomplete/wrong tokens
```

### Expected Lexer Behavior (CORRECT)

```typescript
// Source:
const signal = createSignal<IUser | null>(null);

// Correct tokenization:
[
  CONST, IDENTIFIER('signal'), EQUALS,
  IDENTIFIER('createSignal'),
  GENERIC_OPEN,  // ← Context-aware: this is a generic!
  IDENTIFIER('IUser'), PIPE, NULL,
  GENERIC_CLOSE,
  LPAREN, NULL, RPAREN, SEMICOLON
]

// Parser can now correctly handle the generic type
```

### Why This is Hard

The same `<` character means different things:

```typescript
// 1. Generic type parameter
interface IContainer<T> { }        // ← Generic
createSignal<IUser | null>(null)   // ← Generic

// 2. Less-than operator  
if (count < 10) { }                // ← Comparison
const result = a < b ? a : b;      // ← Comparison

// 3. JSX element opening
const element = <div>Hello</div>;  // ← JSX

// Lexer must determine which!
```

---

## 📚 RESEARCH STARTING POINTS

### TypeScript Scanner

**Repository:** `microsoft/TypeScript`  
**Key Files:**

```
src/compiler/scanner.ts           # Main scanner implementation
src/compiler/types.ts             # Token type definitions
src/compiler/parser.ts            # Parser-lexer interaction
```

**Search Queries:**

- "scanLessThanToken"
- "TypeParameter"
- "JSXElement"
- "reScanLessThanToken"

**Key Insight to Find:**  
TypeScript uses **parser feedback** - the parser tells the lexer when to re-scan a token in a different context.

### Babel Parser

**Repository:** `babel/babel`  
**Key Files:**

```
packages/babel-parser/src/tokenizer/index.ts      # Tokenizer
packages/babel-parser/src/plugins/typescript.ts   # TS support
packages/babel-parser/src/plugins/jsx/index.ts    # JSX support
```

**Search Queries:**

- "jsxReadToken"
- "expectRelational"
- "tsParseTypeParameters"
- "lookahead"

**Key Insight to Find:**  
Babel uses **mode switching** - the tokenizer has different modes (JSX, TypeScript types, standard JS).

### SWC Parser

**Repository:** `swc-project/swc`  
**Key Files:**

```
crates/swc_ecma_parser/src/lexer/mod.rs           # Lexer
crates/swc_ecma_parser/src/parser/typescript.rs   # TS parsing
```

**Key Insight to Find:**  
SWC uses **context enums** and efficient state machines for performance.

---

## 🎯 SUCCESS CRITERIA

### Minimum Viable Fix

✅ **2 specific failing tests pass:**

1. `parse-interface-declaration.test.ts` → "should parse interface with function types"
2. `union-types-e2e.test.ts` → "should handle union types in component signals"

### Stretch Goals

✅ **Additional generic type tests:**

- Generic function declarations
- Generic class declarations
- Nested generic types
- Generic constraints (`T extends Base`)

### Quality Requirements

✅ **Zero Regressions** - All currently passing tests must still pass  
✅ **Documented** - Complete architecture documentation  
✅ **Tested** - Incremental test results at each step  
✅ **Clean Code** - Prototype pattern, one concern per function  

---

## ⚠️ COMMON PITFALLS

### 1. Breaking Existing JSX Parsing

**Problem:** Changing `<` handling breaks JSX element parsing

**Solution:** Check context before mode switching:

```typescript
if (this._inJSXContext()) {
  return this._scanJSXOpening();
} else if (this._isGenericTypeStart()) {
  return this._scanGenericOpen();
} else {
  return this._scanLessThan();
}
```

### 2. Infinite Lookahead

**Problem:** Trying to look too far ahead causes performance issues

**Solution:** Limit lookahead to 2-3 tokens max:

```typescript
// ✅ GOOD - Limited lookahead
const next1 = this._peek(1);
const next2 = this._peek(2);

// ❌ BAD - Unbounded lookahead
while (this._peek(n).type !== 'GT') { n++; }
```

### 3. State Synchronization

**Problem:** Context stack gets out of sync with actual parse state

**Solution:** Clear stack on error recovery:

```typescript
try {
  this._parseGenericType();
} catch (error) {
  this._clearGenericContext(); // ← Important!
  throw error;
}
```

### 4. Backwards Compatibility

**Problem:** Changing token types breaks existing parser code

**Solution:** Maintain both token types during transition:

```typescript
// Parser should handle both
if (token.type === 'LT' || token.type === 'GENERIC_OPEN') {
  // Handle generic opening
}
```

---

## 🔧 IMPLEMENTATION CHECKLIST

**Before You Start:**

- [ ] Read all mandatory files listed above
- [ ] Run baseline test suite and save results
- [ ] Create research notes document

**Research Phase:**

- [ ] Analyze TypeScript scanner implementation
- [ ] Analyze Babel tokenizer implementation  
- [ ] Document lookahead patterns found
- [ ] Document context tracking patterns found
- [ ] Create design document

**Implementation Phase:**

- [ ] Add context stack to lexer state
- [ ] Implement lookahead buffer
- [ ] Add `_isGenericTypeStart()` method
- [ ] Add new token types
- [ ] Update `_scanLT()` to use context
- [ ] Test: No regressions
- [ ] Test: Interface function types passes
- [ ] Test: Union type signals passes

**Documentation Phase:**

- [ ] Create architecture document
- [ ] Update lexer API documentation
- [ ] Add code comments explaining context logic
- [ ] Document test results before/after

**Completion:**

- [ ] All tests incremental tested
- [ ] Zero regressions confirmed
- [ ] Target tests passing
- [ ] Documentation complete
- [ ] Code reviewed for prototype pattern compliance

---

## 📊 EXPECTED IMPACT

**Conservative Estimate:**

- +2 tests immediately (target failures)
- +5-8 tests from related generic type features
- **Total: +7-10 tests passing**

**Optimistic Estimate:**

- +2 tests (targets)
- +10-12 tests (all generic types)
- +3-5 tests (improved error messages)
- **Total: +15-19 tests passing**

**Risk Assessment:**

- **Low Risk:** Context stack and lookahead (isolated changes)
- **Medium Risk:** Token type updates (parser changes needed)
- **High Risk:** Breaking JSX parsing (thorough testing required)

---

## 🚀 QUICK START COMMANDS

```bash
# Navigate to package
cd packages/pulsar-transformer

# Run target tests
npm test -- parse-interface-declaration
npm test -- union-types-e2e

# Run full suite (baseline)
npm test > baseline-results.txt

# Research TypeScript scanner
# Use github_repo tool with repo: "microsoft/TypeScript"
# Query: "scanner generic type parameter"

# Research Babel tokenizer  
# Use github_repo tool with repo: "babel/babel"
# Query: "tokenizer type parameters lookahead"
```

---

## 📝 AGENT HANDOFF NOTES

**From Session 3:**

- Parser fixes are maximized without lexer changes
- Intelligence report was accurate on problems but underestimated root cause depth
- Clean codebase ready for architectural changes
- All documentation up to date

**Key Files Already Working:**

- ✅ JSX fragment parsing
- ✅ Interface generic declarations (`interface<T>`)
- ✅ Type alias parsing
- ✅ Union types in declarations

**Key Files Blocked:**

- ❌ Interface body generic types (`Promise<void>`)
- ❌ Variable generic types (`createSignal<T>`)
- ❌ Function call generic types (`fetch<Response>()`)

**Technical Debt:** None (Session 3 was clean)

**Blocker Severity:** HIGH - Affects ~10-15 tests across multiple features

---

## 🎓 LEARNING RESOURCES

### Lexer/Scanner Theory

- [Crafting Interpreters - Scanning](https://craftinginterpreters.com/scanning.html)
- [Dragon Book - Lexical Analysis](https://en.wikipedia.org/wiki/Lexical_analysis)
- [TypeScript Deep Dive - Scanner](https://basarat.gitbook.io/typescript/overview/scanner)

### Context-Aware Parsing

- [Parser Lookahead Techniques](https://en.wikipedia.org/wiki/Lookahead)
- [LL vs LR Parsing](https://en.wikipedia.org/wiki/LL_parser)

### Production Examples

- TypeScript: Context feedback from parser
- Babel: Mode switching in tokenizer
- Rust: nom parser combinator library patterns

---

**Last Updated:** February 7, 2026  
**Session:** 4  
**Agent Type:** Lexer Architecture Specialist  
**Estimated Duration:** 8-12 hours  
**Expected Impact:** +7-19 tests passing  
**Risk Level:** Medium (architectural changes)  

**Status:** 🎯 Ready for lexer refactoring phase

---

**Next Agent:** Start with research phase. Don't skip the TypeScript/Babel analysis - their solutions are battle-tested across millions of codebases.
