# Lexer & Tokenization Patterns

**Research from: TypeScript, Babel, SWC, Solid.js, Svelte, Vue**

---

## Core Concepts

### What is Lexical Analysis?

Lexical analysis (lexing/tokenization is the first phase of compilation where source code text is converted into a sequence of tokens. Each token represents a meaningful unit like a keyword, identifier, operator, or literal.

**Example PSR → Tokens:**

```psr
component Counter() {
  const [count, setCount] = signal(0);
}
```

**Tokens:**

```
COMPONENT, IDENTIFIER(Counter), LPAREN, RPAREN, LBRACE,
CONST, LBRACKET, IDENTIFIER(count), COMMA, IDENTIFIER(setCount), RBRACKET,
EQUALS, IDENTIFIER(signal), LPAREN, NUMBER(0), RPAREN, SEMICOLON,
RBRACE
```

---

## Token Types (Industry Standard)

### From TypeScript Compiler

1. **Keywords**: `const`, `let`, `var`, `function`, `class`, `if`, `else`, `return`, etc.
2. **Identifiers**: Variable/function names
3. **Literals**: Numbers, strings, booleans, null, undefined
4. **Operators**: `+`, `-`, `*`, `/`, `=`, `==`, `===`, `=>`, etc.
5. **Punctuation**: `{`, `}`, `(`, `)`, `[`, `]`, `;`, `,`, `.`
6. **Comments**: Single-line `//`, multi-line `/* */`
7. **Whitespace**: Spaces, tabs, newlines (usually ignored but tracked for positions)

### Framework-Specific Tokens

**Solid.js/Pulsar:**

- `signal`, `createSignal`, `createEffect`, `createMemo`
- JSX tokens: `<`, `>`, `</`, `/>`

**Svelte:**

- `$:` (reactive declarations)
- `bind:`, `on:`, `use:` (directives)

---

## Lexer Architecture Patterns

### Pattern 1: Character-by-Character Scanning (TypeScript, Babel)

```typescript
interface ILexer {
  pos: number;
  source: string;
  ch: string;

  advance(): void;
  peek(offset?: number): string;
  scanToken(): IToken;
}

function scanToken(lexer: ILexer): IToken {
  skipWhitespace(lexer);

  const start = lexer.pos;
  const ch = lexer.ch;

  // Identifiers & Keywords
  if (isIdentifierStart(ch)) {
    return scanIdentifier(lexer, start);
  }

  // Numbers
  if (isDigit(ch)) {
    return scanNumber(lexer, start);
  }

  // Strings
  if (ch === '"' || ch === "'") {
    return scanString(lexer, start, ch);
  }

  // Operators & Punctuation
  switch (ch) {
    case '+':
      lexer.advance();
      return createToken(TokenType.Plus, start);
    case '-':
      lexer.advance();
      return createToken(TokenType.Minus, start);
    case '=':
      lexer.advance();
      if (lexer.ch === '=') {
        lexer.advance();
        if (lexer.ch === '=') {
          lexer.advance();
          return createToken(TokenType.EqualsEqualsEquals, start);
        }
        return createToken(TokenType.EqualsEquals, start);
      }
      return createToken(TokenType.Equals, start);
    // ... more cases
  }
}
```

### Pattern 2: Regex-Based Scanning (Simple but slower)

```typescript
const tokenPatterns: Array<[TokenType, RegExp]> = [
  [TokenType.Identifier, /^[a-zA-Z_$][a-zA-Z0-9_$]*/],
  [TokenType.Number, /^[0-9]+(\.[0-9]+)?/],
  [TokenType.String, /^"([^"\\]|\\.)*"/],
  [TokenType.Whitespace, /^\s+/],
];

function scanWithRegex(source: string, pos: number): IToken | null {
  for (const [type, pattern] of tokenPatterns) {
    const match = source.slice(pos).match(pattern);
    if (match) {
      return {
        type,
        value: match[0],
        start: pos,
        end: pos + match[0].length,
      };
    }
  }
  return null;
}
```

### Pattern 3: State Machine (Complex tokens, JSX)

```typescript
enum LexerState {
  Normal,
  InsideJSX,
  InsideJSXText,
  InsideJSXAttribute,
  InsideTemplateLiteral,
  InsideComment,
}

interface IStatefulLexer {
  state: LexerState;
  stateStack: LexerState[];

  pushState(state: LexerState): void;
  popState(): void;
  scanInCurrentState(): IToken;
}

function scanInCurrentState(lexer: IStatefulLexer): IToken {
  switch (lexer.state) {
    case LexerState.Normal:
      return scanNormalToken(lexer);
    case LexerState.InsideJSX:
      return scanJSXToken(lexer);
    case LexerState.InsideJSXText:
      return scanJSXText(lexer);
    case LexerState.InsideTemplateLiteral:
      return scanTemplateLiteralPart(lexer);
    // ...
  }
}
```

---

## JSX Tokenization (Critical for Pulsar)

### JSX State Transitions

**From Solid.js Babel Plugin:**

```
Normal State:
  - See '<' → Check if identifier follows → Transition to JSX

JSX Tag State:
  - '<Counter' → JSX_OPEN_TAG
  - 'count={value}' → JSX_ATTRIBUTE + LBRACE → Normal (for expression) → RBRACE
  - '/>' → JSX_SELF_CLOSE_TAG
  - '>' → Transition to JSX_TEXT

JSX Text State:
  - Regular text → JSX_TEXT
  - '{' → Transition to Normal (for expression)
  - '<' → Check if '/' follows → JSX_CLOSE_TAG or nested JSX_OPEN_TAG

JSX Closing Tag:
  - '</Counter>' → JSX_CLOSE_TAG
```

### JSX Token Types

```typescript
enum JSXTokenType {
  JSX_OPEN_TAG, // '<div'
  JSX_CLOSE_TAG, // '</div>'
  JSX_SELF_CLOSE, // '/>'
  JSX_ATTRIBUTE_NAME, // 'className'
  JSX_ATTRIBUTE_VALUE, // '"my-class"'
  JSX_TEXT, // 'Hello World'
  JSX_EXPRESSION_START, // '{'
  JSX_EXPRESSION_END, // '}'
  JSX_SPREAD, // '{...props}'
}
```

### JSX Lexer Example

```typescript
function scanJSXToken(lexer: ILexer): IToken {
  skipWhitespace(lexer);

  const ch = lexer.ch;
  const start = lexer.pos;

  // Opening tag
  if (ch === '<') {
    lexer.advance();
    if (lexer.ch === '/') {
      lexer.advance();
      const name = scanJSXIdentifier(lexer);
      expectChar(lexer, '>');
      return createJSXToken(JSXTokenType.JSX_CLOSE_TAG, start, name);
    } else {
      const name = scanJSXIdentifier(lexer);
      return createJSXToken(JSXTokenType.JSX_OPEN_TAG, start, name);
    }
  }

  // Self-closing
  if (ch === '/' && lexer.peek() === '>') {
    lexer.advance(); // '/'
    lexer.advance(); // '>'
    return createJSXToken(JSXTokenType.JSX_SELF_CLOSE, start);
  }

  // Expression start
  if (ch === '{') {
    lexer.advance();
    lexer.pushState(LexerState.Normal); // Switch to JS mode
    return createJSXToken(JSXTokenType.JSX_EXPRESSION_START, start);
  }

  // Text content (outside tags)
  if (lexer.state === LexerState.InsideJSXText) {
    return scanJSXText(lexer, start);
  }

  // Attribute scanning
  return scanJSXAttribute(lexer, start);
}

function scanJSXText(lexer: ILexer, start: number): IToken {
  let text = '';

  // Scan until we hit '{' or '<'
  while (lexer.ch !== '{' && lexer.ch !== '<' && !isEOF(lexer)) {
    text += lexer.ch;
    lexer.advance();
  }

  return createJSXToken(JSXTokenType.JSX_TEXT, start, text);
}
```

---

## Template Literal Tokenization

**Critical for PSR** - Template literals with `${}` expressions

```typescript
function scanTemplateLiteral(lexer: ILexer): IToken {
  const start = lexer.pos;
  let parts: Array<string | IExpression> = [];
  let currentString = '';

  lexer.advance(); // Skip opening backtick

  while (lexer.ch !== '`' && !isEOF(lexer)) {
    if (lexer.ch === '$' && lexer.peek() === '{') {
      // Save current string part
      parts.push(currentString);
      currentString = '';

      // Scan expression
      lexer.advance(); // '$'
      lexer.advance(); // '{'
      lexer.pushState(LexerState.Normal);

      const exprTokens = [];
      while (lexer.ch !== '}') {
        exprTokens.push(scanToken(lexer));
      }

      parts.push({ type: 'expression', tokens: exprTokens });

      lexer.advance(); // '}'
      lexer.popState();
    } else if (lexer.ch === '\\') {
      // Handle escape sequences
      lexer.advance();
      currentString += handleEscapeSequence(lexer);
    } else {
      currentString += lexer.ch;
      lexer.advance();
    }
  }

  parts.push(currentString);
  lexer.advance(); // Skip closing backtick

  return {
    type: TokenType.TemplateLiteral,
    parts,
    start,
    end: lexer.pos,
  };
}
```

---

## Position Tracking (Source Maps)

### Position Information Structure

```typescript
interface IPosition {
  line: number; // 1-based
  column: number; // 0-based
  offset: number; // Character offset from start
}

interface IToken {
  type: TokenType;
  value: string;
  start: IPosition;
  end: IPosition;
  raw?: string; // Original text including quotes, escapes
}
```

### Line/Column Tracking

```typescript
function trackPosition(lexer: ILexer): void {
  if (lexer.ch === '\n') {
    lexer.line++;
    lexer.column = 0;
    lexer.lineStart = lexer.pos + 1;
  } else if (lexer.ch === '\r') {
    // Handle CRLF
    if (lexer.peek() === '\n') {
      lexer.advance(); // Skip \r
    }
    lexer.line++;
    lexer.column = 0;
    lexer.lineStart = lexer.pos + 1;
  } else {
    lexer.column++;
  }

  lexer.pos++;
  lexer.ch = lexer.source[lexer.pos];
}
```

---

## Performance Optimizations

### From SWC (Fastest JS Compiler)

1. **Character Classification Arrays**

```typescript
// Pre-compute character types for O(1) lookup
const charTypes = new Uint8Array(128);

const IDENT_START = 1;
const IDENT_PART = 2;
const DIGIT = 4;
const WHITESPACE = 8;

// Initialize
for (let i = 0; i < 128; i++) {
  if (i >= 65 && i <= 90) charTypes[i] |= IDENT_START | IDENT_PART; // A-Z
  if (i >= 97 && i <= 122) charTypes[i] |= IDENT_START | IDENT_PART; // a-z
  if (i === 95 || i === 36) charTypes[i] |= IDENT_START | IDENT_PART; // _ $
  if (i >= 48 && i <= 57) charTypes[i] |= DIGIT | IDENT_PART; // 0-9
  if (i === 32 || i === 9 || i === 10 || i === 13) charTypes[i] |= WHITESPACE;
}

function isIdentifierStart(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code < 128 ? (charTypes[code] & IDENT_START) !== 0 : /^[a-zA-Z_$]/.test(ch);
}
```

2. **String Pooling (Keyword Interning)**

```typescript
const keywords = new Map<string, TokenType>([
  ['const', TokenType.Const],
  ['let', TokenType.Let],
  ['var', TokenType.Var],
  ['function', TokenType.Function],
  ['component', TokenType.Component], // Custom PSR keyword
  ['signal', TokenType.Signal], // Custom PSR keyword
  // ...
]);

function scanIdentifier(lexer: ILexer, start: number): IToken {
  let value = '';

  while (isIdentifierPart(lexer.ch)) {
    value += lexer.ch;
    lexer.advance();
  }

  // Check if it's a keyword (O(1) lookup)
  const keywordType = keywords.get(value);

  return {
    type: keywordType ?? TokenType.Identifier,
    value,
    start: start,
    end: lexer.pos,
  };
}
```

3. **Lookahead Optimization**

```typescript
// Instead of calling peek() multiple times, cache results
interface ILexerWithLookahead extends ILexer {
  lookahead1: string;
  lookahead2: string;

  updateLookahead(): void;
}

function updateLookahead(lexer: ILexerWithLookahead): void {
  lexer.lookahead1 = lexer.source[lexer.pos + 1] ?? '';
  lexer.lookahead2 = lexer.source[lexer.pos + 2] ?? '';
}

// Now checks are faster
function isArrowFunction(lexer: ILexerWithLookahead): boolean {
  return lexer.ch === '=' && lexer.lookahead1 === '>';
}
```

---

## Error Handling

### Graceful Error Recovery

```typescript
interface ILexerError {
  message: string;
  position: IPosition;
  code: string;
}

function handleLexerError(lexer: ILexer, message: string): IToken {
  const error: ILexerError = {
    message,
    position: getCurrentPosition(lexer),
    code: 'LEX_ERROR',
  };

  lexer.errors.push(error);

  // Try to recover by skipping to next safe token
  while (!isSafeRecoveryPoint(lexer) && !isEOF(lexer)) {
    lexer.advance();
  }

  return createToken(TokenType.Error, lexer.pos);
}

function isSafeRecoveryPoint(lexer: ILexer): boolean {
  // Recover at statement boundaries
  return lexer.ch === ';' || lexer.ch === '}' || lexer.ch === '\n';
}
```

---

## Critical for PSR Transformer

### Custom Token Types Needed

```typescript
enum PSRTokenType {
  // PSR-specific keywords
  Component = 'component',
  Signal = 'signal',

  // JSX tokens
  JSXOpenTag = 'jsx_open_tag',
  JSXCloseTag = 'jsx_close_tag',
  JSXSelfClose = 'jsx_self_close',
  JSXAttribute = 'jsx_attribute',
  JSXText = 'jsx_text',
  JSXExpression = 'jsx_expression',

  // Template literals
  TemplateLiteral = 'template_literal',
  TemplateHead = 'template_head',
  TemplateMiddle = 'template_middle',
  TemplateTail = 'template_tail',

  // Standard tokens
  Identifier = 'identifier',
  Keyword = 'keyword',
  Number = 'number',
  String = 'string',
  // ...
}
```

---

## Best Practices from Industry

1. **TypeScript**: Separate lookahead logic, immutable token objects
2. **Babel**: Plugin-based token transformations
3. **SWC**: Character classification arrays, minimal allocations
4. **Solid.js**: State machine for JSX, expression tracking
5. **Svelte**: Directive tokenization with special markers

---

## Implementation Strategy for PSR

1. **Base Lexer**: Standard JS/TS tokens
2. **JSX Extension**: State machine for JSX parsing
3. **Template Literal Extension**: `${}` expression handling
4. **Custom Keywords**: `component`, `signal` detection
5. **Position Tracking**: Full source map support
6. **Error Recovery**: Continue parsing after errors

---

**References:**

- TypeScript Compiler: `packages/typescript/src/compiler/scanner.ts`
- Babel: `@babel/parser` lexer
- SWC: Rust-based scanner
- Solid.js: `babel-preset-solid` JSX handling
- Svelte: `svelte/compiler` tokenizer

**Next:** [02-parser-ast-construction.md](./02-parser-ast-construction.md)
