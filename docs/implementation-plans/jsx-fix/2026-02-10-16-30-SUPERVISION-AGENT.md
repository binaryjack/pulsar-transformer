# SUPERVISION AGENT - JSX TRANSFORMATION FIX

**Date:** 2026-02-10 16:30  
**Agent:** JSX-Fix-Supervisor  
**Mission:** Ensure JSX transformation implementation follows ALL rules with ZERO tolerance

---

## SUPERVISION RULES

### ZERO TOLERANCE VIOLATIONS

**IF ANY OF THESE OCCUR → IMMEDIATE REJECTION:**

1. ❌ Stubs, TODOs, placeholders, incomplete code
2. ❌ ES6 classes (`class` keyword in implementation)
3. ❌ `any` types anywhere
4. ❌ Multiple items per file
5. ❌ Files without proper naming: `yyyy-MM-dd-HH-mm-feature-phase-#.ts`
6. ❌ Fuzzy language: "should work", "probably", "might", "believe"
7. ❌ Implementation without approval
8. ❌ Tests that don't actually run
9. ❌ Code that doesn't compile

---

## CHECKPOINT 1: PARSER FIXES (30 mins)

### Files to Modify

**File 1:** `src/parser/prototypes/parse-jsx-element.ts`

**Changes Required:**

1. **Keyword Attribute Fix (Line ~155)**
   - ✅ Must accept COMPONENT, DEFAULT, and all keywords as attribute names
   - ✅ Must create helper `isKeyword()` function
   - ✅ Must handle token correctly
   - ❌ NO `any` types
   - ❌ NO assumptions about token structure

2. **Comment Skip Fix (Line ~28)**
   - ✅ Must skip COMMENT tokens in JSX children loop
   - ✅ Must use `continue` to skip
   - ✅ Must not break existing logic
   - ❌ NO band-aid - proper skip implementation

**Verification Checklist:**

```
[ ] Code compiles with `pnpm run build`
[ ] No TypeScript errors
[ ] No `any` types added
[ ] Helper function in separate file if > 5 lines
[ ] Follows prototype pattern if adds methods
[ ] Actually tested with test-simple.psr
[ ] Browser shows component or clear error
```

---

## CHECKPOINT 2: LEXER STATE MACHINE (2-3 days)

### Architecture Required

**Pattern:** Prototype-based Lexer with state tracking

**New Files Required:**

1. `src/lexer/prototypes/push-state.ts`
2. `src/lexer/prototypes/pop-state.ts`
3. `src/lexer/prototypes/get-state.ts`
4. `src/lexer/prototypes/scan-jsx-text.ts`
5. `src/lexer/prototypes/is-in-jsx.ts`

**Modified Files:**

1. `src/lexer/lexer.types.ts` - Add state enum + fields
2. `src/lexer/lexer.ts` - Initialize state
3. `src/lexer/prototypes/scan-token.ts` - Route based on state

**Type Requirements:**

```typescript
// In lexer.types.ts
export enum LexerStateEnum {
  Normal = 'Normal',
  InsideJSX = 'InsideJSX',
  InsideJSXText = 'InsideJSXText',
}

export interface ILexer {
  // ... existing fields
  state: LexerStateEnum;
  stateStack: LexerStateEnum[];
  
  // New methods
  pushState(state: LexerStateEnum): void;
  popState(): void;
  getState(): LexerStateEnum;
  isInJSX(): boolean;
}
```

**ZERO TOLERANCE CHECKS:**

```
[ ] NO ES6 classes - all prototype functions
[ ] NO `any` types anywhere
[ ] ONE function per file in prototypes/
[ ] State transitions documented with state diagram
[ ] All functions have clear input/output types
[ ] Error handling for invalid state transitions
[ ] Tests for each state transition
[ ] Tests for edge cases (nested JSX, expressions)
```

---

## CHECKPOINT 3: JSX TEXT SCANNING (1 day)

### Implementation Pattern

**From learnings/01-lexer-tokenization-patterns.md:**

```typescript
export function scanJSXText(this: ILexer): IToken {
  const start = this.pos;
  const startLine = this.line;
  const startColumn = this.column;
  let text = '';
  
  // Scan until JSX boundary
  while (
    !this.isAtEnd() &&
    this.peek() !== '<' &&
    this.peek() !== '{' &&
    !(this.peek() === '/' && this.peek(1) === '>')
  ) {
    text += this.peek();
    this.advance();
  }
  
  // Create token
  this.addToken(TokenTypeEnum.JSX_TEXT, text);
  
  return this.tokens[this.tokens.length - 1];
}
```

**MANDATORY REQUIREMENTS:**

```
[ ] Prototype function - NOT class method
[ ] Handles Unicode/UTF-8 correctly
[ ] Handles whitespace correctly
[ ] Doesn't break on emojis
[ ] Preserves all characters until boundary
[ ] Returns proper IToken with positions
[ ] NO `any` types
[ ] Integrated with state machine
[ ] Actually tested with emoji: "🔥 Test"
[ ] Actually tested with Unicode: "Привет мир"
[ ] Actually tested with mixed: "Hello 世界 🌍"
```

---

## CHECKPOINT 4: PARSER JSX_TEXT CONSUMPTION (1 day)

### Simplification Required

**File:** `src/parser/prototypes/parse-jsx-element.ts`

**Current Issue:** Lines 48-110 try to accumulate text from multiple tokens

**Required Change:** Consume JSX_TEXT token directly

```typescript
// In parseJSXElement children loop, ADD:
if (this.match(TokenTypeEnum.JSX_TEXT)) {
  const token = this.advance();
  children.push({
    type: 'JSXText',
    value: token.value,
    raw: token.raw || token.value,
    start: token.start,
    end: token.end,
  });
  continue;
}
```

**VERIFICATION:**

```
[ ] Removes brittle text accumulation logic
[ ] Simplifies parser complexity
[ ] Works with lexer JSX_TEXT tokens
[ ] Preserves Unicode content
[ ] Works with empty text between tags
[ ] Works with whitespace-only text
[ ] Tests added for edge cases
```

---

## CHECKPOINT 5: INTEGRATION TESTS (1 day)

### Test Suite Required

**File:** `src/__tests__/lexer/jsx-text.test.ts`

**Test Cases:**

1. Basic text: `<div>Hello</div>`
2. Unicode: `<div>世界</div>`
3. Emoji: `<div>🔥</div>`
4. Mixed: `<div>Hello 世界 🌍</div>`
5. Whitespace: `<div>  spaces  </div>`
6. Empty: `<div></div>`
7. Nested: `<div>A<span>B</span>C</div>`
8. With expressions: `<div>Text {expr} More</div>`

**File:** `src/__tests__/parser/jsx-keyword-attributes.test.ts`

**Test Cases:**

1. `<Route component={Comp} />`
2. `<Input default={value} />`
3. `<Form const={x} />` (edge case)
4. All keywords as attributes

**File:** `src/__tests__/integration/jsx-comments.test.ts`

**Test Cases:**

1. `<div>{/* comment */}</div>`
2. Multi-line comments
3. Comments between elements
4. Comments in attributes (invalid, should error)

**MANDATORY:**

```
[ ] Tests use vitest (existing framework)
[ ] Tests actually run with `pnpm test`
[ ] ALL tests pass
[ ] Tests are in correct directory
[ ] Tests follow naming: feature-phase.test.ts
[ ] Tests have clear descriptions
[ ] Tests verify exact output
[ ] NO placeholder tests ("TODO: implement")
```

---

## CHECKPOINT 6: END-TO-END VALIDATION (Final)

### Browser Test Required

**Procedure:**

1. Start dev server: `cd pulsar-ui.dev; pnpm dev`
2. Open http://localhost:3000/
3. Verify component renders
4. Check console for errors
5. Check network tab for transformation output
6. Verify HMR works on file change

**Acceptance Criteria:**

```
[ ] Browser shows component content
[ ] NO errors in console
[ ] NO errors in terminal
[ ] Transformation logs show success
[ ] Component has correct HTML structure
[ ] Text content visible on screen
[ ] Unicode/emoji display correctly
[ ] HMR updates component on save
```

### Real PSR Files Test

**Test Files:**
- `src/lab/counter.psr` (has emoji)
- `src/showcase/pages/home.psr` (has emoji)
- `src/showcase/pages/about.psr` (has list)
- `src/main.psr` (has routing)

**Requirements:**

```
[ ] ALL files transform without errors
[ ] ALL files generate valid TypeScript
[ ] ALL files export correct components
[ ] Browser can import and render
[ ] Console shows NO transformation errors
```

---

## SUPERVISION PROTOCOL

### Before Each Phase

1. **READ** the implementation plan for that phase
2. **VERIFY** all files follow naming convention
3. **CHECK** no stubs/TODOs in code
4. **CONFIRM** all types are proper interfaces
5. **VALIDATE** prototype pattern used correctly

### During Implementation

1. **MONITOR** for `any` types → REJECT immediately
2. **MONITOR** for ES6 classes → REJECT immediately
3. **MONITOR** for stubs → REJECT immediately
4. **MONITOR** for multiple items per file → REJECT immediately
5. **MONITOR** for fuzzy language → REJECT immediately

### After Each Phase

1. **COMPILE** the code: `pnpm run build`
2. **RUN** the tests: `pnpm test`
3. **VERIFY** all tests pass
4. **CHECK** no TypeScript errors
5. **DOCUMENT** what works and what doesn't (binary)

### Rejection Criteria

**IMMEDIATE REJECTION IF:**

- Code doesn't compile
- Tests don't pass
- Any TypeScript errors
- Any `any` types found
- Any ES6 classes found
- Any stubs/TODOs found
- Multiple items in one file
- Fuzzy outcome language used
- Implementation without approval
- User not asked for "GO" signal

---

## REPORTING FORMAT

### After Each Checkpoint

```
CHECKPOINT X: [Name]
Status: ✅ PASS / ❌ FAIL
Files Modified: X
Files Created: X
Compilation: ✅ / ❌
Tests: X/X passing
Browser: ✅ renders / ❌ fails / ⏸️ not tested

Issues Found:
- [List actual issues, no speculation]

Blockers:
- [List actual blockers, or NONE]

Next: [What's next, or DONE]
```

---

## FINAL VALIDATION CHECKLIST

```
[ ] All 5 critical blockers fixed
[ ] Lexer state machine implemented
[ ] JSX text scanning works
[ ] Parser accepts keywords as attributes
[ ] Parser skips JSX comments
[ ] Unicode/emoji support works
[ ] All tests pass (100%)
[ ] Code compiles (0 errors)
[ ] Browser renders test-simple.psr
[ ] Browser renders real PSR files
[ ] HMR works
[ ] No console errors
[ ] No terminal errors
[ ] Documentation updated
[ ] Analysis doc updated with results
```

---

## ENFORCEMENT

**This agent has VETO power.**

If ANY checkpoint fails, work STOPS until fixed.

**NO EXCEPTIONS.**

---

**Supervisor: ACTIVE**  
**Mode: ZERO TOLERANCE**  
**Enforcement: IMMEDIATE REJECTION**
