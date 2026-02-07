# Lexer Context Design - Generic Type Support

**Created:** February 7, 2026  
**Session:** 4  
**Status:** Design Phase  
**Author:** AI Agent - Lexer Architecture Specialist

---

## 🎯 Problem Statement

The Pulsar Transformer lexer cannot distinguish between different meanings of `<` and `>` characters, blocking ~10-15 tests:

```typescript
// 1. Generic type parameter (BLOCKED)
interface IUser<T> { }         // ✅ Works in declaration
Promise<void>                  // ❌ BLOCKED - in function body
createSignal<IUser | null>()   // ❌ BLOCKED - in expression

// 2. Less-than operator (WORKS)
if (count < 10) { }            // ✅ Works correctly

// 3. JSX element opening (WORKS)
<div>Hello</div>               // ✅ Works correctly
```

**Root Cause:** The lexer tokenizes `<` as `LT` (less-than) in all contexts, causing the parser to fail when it expects generic type delimiters.

---

## 📊 Research Summary

### TypeScript Scanner Approach

**Strategy:** Parser feedback + re-scanning

```typescript
// Key methods:
reScanLessThanToken(): SyntaxKind     // Re-scan << back to <
reScanGreaterToken(): SyntaxKind      // Re-scan >>, >>>, etc.
speculationHelper()                   // Lookahead with state save/restore
lookAhead()                          // Peek ahead without committing

// How it works:
// 1. Lexer scans conservatively (always returns LT/GT)
// 2. Parser tries to parse as type
// 3. If fails, parser asks lexer to re-scan in different context
```

**Pros:**

- Conservative first pass - always safe
- Parser has ultimate control
- No complex lookahead in lexer

**Cons:**

- Requires tight parser-lexer coupling
- Multiple passes over same text
- Complex error recovery

---

### Babel Tokenizer Approach

**Strategy:** Context-aware tokenization + mode switching

```typescript
// Key state:
state.inType: boolean           // Are we parsing types?
state.context: TokContext[]     // Stack of parsing contexts

// Context types:
enum TokContext {
  brace,          // { in code
  j_oTag,         // <tag  in JSX
  j_cTag,         // </tag in JSX
  j_expr,         // <tag>... in JSX
}

// Key method in TypeScript plugin:
getTokenFromCode(code: number): void {
  if (this.state.inType) {
    if (code === charCodes.greaterThan) {
      this.finishOp(tt.gt, 1);  // Force GT token
      return;
    }
    if (code === charCodes.lessThan) {
      this.finishOp(tt.lt, 1);  // Force LT token
      return;
    }
  }
  super.getTokenFromCode(code);  // Default behavior
}

// Re-scanning method:
reScan_lt_gt(): void {
  // Called when exiting type context to fix token types
}
```

**Pros:**

- Single-pass tokenization
- Fast - no re-scanning in common case
- Clear separation of concerns

**Cons:**

- Parser must manage `inType` flag
- Potential for mode desync
- Requires plugin architecture

---

### SWC Parser Approach

**Strategy:** Context bitflags + compile-time optimization

```rust
// Context flags (bitflags for performance):
const InType = 1 << 12;
const ShouldNotLexLtOrGtAsType = 1 << 13;

// Key tokenization method:
fn read_token_lt_gt<const C: u8>(&mut self) -> LexResult<Token> {
  let start = self.cur_pos();
  self.bump();  // consume < or >

  // Check context flags:
  if self.syntax.typescript()
      && self.ctx.contains(Context::InType)
      && !self.ctx.contains(Context::ShouldNotLexLtOrGtAsType)
  {
    if C == b'<' { return Ok(Token::Lt); }   // Type bracket
    if C == b'>' { return Ok(Token::Gt); }   // Type bracket
  }

  // Otherwise, handle as comparison operator or shift operator
  // ... (check for <=, <<=, >>, >>>, etc.)
}

// Temporarily disable context:
fn do_outside_of_context<F, R>(&mut self, ctx: Context, f: F) -> R {
  let old = self.ctx;
  self.ctx.remove(ctx);
  let result = f(self);
  self.ctx = old;
  result
}
```

**Pros:**

- Extremely fast (bitflag operations)
- Compile-time generics (`<const C: u8>`)
- Clear context boundaries
- Explicit "escape hatch" for JSX

**Cons:**

- Requires parser to manage context flags
- Rust-specific optimizations

---

## 🏗️ Proposed Architecture for Pulsar Transformer

**Chosen Approach:** Hybrid of Babel and SWC

We'll use **context-aware tokenization** (like Babel) with **explicit context flags** (like SWC) but adapted for JavaScript/TypeScript:

### Core Design Principles

1. **Single-pass tokenization** - No re-scanning in common case
2. **Explicit context management** - Parser controls context via public API
3. **Backwards compatible** - Don't break existing working tests
4. **Simple first** - Start with boolean flag, optimize later if needed

---

## 🔄 Context State Machine

```
┌─────────────────────────────────────────┐
│         Lexer Context State             │
└─────────────────────────────────────────┘

Context Flags:
┌──────────────┐
│ _inTypeLevel │  (number, 0 = not in type, >0 = nested type depth)
└──────────────┘

State Transitions:
─────────────────

ENTER TYPE CONTEXT:
  Parser calls: lexer.enterTypeContext()
  Effect: _inTypeLevel++
  Example: After seeing 'interface Name' or 'type Alias' or '<T'

EXIT TYPE CONTEXT:
  Parser calls: lexer.exitTypeContext()
  Effect: _inTypeLevel--
  Example: After completing type body or '>'

MODES:
┌──────────────────────────────────────────────
│ Mode: CODE (_inTypeLevel === 0)
│ ────────────────────────────────────────
│ '<' → LT (comparison operator)
│ '>' → GT (comparison operator)
│ '<<' → LSHIFT
│ '>>' → RSHIFT
└──────────────────────────────────────────────

┌──────────────────────────────────────────────
│ Mode: TYPE (_inTypeLevel > 0)
│ ────────────────────────────────────────
│ '<' → LT (generic open)
│ '>' → GT (generic close)
│ '<<' → LT, LT (two separates)
│ '>>' → GT, GT (two separates)
└──────────────────────────────────────────────

┌──────────────────────────────────────────────
│ Mode: JSX (detected via lookahead)
│ ────────────────────────────────────────
│ '<' followed by identifier → JSX_OPEN
│ '</' → JSX_CLOSE_START
│ '>' in JSX → JSX_CLOSE
└──────────────────────────────────────────────
```

---

## 🔍 Lookahead Algorithm

```typescript
/**
 * Detect if '<' starts a generic type vs comparison operator
 *
 * Generic type patterns:
 *   <T>
 *   <T, U>
 *   <T extends Base>
 *   <IUser | null>
 *   <string | number>
 *
 * NOT generic (comparison):
 *   < 123
 *   < "string"
 *   < (expression)
 *   < function
 */
private _isGenericTypeStart(): boolean {
  // Already in type context? Trust the parser
  if (this._inTypeLevel > 0) {
    return true;
  }

  // Save position for backtrack
  const savedPos = this._pos;

  this._pos++; // Skip '<'
  this._skipWhitespace();

  const nextChar = this._peek();

  // Restore position
  this._pos = savedPos;

  // Check patterns:
  // 1. Identifier (likely type parameter)
  if (this._isIdentifierStart(nextChar)) {
    return true;
  }

  // 2. Closing bracket (fragment <> or <<)
  if (nextChar === '>') {
    // Could be JSX fragment <> or empty generic
    // Let parser decide - for now return false
    return false;
  }

  // 3. Keywords that can start types
  if (this._isTypeKeywordStart(nextChar)) {
    return true;  // e.g., <typeof expr>
  }

  // Everything else is likely comparison
  return false;
}

private _isTypeKeywordStart(char: string): boolean {
  // Check if we're about to see: typeof, keyof, infer, readonly, etc.
  const savedPos = this._pos;
  const word = this._readWord();
  this._pos = savedPos;

  return ['typeof', 'keyof', 'infer', 'readonly'].includes(word);
}
```

**Note:** This is **lightweight lookahead** (1-2 tokens max), not deep parsing.

---

## 🔢 Token Type Additions

**Option 1: Add new distinct token types (clearer)**

```typescript
export enum TokenType {
  // ... existing types ...

  // Generic type delimiters
  GENERIC_OPEN = 'GENERIC_OPEN', // < in generic context
  GENERIC_CLOSE = 'GENERIC_CLOSE', // > in generic context

  // Keep existing for backwards compatibility
  LT = 'LT', // < as less-than
  GT = 'GT', // > as greater-than
  // ...
}
```

**Option 2: Keep same tokens, add context metadata (simpler migration)**

```typescript
export interface IToken {
  type: TokenType;
  value: string;
  start: IPosition;
  end: IPosition;
  context?: TokenContext; // NEW: optional context hint
}

enum TokenContext {
  TYPE = 'TYPE', // Token appeared in type context
  EXPR = 'EXPR', // Token appeared in expression context
  JSX = 'JSX', // Token appeared in JSX context
}
```

**Recommendation:** Start with **Option 2** (metadata) for minimal breaking changes, migrate to **Option 1** if needed.

---

## 📝 Example Token Sequences

### Case 1: Generic Function Call (Currently Broken)

```typescript
// Source:
const signal = createSignal<IUser | null>(null);

// Current (WRONG) tokenization:
[
  CONST,
  IDENTIFIER('signal'),
  EQUALS,
  IDENTIFIER('createSignal'),
  LT, // ❌ Parser expects '(' next, gets '<'
  IDENTIFIER('IUser'),
  // ... parser is lost at this point
][
  // Expected tokenization WITH CONTEXT:
  (CONST,
  IDENTIFIER('signal'),
  EQUALS,
  IDENTIFIER('createSignal'),
  LT, // with context: TYPE (✅ parser recognizes generic)
  IDENTIFIER('IUser'),
  PIPE,
  NULL,
  GT, // with context: TYPE
  LPAREN,
  NULL,
  RPAREN,
  SEMICOLON)
];
```

### Case 2: Comparison Operator (Currently Works)

```typescript
// Source:
if (count < 10) {
}

// Current (CORRECT) tokenization:
[
  IF,
  LPAREN,
  IDENTIFIER('count'),
  LT, // ✅ Correctly identified as comparison
  NUMBER(10),
  RPAREN,
  LBRACE,
  RBRACE,
];

// Should NOT change!
```

### Case 3: JSX Element (Currently Works)

```typescript
// Source:
<div>Hello</div>

// Current (CORRECT) tokenization:
[
  JSX_OPEN, IDENTIFIER('div'), JSX_CLOSE,
  JSX_TEXT('Hello'),
  JSX_CLOSE_START, IDENTIFIER('div'), JSX_CLOSE
]

// Should NOT change!
```

### Case 4: Interface Function Types (Currently Broken)

```typescript
// Source:
interface IApiClient {
  fetch(): Promise<Response>;
}

// Current (WRONG) - Parser sees '<' inside interface body:
[
  INTERFACE,
  IDENTIFIER('IApiClient'),
  LBRACE,
  IDENTIFIER('fetch'),
  LPAREN,
  RPAREN,
  COLON,
  IDENTIFIER('Promise'),
  LT, // ❌ Parser lost - inside interface, expecting ';' or '}'
  // ... rest mis-tokenized
][
  // Expected WITH CONTEXT:
  (INTERFACE,
  IDENTIFIER('IApiClient'),
  LBRACE,
  // Parser enters TYPE context here ^
  IDENTIFIER('fetch'),
  LPAREN,
  RPAREN,
  COLON,
  IDENTIFIER('Promise'),
  LT, // with context: TYPE (✅ recognized as generic)
  IDENTIFIER('Response'),
  GT, // with context: TYPE
  SEMICOLON,
  RBRACE)
  // Parser exits TYPE context here ^
];
```

---

## 🔧 Implementation Plan

### Phase 1: Add Context Tracking (Low Risk)

**Files to modify:**

- `src/parser/lexer/lexer.ts`
- `src/parser/lexer/token.types.ts`

**Changes:**

```typescript
// lexer.ts
export class Lexer {
  private _inTypeLevel: number = 0;

  // Public API for parser
  public enterTypeContext(): void {
    this._inTypeLevel++;
  }

  public exitTypeContext(): void {
    this._inTypeLevel--;
    if (this._inTypeLevel < 0) {
      throw new Error('Type context underflow');
    }
  }

  public isInTypeContext(): boolean {
    return this._inTypeLevel > 0;
  }
}

// token.types.ts
export interface IToken {
  // ... existing fields ...
  context?: 'TYPE' | 'EXPR' | 'JSX'; // NEW
}
```

**Test:** Run full suite - should have zero regressions (context not used yet).

---

### Phase 2: Update `_scanLT()` to Use Context (Medium Risk)

**File:** `src/parser/lexer/lexer.ts`

**Current implementation:**

```typescript
private _scanLT(): IToken {
  this._pos++;

  // Check for compound operators
  if (this._peek() === '=') {
    this._pos++;
    return this._makeToken(TokenType.LTOQ, '<=');
  }
  if (this._peek() === '<') {
    this._pos++;
    if (this._peek() === '=') {
      this._pos++;
      return this._makeToken(TokenType.LSHIFT_EQ, '<<=');
    }
    return this._makeToken(TokenType.LSHIFT, '<<');
  }

  return this._makeToken(TokenType.LT, '<');
}
```

**Updated implementation:**

```typescript
private _scanLT(): IToken {
  this._pos++;

  // In type context, '<' is always a generic bracket, never a compound operator
  if (this._inTypeLevel > 0) {
    const token = this._makeToken(TokenType.LT, '<');
    token.context = 'TYPE';
    return token;
  }

  // Check for compound operators (only in code context)
  if (this._peek() === '=') {
    this._pos++;
    return this._makeToken(TokenType.LTOQ, '<=');
  }
  if (this._peek() === '<') {
    this._pos++;
    if (this._peek() === '=') {
      this._pos++;
      return this._makeToken(TokenType.LSHIFT_EQ, '<<=');
    }
    return this._makeToken(TokenType.LSHIFT, '<<');
  }

  return this._makeToken(TokenType.LT, '<');
}
```

**Test:** Run test suite - expect same failures as before (parser doesn't use context yet).

---

### Phase 3: Update Parser to Use Context (High Value)

**Files to modify:**

- `src/parser/prototype/parse-interface-declaration.ts`
- `src/parser/prototype/parse-variable-declaration.ts`
- Other files that parse types

**Pattern:**

```typescript
// Before:
private _parseInterfaceBody(): IInterfaceBody {
  this._expect('{');
  const members = [];
  while (!this._match('}')) {
    members.push(this._parseInterfaceMember());
  }
  this._expect('}');
  return { members };
}

// After:
private _parseInterfaceBody(): IInterfaceBody {
  this._expect('{');
  this._lexer.enterTypeContext();  // ← NEW

  const members = [];
  while (!this._match('}')) {
    members.push(this._parseInterfaceMember());
  }

  this._lexer.exitTypeContext();   // ← NEW
  this._expect('}');
  return { members };
}
```

**Test:** Run target tests:

```bash
npm test -- parse-interface-declaration  # Should see "function types" test pass
npm test -- union-types-e2e              # Should see "component signals" test pass
```

---

### Phase 4: Add Lookahead for Ambiguous Cases (Optional)

**Only if Phase 3 doesn't handle all cases**

Implement `_isGenericTypeStart()` as shown in Lookahead Algorithm section above.

Use in expression contexts where types might appear:

```typescript
// In parseUnaryExpression or parseCallExpression:
if (this._match('<')) {
  if (this._isGenericTypeStart()) {
    this._lexer.enterTypeContext();
    const typeArgs = this._parseTypeArguments();
    this._lexer.exitTypeContext();
    // ... continue parsing call expression with type args
  } else {
    // Parse as comparison operator
    // ...
  }
}
```

---

## 📊 Success Metrics

**Minimum Viable Success:**

- ✅ `parse-interface-declaration.test.ts` - "function types" test passes
- ✅ `union-types-e2e.test.ts` - "component signals" test passes
- ✅ Zero regressions (all currently passing tests still pass)

**Stretch Goals:**

- ✅ All generic type tests pass
- ✅ Nested generic types work (`Map<string, Set<number>>`)
- ✅ Generic constraints work (`T extends Base`)
- ✅ Performance: < 5% slowdown on large files

---

## ⚠️ Risk Mitigation

### Risk 1: Breaking JSX Parsing

**Mitigation:**

- JSX contexts already have separate token types (JSX_OPEN, JSX_CLOSE)
- Type context and JSX context are mutually exclusive
- Test JSX thoroughly after each change

**Tests to watch:**

- `parse-jsx-fragment.test.ts` (13/13 passing)
- All JSX-related tests

### Risk 2: Context Stack Desynchronization

**Mitigation:**

- Use try-finally to ensure context is exited:

```typescript
this._lexer.enterTypeContext();
try {
  return this._parseType();
} finally {
  this._lexer.exitTypeContext();
}
```

- Add assertions in lexer:

```typescript
public exitTypeContext(): void {
  if (this._inTypeLevel === 0) {
    throw new Error('Cannot exit type context: not in type context');
  }
  this._inTypeLevel--;
}
```

### Risk 3: Performance Degradation

**Mitigation:**

- Start with simple boolean check (O(1))
- Only add lookahead if absolutely necessary
- Benchmark large files before/after
- Target: < 5% slowdown

---

## 🔮 Future Optimizations

If performance becomes an issue:

1. **Bitflags** (like SWC):

```typescript
enum Context {
  None = 0,
  InType = 1 << 0,
  InJSX = 1 << 1,
  InClass = 1 << 2,
  // ...
}
private _context: Context = Context.None;
```

2. **Token Lookahead Cache:**

```typescript
private _lookaheadCache: Map<number, boolean> = new Map();
// Cache result of _isGenericTypeStart() by position
```

3. **Separate Token Types:**
   Migrate from context metadata to distinct `GENERIC_OPEN` / `GENERIC_CLOSE` tokens for clearer semantics.

---

## 📚 References

- TypeScript Scanner: `microsoft/TypeScript/src/compiler/scanner.ts`
- Babel Tokenizer: `babel/babel/packages/babel-parser/src/tokenizer/index.ts`
- SWC Lexer: `swc-project/swc/crates/swc_ecma_parser/src/lexer/mod.rs`
- Session 3 Implementation Report: `SESSION-3-IMPLEMENTATION-REPORT.md`
- Session 3 Framework Intelligence: `FRAMEWORK-INTELLIGENCE-REPORT-SESSION-3.md`

---

**Status:** Design Complete - Ready for Implementation  
**Next Step:** Implement Phase 1 (Context Tracking)  
**Blocked:** None  
**Estimate:** 6-8 hours total implementation + testing
