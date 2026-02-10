# Phase 1: Lexer Implementation Plan

**Date:** 2026-02-10 21:05  
**Goal:** Tokenize counter.psr to enable Test 1 to pass  
**Status:** Planning

---

## Objective

Build complete lexer that converts PSR source code → token stream.

**Target:** Tokenize [01-counter.psr](../../tests/fixtures/real-psr/01-counter.psr)

---

## Required Token Types

From counter.psr analysis:

```psr
import { createSignal } from '@pulsar-framework/pulsar.dev';

export interface ICounterProps {
  id?: string;
}

export component Counter({id}: ICounterProps) {
  const [count, setCount] = createSignal(0);
  // ...
  return (
    <div>
      <h2>Counter: {count()}</h2>
    </div>
  );
}
```

**Tokens needed:**

- Keywords: `import`, `from`, `export`, `interface`, `component`, `const`, `return`
- Identifiers: `createSignal`, `ICounterProps`, `Counter`, `count`, `setCount`
- Operators: `=`, `=>`, `:`, `?`, `+`, `(`, `)`, `{`, `}`, `[`, `]`
- Literals: strings (`'...'`), numbers (`0`, `1`)
- JSX: `<`, `>`, `/`, `<div>`, `</div>`, `{...}`
- Comments: `/** ... */`, `//`

---

## Lexer Architecture

**Prototype-based class structure:**

```
src/lexer/
  lexer.ts              ← Lexer constructor + core loop
  lexer.types.ts        ← ILexer interface, Token types
  prototypes/
    scan-token.ts       ← Main scanning function
    scan-identifier.ts  ← Identifier/keyword scanning
    scan-string.ts      ← String literal scanning
    scan-number.ts      ← Number scanning
    scan-jsx.ts         ← JSX token detection
    scan-comment.ts     ← Comment handling
    is-keyword.ts       ← Keyword recognition
    add-token.ts        ← Token creation
```

---

## Token Type Enum

```typescript
enum TokenType {
  // Keywords
  IMPORT = 'IMPORT',
  FROM = 'FROM',
  EXPORT = 'EXPORT',
  INTERFACE = 'INTERFACE',
  COMPONENT = 'COMPONENT',
  CONST = 'CONST',
  RETURN = 'RETURN',

  // Identifiers & Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Operators
  EQUALS = 'EQUALS',
  ARROW = 'ARROW',
  COLON = 'COLON',
  QUESTION = 'QUESTION',
  PLUS = 'PLUS',

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LT = 'LT',
  GT = 'GT',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',

  // JSX
  JSX_TAG_START = 'JSX_TAG_START', // <div
  JSX_TAG_END = 'JSX_TAG_END', // >
  JSX_TAG_CLOSE = 'JSX_TAG_CLOSE', // </div>
  JSX_SELF_CLOSE = 'JSX_SELF_CLOSE', // />
  JSX_EXPR_START = 'JSX_EXPR_START', // {
  JSX_EXPR_END = 'JSX_EXPR_END', // }
  JSX_TEXT = 'JSX_TEXT', // text content

  // Special
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}
```

---

## Implementation Steps

### Step 1: Core Lexer Structure

**Files to create:**

- `src/lexer/lexer.types.ts` - TokenType enum, IToken, ILexer
- `src/lexer/lexer.ts` - Constructor, main loop

**Functionality:**

- Character-by-character scanning
- Position tracking (line, column)
- Token buffer

### Step 2: Basic Token Scanning

**Files to create:**

- `src/lexer/prototypes/scan-token.ts` - Main switch/case logic
- `src/lexer/prototypes/add-token.ts` - Token creation with position

**Functionality:**

- Recognize single-char tokens: `(`, `)`, `{`, `}`, etc.
- Handle whitespace
- Detect EOF

### Step 3: Identifier & Keyword Scanning

**Files to create:**

- `src/lexer/prototypes/scan-identifier.ts` - [a-zA-Z\_][a-zA-Z0-9_]\*
- `src/lexer/prototypes/is-keyword.ts` - Keyword lookup

**Functionality:**

- Scan identifiers
- Distinguish keywords from identifiers
- Handle reserved words

### Step 4: Literal Scanning

**Files to create:**

- `src/lexer/prototypes/scan-string.ts` - String literals ('...' or "...")
- `src/lexer/prototypes/scan-number.ts` - Number literals (0-9)

**Functionality:**

- String escape sequences
- Number formats (int, float)

### Step 5: JSX Token Detection

**Files to create:**

- `src/lexer/prototypes/scan-jsx.ts` - JSX context detection

**Functionality:**

- Detect JSX opening tags `<div`
- Detect JSX closing tags `</div>`
- Detect self-closing `<div />`
- Detect JSX expressions `{...}`

### Step 6: Comment Handling

**Files to create:**

- `src/lexer/prototypes/scan-comment.ts` - Single/multi-line comments

**Functionality:**

- `//` single-line
- `/* */` multi-line
- JSDoc comments `/** */`

---

## Test Approach

**Unit tests per prototype function:**

```
src/lexer/__tests__/
  scan-identifier.test.ts
  scan-string.test.ts
  scan-number.test.ts
  scan-jsx.test.ts
```

**Integration test:**

```typescript
const lexer = new Lexer('component Counter() {}');
const tokens = lexer.scanTokens();
expect(tokens).toMatchSnapshot();
```

---

## Success Criteria

✅ Lexer can tokenize complete counter.psr  
✅ All token types recognized  
✅ Position tracking accurate  
✅ JSX detection working  
✅ No stubs or TODOs

---

## Time Estimate

- Step 1: 30min (core structure)
- Step 2: 30min (basic tokens)
- Step 3: 30min (identifiers/keywords)
- Step 4: 30min (literals)
- Step 5: 45min (JSX - complex)
- Step 6: 20min (comments)
- Testing: 30min

**Total: ~3.5 hours**

---

## Next Action

Begin Step 1: Create core lexer structure with types and constructor.
