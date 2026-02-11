# IMPLEMENTATION PLAN: JSX Transformation Full Fix

**Date:** 2026-02-10 16:30  
**Feature:** JSX Complete Support  
**Status:** READY FOR APPROVAL  
**Estimated Duration:** 5-7 days  
**Complexity:** HIGH

---

## EXECUTIVE SUMMARY

**Goal:** Fix 5 critical blockers preventing JSX transformation from working on real PSR files.

**Current State:**

- ❌ Browser shows blank screen
- ❌ Transformation returns 0 characters
- ❌ Errors: "Unexpected character", "Expected IDENTIFIER got COMPONENT", "Unexpected token COMMENT"

**Target State:**

- ✅ Browser renders PSR components
- ✅ Transformation generates valid TypeScript
- ✅ All real PSR files work (with text, emojis, comments, keywords)

**Critical Path:**

1. Parser fixes (30 mins) → Unblock test-simple.psr
2. Lexer state machine (2 days) → Enable context-aware tokenization
3. JSX text scanning (1 day) → Handle text between tags
4. Parser simplification (1 day) → Consume JSX_TEXT tokens
5. Integration testing (1 day) → Validate end-to-end

---

## PHASE 0: PRE-IMPLEMENTATION CHECKLIST

### Understanding

```
[ ] Read EXHAUSTIVE-TRANSFORMATION-ANALYSIS.md completely
[ ] Read learnings/01-lexer-tokenization-patterns.md
[ ] Read learnings/02-parser-ast-construction.md
[ ] Understand current lexer architecture
[ ] Understand current parser architecture
[ ] Understand 5 critical blockers
[ ] Understand state machine pattern
[ ] Understand prototype pattern requirement
```

### Prerequisites

```
[ ] All tests currently passing: pnpm test
[ ] Code currently compiles: pnpm run build
[ ] Dev server starts: pnpm dev
[ ] test-simple.psr file created
[ ] Backup created: git commit -m "Pre-JSX-fix checkpoint"
```

### Tools Ready

```
[ ] VS Code open with workspace
[ ] Terminal ready for testing
[ ] Browser ready for validation
[ ] Supervision agent reviewed and accepted
```

---

## PHASE 1: IMMEDIATE FIX (30 minutes)

**Objective:** Get test-simple.psr rendering in browser

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 30 minutes  
**Complexity:** LOW  
**Risk:** LOW

### Phase 1.1: Parser Keyword Flexibility

**File:** `src/parser/prototypes/parse-jsx-element.ts`

**Current Code (Line ~155):**

```typescript
const attrName = this.expect(TokenTypeEnum.IDENTIFIER);
```

**Problem:** JSX attribute `component={...}` has token type COMPONENT, not IDENTIFIER

**Required Change:**

```typescript
// Accept keywords as JSX attribute names
const token = this.peek();

// Check if token can be an attribute name
if (token.type === TokenTypeEnum.IDENTIFIER || this.isKeywordToken(token.type)) {
  const attrName = this.advance();

  // ... continue with existing logic
} else {
  throw new Error(`Expected attribute name, got ${token.type} at line ${token.line}`);
}
```

**New Helper Function Required:**

**File:** `src/parser/prototypes/is-keyword-token.ts` (NEW)

```typescript
/**
 * Check if token type is a keyword that can be used as JSX attribute name
 */

import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';

Parser.prototype.isKeywordToken = function (this: IParser, tokenType: TokenTypeEnum): boolean {
  const keywordTypes: TokenTypeEnum[] = [
    TokenTypeEnum.COMPONENT,
    TokenTypeEnum.DEFAULT,
    TokenTypeEnum.CONST,
    TokenTypeEnum.LET,
    TokenTypeEnum.VAR,
    TokenTypeEnum.FUNCTION,
    TokenTypeEnum.INTERFACE,
    TokenTypeEnum.EXPORT,
    TokenTypeEnum.IMPORT,
    TokenTypeEnum.FROM,
    TokenTypeEnum.RETURN,
    TokenTypeEnum.IF,
    TokenTypeEnum.ELSE,
    TokenTypeEnum.FOR,
    TokenTypeEnum.WHILE,
    TokenTypeEnum.TRUE,
    TokenTypeEnum.FALSE,
    TokenTypeEnum.NULL,
    TokenTypeEnum.UNDEFINED,
  ];

  return keywordTypes.includes(tokenType);
};
```

**Update parser.ts interface:**

```typescript
// Add to IParser interface
isKeywordToken(tokenType: TokenTypeEnum): boolean;

// Add to Parser constructor
isKeywordToken: undefined,
```

**Update index.ts:**

```typescript
import './prototypes/is-keyword-token.js';
```

**Verification Steps:**

1. Create `is-keyword-token.ts` file
2. Modify `parse-jsx-element.ts` attribute parsing
3. Update `parser.ts` interface
4. Update `index.ts` imports
5. Build: `pnpm run build`
6. Test: Create test file with `<Route component={X} />`
7. Verify: Parser accepts COMPONENT token

**Success Criteria:**

```
[ ] File created: is-keyword-token.ts
[ ] NO `any` types used
[ ] Follows prototype pattern
[ ] Code compiles: 0 errors
[ ] Parser accepts COMPONENT as attribute name
[ ] Parser accepts DEFAULT as attribute name
[ ] Test created and passing
```

---

### Phase 1.2: Parser Comment Skip

**File:** `src/parser/prototypes/parse-jsx-element.ts`

**Current Code (Line ~28 in parseJSXElement function):**

```typescript
while (!this.isAtEnd()) {
  // Check for closing tag: </div>
  if (this.match(TokenTypeEnum.LT) && this.peek(1).type === TokenTypeEnum.SLASH) {
    break;
  }
```

**Problem:** Parser encounters COMMENT token in JSX children, doesn't know how to handle

**Required Change:**

```typescript
while (!this.isAtEnd()) {
  // Skip comments in JSX
  if (this.match(TokenTypeEnum.COMMENT)) {
    this.advance();
    continue;
  }

  // Check for closing tag: </div>
  if (this.match(TokenTypeEnum.LT) && this.peek(1).type === TokenTypeEnum.SLASH) {
    break;
  }

  // ... rest of existing logic
```

**Verification Steps:**

1. Modify `parse-jsx-element.ts` - add comment skip at top of loop
2. Build: `pnpm run build`
3. Test: Create PSR with `<div>{/* test */}</div>`
4. Verify: Parser skips comment, no error

**Success Criteria:**

```
[ ] Code compiles: 0 errors
[ ] Parser skips COMMENT tokens in JSX
[ ] JSX with comments parses successfully
[ ] Test created and passing
```

---

### Phase 1.3: Integration Test - test-simple.psr

**Goal:** Verify parser fixes work end-to-end

**Test File:** Already created at `pulsar-ui.dev/src/test-simple.psr`

**Current Content:**

```psr
export component TestSimple() {
  return (
    <div style="padding: 20px; background: #1a1a1a; color: white;">
      <h1>Test Component Rendered!</h1>
      <p>If you see this, the transformer is working.</p>
    </div>
  );
}
```

**Procedure:**

1. Ensure `main.ts` imports `TestSimple`
2. Start dev server: `cd pulsar-ui.dev; pnpm dev`
3. Open http://localhost:3000/
4. Check browser console
5. Check terminal output
6. Verify component renders

**Expected Terminal Output:**

```
[pulsar] Transformation complete in XXms
[pulsar] Output length: >0 chars
[pulsar] Diagnostic count: 0
```

**Expected Browser:**

- White text on dark background
- Heading: "Test Component Rendered!"
- Paragraph: "If you see this, the transformer is working."

**Success Criteria:**

```
[ ] Dev server starts without errors
[ ] Transformation succeeds (output > 0 chars)
[ ] No diagnostics/errors
[ ] Browser shows component
[ ] Console has no errors
[ ] Text is visible on screen
```

**If Fails:**

- Check terminal logs for transformation errors
- Check browser console for import errors
- Check transformation output in network tab
- Fix issues before proceeding to Phase 2

---

## PHASE 2: LEXER STATE MACHINE (2-3 days)

**Objective:** Enable context-aware tokenization for JSX

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 days  
**Complexity:** HIGH  
**Risk:** MEDIUM

### Phase 2.1: Type Definitions

**File:** `src/lexer/lexer.types.ts`

**Add State Enum:**

```typescript
/**
 * Lexer state for context-aware tokenization
 */
export enum LexerStateEnum {
  Normal = 'Normal', // Regular JavaScript/TypeScript
  InsideJSX = 'InsideJSX', // Inside JSX tag: <div ...>
  InsideJSXText = 'InsideJSXText', // Between JSX tags: <div>TEXT</div>
}
```

**Update ILexer Interface:**

```typescript
export interface ILexer {
  // ... existing fields

  /**
   * Current lexer state for context-aware tokenization
   */
  state: LexerStateEnum;

  /**
   * State stack for nested contexts (JSX in expressions)
   */
  stateStack: LexerStateEnum[];

  // State management
  pushState(state: LexerStateEnum): void;
  popState(): void;
  getState(): LexerStateEnum;
  isInJSX(): boolean;

  // ... rest remains same
}
```

**Success Criteria:**

```
[ ] Enum created with 3 states
[ ] ILexer interface updated
[ ] NO `any` types
[ ] Code compiles
```

---

### Phase 2.2: Lexer Constructor Update

**File:** `src/lexer/lexer.ts`

**Update Constructor:**

```typescript
export const Lexer: ILexer = function (
  this: ILexer,
  source: string,
  sourceFile: string = 'unknown'
) {
  this.source = source;
  this.sourceFile = sourceFile;
  this.pos = 0;
  this.start = 0;
  this.line = 1;
  this.column = 0;
  this.tokens = [];

  // Initialize state
  this.state = LexerStateEnum.Normal;
  this.stateStack = [];

  // Methods assigned via prototype
  this.scanTokens = undefined;
  this.scanToken = undefined;
  // ... existing assignments

  // State management methods
  this.pushState = undefined;
  this.popState = undefined;
  this.getState = undefined;
  this.isInJSX = undefined;
} as unknown as ILexer;
```

**Success Criteria:**

```
[ ] State initialized to Normal
[ ] StateStack initialized to empty array
[ ] Method stubs added
[ ] Code compiles
```

---

### Phase 2.3: State Management Functions

**File:** `src/lexer/prototypes/push-state.ts` (NEW)

```typescript
/**
 * Push new state onto stack and activate it
 */

import type { ILexer, LexerStateEnum } from '../lexer.types.js';
import { Lexer } from '../lexer.js';

Lexer.prototype.pushState = function (this: ILexer, newState: LexerStateEnum): void {
  // Save current state to stack
  this.stateStack.push(this.state);

  // Activate new state
  this.state = newState;
};
```

**File:** `src/lexer/prototypes/pop-state.ts` (NEW)

```typescript
/**
 * Pop state from stack and restore previous state
 */

import type { ILexer } from '../lexer.types.js';
import { Lexer } from '../lexer.js';
import { LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.popState = function (this: ILexer): void {
  // Pop previous state
  const previousState = this.stateStack.pop();

  // Restore it, or default to Normal
  this.state = previousState !== undefined ? previousState : LexerStateEnum.Normal;
};
```

**File:** `src/lexer/prototypes/get-state.ts` (NEW)

```typescript
/**
 * Get current lexer state
 */

import type { ILexer, LexerStateEnum } from '../lexer.types.js';
import { Lexer } from '../lexer.js';

Lexer.prototype.getState = function (this: ILexer): LexerStateEnum {
  return this.state;
};
```

**File:** `src/lexer/prototypes/is-in-jsx.ts` (NEW)

```typescript
/**
 * Check if lexer is in any JSX context
 */

import type { ILexer } from '../lexer.types.js';
import { Lexer } from '../lexer.js';
import { LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.isInJSX = function (this: ILexer): boolean {
  return this.state === LexerStateEnum.InsideJSX || this.state === LexerStateEnum.InsideJSXText;
};
```

**File:** `src/lexer/index.ts` - Add imports

```typescript
import './prototypes/push-state.js';
import './prototypes/pop-state.js';
import './prototypes/get-state.js';
import './prototypes/is-in-jsx.js';
```

**Success Criteria:**

```
[ ] 4 files created
[ ] Each has ONE function
[ ] Prototype pattern used
[ ] NO `any` types
[ ] Imported in index.ts
[ ] Code compiles
```

---

### Phase 2.4: State Transitions in scan-token.ts

**File:** `src/lexer/prototypes/scan-token.ts`

**Add State-Aware Dispatching:**

**After line 15 (before ch = this.peek()):**

```typescript
// Check state for context-aware scanning
const currentState = this.getState();

// Handle JSX text content
if (currentState === LexerStateEnum.InsideJSXText) {
  return this.scanJSXText();
}
```

**In switch case for '<' (around line 140):**

```typescript
case '<':
  // Detect JSX opening tag: <div or </div
  const nextCh = this.peek(1);

  if (nextCh === '/') {
    // Closing tag: </div>
    this.addToken(TokenTypeEnum.LT, '<');
    // Stay in current state, closing tag will transition
    return;
  } else if (isAlpha(nextCh)) {
    // Opening tag: <div
    this.addToken(TokenTypeEnum.LT, '<');
    // Transition to InsideJSX
    this.pushState(LexerStateEnum.InsideJSX);
    return;
  } else {
    // Less than operator: <
    this.addToken(TokenTypeEnum.LT, '<');
    return;
  }
```

**In switch case for '>' (around line 150):**

```typescript
case '>':
  this.addToken(TokenTypeEnum.GT, '>');

  // If we were InsideJSX, transition to InsideJSXText
  if (this.getState() === LexerStateEnum.InsideJSX) {
    this.popState(); // Remove InsideJSX
    this.pushState(LexerStateEnum.InsideJSXText); // Enter text mode
  }
  return;
```

**In switch case for '{' (around line 45):**

```typescript
case '{':
  this.addToken(TokenTypeEnum.LBRACE, '{');

  // If in JSX text, switch to Normal for expression
  if (this.getState() === LexerStateEnum.InsideJSXText) {
    this.pushState(LexerStateEnum.Normal);
  }
  return;
```

**In switch case for '}' (around line 54):**

```typescript
case '}':
  this.addToken(TokenTypeEnum.RBRACE, '}');

  // If we pushed Normal for JSX expression, pop back
  if (this.stateStack.length > 0 &&
      this.stateStack[this.stateStack.length - 1] === LexerStateEnum.InsideJSXText) {
    this.popState(); // Back to InsideJSXText
  }
  return;
```

**Success Criteria:**

```
[ ] State transitions added
[ ] < detection checks for JSX
[ ] > transitions to InsideJSXText
[ ] { pushes Normal in JSX
[ ] } pops back to JSX
[ ] Code compiles
[ ] State diagram documented
```

---

### Phase 2.5: State Diagram Documentation

**File:** `src/lexer/STATE-MACHINE.md` (NEW)

````markdown
# Lexer State Machine

## States

1. **Normal** - Regular JavaScript/TypeScript code
2. **InsideJSX** - Inside JSX tag: `<div className="foo">`
3. **InsideJSXText** - Between JSX tags: `<div>TEXT</div>`

## Transitions

\```
Normal
└─ sees '<' + identifier → InsideJSX

InsideJSX
├─ sees '>' → InsideJSXText
├─ sees '/>' → Normal
└─ sees '{' → push(Normal)

InsideJSXText
├─ sees '<' + '/' → InsideJSX (closing tag)
├─ sees '<' + identifier → InsideJSX (nested opening)
├─ sees '{' → push(Normal)
└─ scans text until boundary

Normal (in JSX)
└─ sees '}' → pop() back to InsideJSXText
\```

## Examples

### Simple Element

\```

<div>Hello</div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ scan "Hello" → '</' → InsideJSX → '>' → Normal
\```

### With Expression

\```

<div>{count()}</div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ '{' → push(Normal) → scan tokens → '}' → pop(InsideJSXText)
→ '</' → InsideJSX → '>' → Normal
\```

### Nested

\```

<div><span>Text</span></div>

Normal → '<' → InsideJSX → '>' → InsideJSXText
→ '<' → InsideJSX → '>' → InsideJSXText → scan "Text"
→ '</' → InsideJSX → '>' → InsideJSXText
→ '</' → InsideJSX → '>' → Normal
\```
````

**Success Criteria:**

```
[ ] State diagram documented
[ ] All transitions documented
[ ] Examples provided
[ ] Edge cases covered
```

---

## PHASE 3: JSX TEXT SCANNING (1 day)

**Objective:** Implement JSX text content tokenization

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 1 day  
**Complexity:** MEDIUM  
**Risk:** LOW

### Phase 3.1: JSX Text Scanner Implementation

**File:** `src/lexer/prototypes/scan-jsx-text.ts` (NEW)

```typescript
/**
 * Scan JSX text content between tags
 * Handles Unicode, emoji, whitespace correctly
 */

import type { ILexer } from '../lexer.types.js';
import { Lexer } from '../lexer.js';
import { TokenTypeEnum, LexerStateEnum } from '../lexer.types.js';

Lexer.prototype.scanJSXText = function (this: ILexer): void {
  const start = this.pos;
  const startLine = this.line;
  const startColumn = this.column;
  let text = '';

  // Scan until we hit a JSX boundary
  while (!this.isAtEnd()) {
    const ch = this.peek();
    const nextCh = this.peek(1);

    // Stop at opening tag: <div
    if (ch === '<' && isAlpha(nextCh)) {
      break;
    }

    // Stop at closing tag: </div
    if (ch === '<' && nextCh === '/') {
      break;
    }

    // Stop at self-closing: />
    if (ch === '/' && nextCh === '>') {
      break;
    }

    // Stop at expression start: {
    if (ch === '{') {
      break;
    }

    // Accumulate text (including Unicode/emoji)
    text += ch;
    this.advance();
  }

  // Only add token if we have non-empty text
  if (text.length > 0) {
    // Trim whitespace but preserve internal spaces
    const trimmed = text.trim();

    if (trimmed.length > 0) {
      this.addToken(TokenTypeEnum.JSX_TEXT, trimmed);
    }
  }

  // Transition out of JSX text if we hit a boundary
  // The next scanToken will handle the boundary token
  if (this.getState() === LexerStateEnum.InsideJSXText) {
    this.popState(); // Exit InsideJSXText
  }
};

// Helper: Check if character is alphabetic (for JSX tag detection)
function isAlpha(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 // _
  );
}
```

**File:** `src/lexer/index.ts` - Add import

```typescript
import './prototypes/scan-jsx-text.js';
```

**Success Criteria:**

```
[ ] File created
[ ] ONE function (scanJSXText)
[ ] Prototype pattern used
[ ] NO `any` types
[ ] Handles Unicode correctly
[ ] Handles emoji correctly
[ ] Handles whitespace correctly
[ ] Stops at JSX boundaries
[ ] Transitions state correctly
[ ] Imported in index.ts
[ ] Code compiles
```

---

### Phase 3.2: JSX Text Tests

**File:** `src/__tests__/lexer/jsx-text.test.ts` (NEW)

```typescript
/**
 * Tests for JSX text content scanning
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { TokenTypeEnum } from '../../lexer/lexer.types.js';

describe('Lexer - JSX Text', () => {
  it('should scan basic JSX text', () => {
    const source = '<div>Hello World</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    // Find JSX_TEXT token
    const textToken = tokens.find((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textToken).toBeDefined();
    expect(textToken?.value).toBe('Hello World');
  });

  it('should scan JSX text with emoji', () => {
    const source = '<span>🔥 Fire</span>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textToken = tokens.find((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textToken).toBeDefined();
    expect(textToken?.value).toContain('🔥');
    expect(textToken?.value).toContain('Fire');
  });

  it('should scan JSX text with Unicode', () => {
    const source = '<div>Hello 世界</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textToken = tokens.find((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textToken).toBeDefined();
    expect(textToken?.value).toContain('世界');
  });

  it('should handle text with expressions', () => {
    const source = '<div>Before {expr} After</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textTokens = tokens.filter((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textTokens.length).toBe(2);
    expect(textTokens[0].value).toBe('Before');
    expect(textTokens[1].value).toBe('After');
  });

  it('should handle nested JSX text', () => {
    const source = '<div>Outer<span>Inner</span>More</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textTokens = tokens.filter((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textTokens.length).toBe(3);
    expect(textTokens[0].value).toBe('Outer');
    expect(textTokens[1].value).toBe('Inner');
    expect(textTokens[2].value).toBe('More');
  });

  it('should trim whitespace but preserve internal spaces', () => {
    const source = '<div>  Hello   World  </div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textToken = tokens.find((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textToken?.value).toBe('Hello   World');
  });

  it('should handle empty JSX elements', () => {
    const source = '<div></div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();

    const textTokens = tokens.filter((t) => t.type === TokenTypeEnum.JSX_TEXT);

    expect(textTokens.length).toBe(0);
  });
});
```

**Run Tests:**

```bash
cd packages/pulsar-transformer
pnpm test jsx-text
```

**Success Criteria:**

```
[ ] All 7 tests created
[ ] All 7 tests pass
[ ] Tests cover edge cases
[ ] Tests verify Unicode
[ ] Tests verify emoji
[ ] Tests verify whitespace
[ ] Tests verify nested elements
```

---

## PHASE 4: PARSER SIMPLIFICATION (1 day)

**Objective:** Simplify parser to consume JSX_TEXT tokens

**Priority:** 🟡 HIGH  
**Estimated Time:** 1 day  
**Complexity:** LOW  
**Risk:** LOW

### Phase 4.1: Parser Update

**File:** `src/parser/prototypes/parse-jsx-element.ts`

**Current Lines 48-110:** Complex text accumulation logic

**Replace With:**

```typescript
// In parseJSXElement children parsing loop, AFTER comment skip:

// JSX Text Content (from lexer)
if (this.match(TokenTypeEnum.JSX_TEXT)) {
  const token = this.advance();
  children.push({
    type: 'JSXText',
    value: token.value,
    raw: token.value, // Use value as raw since lexer already handled it
    start: token.start,
    end: token.end,
  });
  continue;
}
```

**Remove:** Lines 48-110 (old text accumulation logic)

**Success Criteria:**

```
[ ] Complex text logic removed
[ ] Simple JSX_TEXT consumption added
[ ] Code compiles
[ ] Parser tests pass
```

---

### Phase 4.2: Parser JSX Tests

**File:** `src/__tests__/parser/jsx-text.test.ts` (NEW)

```typescript
/**
 * Tests for parser JSX text handling
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';

describe('Parser - JSX Text', () => {
  it('should parse JSX element with text', () => {
    const source = '<div>Hello</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens, 'test.psr');
    const element = parser.parseJSXElement();

    expect(element.type).toBe('JSXElement');
    expect(element.children.length).toBe(1);
    expect(element.children[0].type).toBe('JSXText');
    expect(element.children[0].value).toBe('Hello');
  });

  it('should parse JSX element with emoji', () => {
    const source = '<span>🔥 Test</span>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens, 'test.psr');
    const element = parser.parseJSXElement();

    expect(element.children[0].value).toContain('🔥');
  });

  it('should parse JSX with text and expressions', () => {
    const source = '<div>Text {expr} More</div>';
    const lexer = createLexer(source, 'test.psr');
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens, 'test.psr');
    const element = parser.parseJSXElement();

    expect(element.children.length).toBe(3);
    expect(element.children[0].type).toBe('JSXText');
    expect(element.children[1].type).toBe('JSXExpressionContainer');
    expect(element.children[2].type).toBe('JSXText');
  });
});
```

**Success Criteria:**

```
[ ] All tests created
[ ] All tests pass
[ ] Parser handles lexer JSX_TEXT
[ ] Parser handles Unicode/emoji
[ ] Parser handles mixed content
```

---

## PHASE 5: INTEGRATION & VALIDATION (1 day)

**Objective:** End-to-end validation with real PSR files

**Priority:** 🟡 HIGH  
**Estimated Time:** 1 day  
**Complexity:** LOW  
**Risk:** LOW

### Phase 5.1: Golden Test Updates

**Update Existing Golden Tests** to handle JSX text:

**File:** `src/__tests__/transformer/golden-counter.test.ts`

- Verify transformation still works
- Add check for JSX_TEXT handling

**File:** `src/__tests__/transformer/golden-badge.test.ts`

- Verify transformation still works
- Add check for text content

**File:** `src/__tests__/transformer/golden-drawer.test.ts`

- Verify transformation still works
- Add check for complex JSX

**Success Criteria:**

```
[ ] All 3 golden tests still pass
[ ] No regressions introduced
[ ] JSX text handling verified
```

---

### Phase 5.2: Real PSR File Tests

**Test Files:**

1. `test-simple.psr` - Basic component
2. `lab/counter.psr` - Has emoji, text
3. `showcase/pages/home.psr` - Complex JSX
4. `showcase/pages/about.psr` - Lists, text

**Procedure:**

1. Build transformer: `pnpm run build`
2. Start dev server: `cd pulsar-ui.dev; pnpm dev`
3. Open http://localhost:3000/
4. Check each route/component
5. Verify console has no errors
6. Verify visible content correct

**Success Criteria:**

```
[ ] test-simple.psr renders
[ ] counter.psr renders with emoji
[ ] home.psr renders completely
[ ] about.psr renders lists
[ ] All text content visible
[ ] All emojis display correctly
[ ] No console errors
[ ] No terminal errors
[ ] HMR works on file changes
```

---

### Phase 5.3: Documentation Updates

**File:** `docs/2026-02-10-EXHAUSTIVE-TRANSFORMATION-ANALYSIS.md`

**Add Section:** "POST-IMPLEMENTATION RESULTS"

```markdown
## POST-IMPLEMENTATION RESULTS

**Date:** 2026-02-10 [TIME]

### Issues Fixed

1. ✅ Parser keyword attribute conflict - RESOLVED
2. ✅ Parser JSX comment handling - RESOLVED
3. ✅ Lexer state machine - IMPLEMENTED
4. ✅ Lexer JSX text scanning - IMPLEMENTED
5. ✅ Unicode/emoji support - IMPLEMENTED

### Current Status

| Phase                | Status  | Tests       |
| -------------------- | ------- | ----------- |
| Phase 1: Lexer       | ✅ 100% | X/X passing |
| Phase 2: Parser      | ✅ 100% | X/X passing |
| Phase 3: Semantic    | ✅ 100% | X/X passing |
| Phase 4: Transformer | ✅ 100% | X/X passing |
| Phase 5: CodeGen     | ✅ 100% | X/X passing |

### Browser Validation

- ✅ test-simple.psr renders
- ✅ counter.psr renders with emoji
- ✅ home.psr renders completely
- ✅ about.psr renders lists
- ✅ main.psr routes work

### Remaining Work

[List any remaining issues, or NONE]
```

**Success Criteria:**

```
[ ] Analysis doc updated
[ ] Results documented
[ ] Tests results recorded
[ ] Known issues listed (or NONE)
```

---

## TIMELINE & MILESTONES

### Day 1

**Morning (4 hours):**

- Phase 1.1: Parser keyword flexibility
- Phase 1.2: Parser comment skip
- Phase 1.3: Integration test

**Milestone:** ✅ test-simple.psr renders in browser

**Afternoon (4 hours):**

- Phase 2.1: Type definitions
- Phase 2.2: Lexer constructor
- Phase 2.3: State management functions

**Milestone:** ✅ State machine infrastructure complete

---

### Day 2

**Morning (4 hours):**

- Phase 2.4: State transitions
- Phase 2.5: State diagram documentation
- Testing state transitions

**Milestone:** ✅ State machine working

**Afternoon (4 hours):**

- Phase 3.1: JSX text scanner
- Phase 3.2: JSX text tests

**Milestone:** ✅ JSX text tokenization working

---

### Day 3

**Morning (4 hours):**

- Phase 4.1: Parser simplification
- Phase 4.2: Parser JSX tests
- Integration testing

**Milestone:** ✅ Parser consumes JSX_TEXT

**Afternoon (4 hours):**

- Phase 5.1: Golden test updates
- Phase 5.2: Real PSR file tests
- Phase 5.3: Documentation

**Milestone:** ✅ All real files work

---

## RISK MITIGATION

### High Risk: State Machine Bugs

**Mitigation:**

- Document state diagram BEFORE coding
- Test each transition individually
- Add debug logging for state changes
- Validate state stack integrity

**Fallback:**

- Revert to simple flag: `isInJSX: boolean`
- Simplify to 2 states: Normal, JSX

---

### Medium Risk: Unicode Handling

**Mitigation:**

- Test with actual emoji in tests
- Test with various Unicode ranges
- Don't assume character widths
- Use string iteration, not indexing

**Fallback:**

- Accept all bytes until boundary
- Let browser handle rendering

---

### Low Risk: Performance

**Mitigation:**

- Profile with large PSR files
- Optimize hot paths
- Cache state checks

**Fallback:**

- Acceptable if < 2x slower
- Optimize after working

---

## SUCCESS CRITERIA

### Phase 1 Complete

```
[ ] Parser accepts keyword attributes
[ ] Parser skips JSX comments
[ ] test-simple.psr renders
[ ] All code compiles
[ ] No regressions in existing tests
```

### Phase 2 Complete

```
[ ] State machine implemented
[ ] All 4 state functions created
[ ] State transitions working
[ ] State diagram documented
[ ] State tests passing
```

### Phase 3 Complete

```
[ ] JSX text scanner implemented
[ ] Unicode/emoji support works
[ ] All JSX text tests pass
[ ] Lexer produces JSX_TEXT tokens
```

### Phase 4 Complete

```
[ ] Parser simplified
[ ] Parser consumes JSX_TEXT
[ ] All parser tests pass
[ ] Golden tests still pass
```

### Phase 5 Complete

```
[ ] All real PSR files transform
[ ] Browser renders all components
[ ] No console errors
[ ] No terminal errors
[ ] Documentation updated
```

---

## FINAL CHECKLIST

```
[ ] All phases complete
[ ] All tests passing (100%)
[ ] Code compiles (0 errors)
[ ] Supervision agent validated all checkpoints
[ ] Browser renders all components
[ ] No console errors
[ ] No terminal errors
[ ] Unicode/emoji display correctly
[ ] HMR works
[ ] State machine documented
[ ] Analysis doc updated
[ ] Git committed with clear message
```

---

## APPROVAL REQUIRED

**Read this plan completely.**

**Respond with:**

- "GO" to proceed with implementation
- "WAIT" with specific questions
- "CHANGE" with required modifications

**NO implementation until "GO" received.**

---

**Plan Status:** ⏸️ AWAITING APPROVAL  
**Author:** AI Agent  
**Date:** 2026-02-10 16:30
