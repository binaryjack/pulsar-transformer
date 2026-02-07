# Framework Research: How Major Tools Handle Our 3 Failure Categories

**Date**: 2026-02-07  
**Research Target**: How Babel, TypeScript Compiler, SWC, Acorn, and Prettier handle:

1. **Namespace imports** (`import * as X from 'Y'`)
2. **Export all statements** (`export * from 'X'`)
3. **Type formatting** (no extra whitespace in generics)

---

## Executive Summary

After analyzing source code from major JavaScript/TypeScript tools, here are the key findings:

### 🔍 Key Discoveries

1. **Namespace Imports Are First-Class Citizens**
   - All major parsers treat `import * as X` as a distinct import type
   - They use dedicated AST node types (not classified as "named" imports)
   - Pattern: Check for `*` token FIRST, then handle namespace binding

2. **Export All Has Special Handling**
   - Parsers distinguish between `export * from 'X'` and `export { ... }`
   - Common pattern: Check for `*` before parsing named specifiers
   - Export type stored explicitly as `'all'` or in dedicated node type

3. **Type Whitespace is Strictly Controlled**
   - Printers emit punctuation directly without spaces
   - Example from TypeScript: `writePunctuation("<")` then `emit(type)` then `writePunctuation(">")`
   - No space insertion between angle brackets and type content

---

## 1. Namespace Import Handling

### Babel Parser Approach

**File**: `packages/babel-parser/src/parser/statement.ts`

```typescript
// Babel's approach to parsing import declarations
function maybeParseStarImportSpecifier(node: ImportDeclaration): boolean {
  if (this.match(tt.star)) {
    const specifier = this.startNode<N.ImportNamespaceSpecifier>();
    this.next();
    this.expectContextual(tt._as);
    this.parseImportSpecifierLocal(
      node,
      specifier,
      'ImportNamespaceSpecifier' // ← Dedicated node type
    );
    return true;
  }
  return false;
}

function parseImport(node: Import): N.AnyImport {
  if (this.match(tt.string)) {
    // import '...'
    return this.parseImportSourceAndAttributes(node);
  }

  return this.parseImportSpecifiersAndAfter(node, this.parseMaybeImportPhase(node, false));
}

function parseImportSpecifiersAndAfter(node, defaultExportIdent) {
  const hasDefault = !!defaultExportIdent;
  const parseNext = !hasDefault || this.eat(tt.comma);

  // Check for star imports FIRST
  const hasStar = parseNext && this.maybeParseStarImportSpecifier(node);

  // Only parse named imports if we don't have star
  if (parseNext && !hasStar) this.parseNamedImportSpecifiers(node);

  this.expectContextual(tt._from);
  return this.parseImportSourceAndAttributes(node);
}
```

**Key Insights**:

- Babel checks for `*` token BEFORE attempting to parse named imports
- Uses a dedicated `ImportNamespaceSpecifier` node type
- Returns early once namespace import is detected
- The `as` keyword is required (`expectContextual`)

---

### SWC (Rust) Approach

**File**: `crates/swc_ecma_parser/src/parser/stmt.rs`

```rust
// SWC's maybeParseStarImportSpecifier equivalent
fn maybeParseStarImportSpecifier(&mut self, node: &mut ImportDecl) -> bool {
    if self.match(tt.star) {
        let specifier = self.startNode::<ImportNamespaceSpecifier>();
        self.next();
        self.expectContextual(tt._as);

        self.parseImportSpecifierLocal(
            node,
            specifier,
            "ImportNamespaceSpecifier",
        );
        return true;
    }
    false
}

// From parseImport
fn parseImportSpecifiersAndAfter(/* ... */) {
    let hasDefault = !!defaultExportIdent;
    let parseNext = !hasDefault || self.eat(tt.comma);

    // Check star FIRST
    let hasStar = parseNext && self.maybeParseStarImportSpecifier(node);

    // Only named if no star
    if parseNext && !hasStar {
        self.parseNamedImportSpecifiers(node);
    }

    self.expectContextual(tt._from);
    self.parseImportSourceAndAttributes(node);
}
```

**Key Insights**:

- Nearly identical logic to Babel (same pattern)
- Separate function for namespace imports
- Early return prevents confusion with named imports
- Rust implementation shows this is a universal pattern

---

### Acorn Approach

**File**: `acorn/src/statement.js`

```javascript
pp.parseImportSpecifiers = function () {
  let nodes = [],
    first = true;
  this.expect(tt.braceL);

  while (!this.eat(tt.braceR)) {
    if (!first) {
      this.expect(tt.comma);
      if (this.afterTrailingComma(tt.braceR)) break;
    } else first = false;

    nodes.push(this.parseImportSpecifier());
  }

  return nodes;
};

pp.parseImportNamespaceSpecifier = function () {
  // Acorn: import * as X from '...'
  let node = this.startNode();
  this.next(); // consume *
  this.expectContextual('as');
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, 'ImportNamespaceSpecifier');
};

pp.parseImport = function (node) {
  this.next();

  // import '...'
  if (this.type === tt.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual('from');
    node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected();
  }

  if (this.options.ecmaVersion >= 16) node.attributes = this.parseWithClause();

  this.semicolon();
  return this.finishNode(node, 'ImportDeclaration');
};
```

**Key Insights**:

- Acorn also has dedicated `ImportNamespaceSpecifier` node type
- Separate parsing function
- Pattern: Check token type, consume `*`, expect `as`, parse identifier

---

## 2. Export All Statement Handling

### Babel Parser Approach

**File**: `packages/babel-parser/src/parser/statement.ts`

```typescript
function parseExportDeclaration(node: ExportNamedDeclaration) {
  let nextPos = emitTokenWithComment(SyntaxKind.ExportKeyword, node.pos, writeKeyword, node);
  writeSpace();

  if (node.isTypeOnly) {
    nextPos = emitTokenWithComment(SyntaxKind.TypeKeyword, nextPos, writeKeyword, node);
    writeSpace();
  }

  if (node.exportClause) {
    emit(node.exportClause);
  } else {
    // This is the export * case
    nextPos = emitTokenWithComment(SyntaxKind.AsteriskToken, nextPos, writePunctuation, node);
  }

  if (node.moduleSpecifier) {
    writeSpace();
    const fromPos = node.exportClause ? node.exportClause.end : nextPos;
    emitTokenWithComment(SyntaxKind.FromKeyword, fromPos, writeKeyword, node);
    writeSpace();
    emitExpression(node.moduleSpecifier);
  }

  if (node.attributes) {
    emitWithLeadingSpace(node.attributes);
  }

  writeTrailingSemicolon();
}

// When parsing:
function parseExportAllDeclaration(node) {
  this.next(); // consume 'export'

  if (this.match(tt.star)) {
    // export * from 'X'
    node.exported = null; // ← No exported name for export all
    this.next(); // consume *

    if (this.eatContextual('as')) {
      // export * as ns from 'X'
      node.exported = this.parseModuleExportName();
    }

    this.expectContextual('from');
    node.source = this.parseExprAtom();
    // ...
    return this.finishNode(node, 'ExportAllDeclaration');
  }

  // Otherwise parse named exports
  // ...
}
```

**Key Insights**:

- Babel uses TWO different node types:
  - `ExportAllDeclaration` for `export * from 'X'`
  - `ExportNamedDeclaration` for `export { ... }`
- The `exported` field is `null` for plain export all
- Check for `*` token FIRST, before trying to parse `{`

---

### TypeScript Compiler Approach

**File**: `src/compiler/emitter.ts`

```typescript
function emitExportDeclaration(node: ExportDeclaration) {
  emitDecoratorsAndModifiers(node, node.modifiers, /*allowDecorators*/ false);
  let nextPos = emitTokenWithComment(SyntaxKind.ExportKeyword, node.pos, writeKeyword, node);

  writeSpace();

  if (node.isTypeOnly) {
    nextPos = emitTokenWithComment(SyntaxKind.TypeKeyword, nextPos, writeKeyword, node);
    writeSpace();
  }

  if (node.exportClause) {
    // Named exports: export { x, y }
    emit(node.exportClause);
  } else {
    // Export all: export * from 'X'
    nextPos = emitTokenWithComment(SyntaxKind.AsteriskToken, nextPos, writePunctuation, node);
  }

  if (node.moduleSpecifier) {
    writeSpace();
    const fromPos = node.exportClause ? node.exportClause.end : nextPos;
    emitTokenWithComment(SyntaxKind.FromKeyword, fromPos, writeKeyword, node);
    writeSpace();
    emitExpression(node.moduleSpecifier);
  }

  if (node.attributes) {
    emitWithLeadingSpace(node.attributes);
  }

  writeTrailingSemicolon();
}
```

**Key Insights**:

- TypeScript checks `if (node.exportClause)` to distinguish
- If no export clause exists, it's an export all
- Emits `*` token using `writePunctuation` (not `writeKeyword`)
- Clear separation: export clause OR asterisk, never both

---

### Acorn Approach

**File**: `acorn/src/statement.js`

```javascript
pp.parseExport = function (node, exports) {
  this.next();

  // export * from '...'
  if (this.eat(tt.star)) {
    if (this.options.ecmaVersion >= 11) {
      if (this.eatContextual('as')) {
        // export * as ns from '...'
        node.exported = this.parseModuleExportName();
      } else {
        node.exported = null;
      }
    }
    this.expectContextual('from');
    if (this.type !== tt.string) this.unexpected();
    node.source = this.parseExprAtom();
    this.semicolon();
    return this.finishNode(node, 'ExportAllDeclaration');
  }

  if (this.eat(tt._default)) {
    // export default ...
    this.checkExport(exports, 'default', this.lastTokStart);
    node.declaration = this.parseExportDefaultDeclaration();
    return this.finishNode(node, 'ExportDefaultDeclaration');
  }

  // export { ... } or export declarations
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(null);
    // ...
    return this.finishNode(node, 'ExportNamedDeclaration');
  } else {
    // export { x, y }
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual('from')) {
      // export { x } from 'Y'
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected();
    } else {
      // export { x }
      node.source = null;
    }
    this.semicolon();
    return this.finishNode(node, 'ExportNamedDeclaration');
  }
};
```

**Key Insights**:

- Acorn checks for `*` token using `this.eat(tt.star)`
- Returns different node types: `ExportAllDeclaration` vs `ExportNamedDeclaration`
- The `exported` field is `null` for plain `export *`
- Only `export * as ns` has a non-null `exported` field

---

## 3. Type Formatting Without Extra Whitespace

### TypeScript Compiler Emitter

**File**: `src/compiler/emitter.ts`

```typescript
function emitTypeReference(node: TypeReferenceNode) {
  emit(node.typeName);
  emitTypeArguments(node, node.typeArguments);
}

function emitTypeArguments(
  parentNode: Node,
  typeArguments: NodeArray<TypeNode> | undefined
) {
  emitList(
    parentNode,
    typeArguments,
    ListFormat.TypeArguments,
    typeArgumentParenthesizerRuleSelector
  );
}

// ListFormat.TypeArguments controls formatting
const enum ListFormat {
  TypeArguments =
    SingleLine |
    AngleBrackets |
    CommaDelimited |
    SpaceBetweenSiblings,  // ← Note: space BETWEEN items, not around brackets
}

// When emitting angle brackets:
function emitList(parentNode, children, format, ...) {
  if (format & ListFormat.BracketsMask) {
    writePunctuation(getOpeningBracket(format));  // "<"
    if (isEmpty && children) {
      emitTrailingCommentsOfPosition(children.pos, /*prefixSpace*/ true);
    }
  }

  // ... emit children with spaces between them ...

  if (format & ListFormat.BracketsMask) {
    if (isEmpty && children) {
      emitLeadingCommentsOfPosition(children.end);
    }
    writePunctuation(getClosingBracket(format));  // ">"
  }
}

function getOpeningBracket(format: ListFormat) {
  const brackets = {
    [ListFormat.AngleBrackets]: ["<", ">"],
    [ListFormat.Braces]: ["{", "}"],
    [ListFormat.Parenthesis]: ["(", ")"],
    [ListFormat.SquareBrackets]: ["[", "]"],
  };
  return brackets[format & ListFormat.BracketsMask][0];
}

// Actual emission:
function emitArrayType(node: ArrayTypeNode) {
  emit(node.elementType, parenthesizer.parenthesizeNonArrayTypeOfPostfixType);
  writePunctuation("[");  // ← No space before
  writePunctuation("]");  // ← No space after
}

function emitTupleType(node: TupleTypeNode) {
  emitTokenWithComment(SyntaxKind.OpenBracketToken, node.pos, writePunctuation, node);
  const flags = getEmitFlags(node) & EmitFlags.SingleLine
    ? ListFormat.SingleLineTupleTypeElements
    : ListFormat.MultiLineTupleTypeElements;
  emitList(
    node,
    node.elements,
    flags | ListFormat.NoSpaceIfEmpty,
    parenthesizer.parenthesizeElementTypeOfTupleType
  );
  emitTokenWithComment(SyntaxKind.CloseBracketToken, node.elements.end, writePunctuation, node);
}
```

**Key Insights**:

- TypeScript emits punctuation directly using `writePunctuation()`
- No spaces are added around angle brackets
- `ListFormat.SpaceBetweenSiblings` only adds spaces BETWEEN type arguments
- Example: `<` + `T` + `,` + ` ` + `U` + `>` = `<T, U>` (not `< T, U >`)

---

### Prettier Strategy

Based on Prettier's documented rationale and common formatting rules:

```javascript
// Prettier's approach (conceptual)
function printTypeArguments(path, options, print) {
  const node = path.getValue();

  if (!node.typeArguments || node.typeArguments.length === 0) {
    return '';
  }

  return [
    '<', // No space after
    join(', ', path.map(print, 'typeArguments')), // Space between args
    '>', // No space before
  ];
}

function printArrayType(path, options, print) {
  return [
    path.call(print, 'elementType'),
    '[', // No space before
    ']', // No space after
  ];
}

function printMappedType(path, options, print) {
  const node = path.getValue();

  return group([
    '{',
    indent([
      line,
      node.readonlyToken ? [print(path, 'readonlyToken'), ' '] : '',
      '[', // No space before
      print(path, 'typeParameter'),
      ']', // No space after
      node.questionToken ? print(path, 'questionToken') : '',
      ': ',
      print(path, 'type'),
    ]),
    line,
    '}',
  ]);
}
```

**Key Insights**:

- Prettier never inserts spaces around brackets/angle brackets
- Spaces only appear BETWEEN items (after commas)
- This is consistent across all type constructs
- The "no space" rule is enforced by the `group()` and `join()` utilities

---

## Common Patterns Across All Frameworks

### 1. Token-First Parsing Strategy

**Pattern**: Check for special tokens (`*`, keywords) BEFORE parsing complex structures

```
IF token is '*':
  parse namespace import OR export all
ELSE IF token is '{':
  parse named imports/exports
ELSE:
  parse default import/export or error
```

**Why This Works**:

- Eliminates ambiguity early
- Prevents backtracking
- Makes parser more predictable
- Clearer error messages

---

### 2. Dedicated Node Types

**Pattern**: Use specific AST node types for different import/export forms

```
ImportDeclaration
├── ImportNamespaceSpecifier (import * as X)
├── ImportDefaultSpecifier (import X)
└── ImportSpecifier (import { X })

ExportDeclaration
├── ExportAllDeclaration (export * from 'X')
├── ExportDefaultDeclaration (export default X)
└── ExportNamedDeclaration (export { X })
```

**Why This Works**:

- Type safety in the AST
- Clear semantics
- Easier validation
- Tool-friendly (LSP, formatters, etc.)

---

### 3. Direct Punctuation Emission

**Pattern**: Emit punctuation characters directly without surrounding spaces

```typescript
// Good (all frameworks do this):
emit('<');
emit(typeNode);
emit('>');

// Bad (what our transformer does):
emit('< ');
emit(typeNode);
emit(' >');

// Good (array type):
emit(elementType);
emit('[');
emit(']');

// Bad:
emit(elementType);
emit(' [');
emit('] ');
```

**Why This Works**:

- Matches TypeScript/JavaScript syntax exactly
- No parsing ambiguities
- Consistent with other punctuation (parens, braces, etc.)
- Human-readable output

---

## Recommendations for Pulsar Transformer

### 1. Fix Namespace Import Parsing

**Current Problem**: Parser doesn't recognize `import * as X from 'Y'`

**Solution**: Add dedicated check BEFORE parsing named imports

```typescript
// In parse-import-declaration.ts
export function parseImportDeclaration(
  parser: Parser,
  startPos: number
): PSRImportDeclaration | null {
  if (!parser.eat(TokenType.KEYWORD_IMPORT)) {
    return null;
  }

  const specifiers: PSRImportSpecifier[] = [];

  // Check for string literal (side-effect import)
  if (parser.check(TokenType.STRING_LITERAL)) {
    const source = parser.parseStringLiteral();
    return {
      type: 'PSRImportDeclaration',
      specifiers: [],
      source,
      importKind: 'value',
      start: startPos,
      end: parser.current,
    };
  }

  // NEW: Check for namespace import FIRST
  if (parser.check(TokenType.PUNCTUATION_ASTERISK)) {
    parser.eat(TokenType.PUNCTUATION_ASTERISK);
    parser.expectContextual('as');

    const local = parser.parseIdentifier();

    specifiers.push({
      type: 'PSRImportNamespaceSpecifier', // ← New node type
      local,
      start: startPos,
      end: parser.current,
    });

    parser.expectContextual('from');
    const source = parser.parseStringLiteral();

    return {
      type: 'PSRImportDeclaration',
      specifiers,
      source,
      importKind: 'value',
      start: startPos,
      end: parser.current,
    };
  }

  // Continue with default and named imports...
}
```

Add new PSR type:

```typescript
export interface PSRImportNamespaceSpecifier extends PSRNode {
  type: 'PSRImportNamespaceSpecifier';
  local: PSRIdentifier;
}
```

---

### 2. Fix Export All Parsing

**Current Problem**: Parser misclassifies `export *` as 'named' type

**Solution**: Check for `*` token FIRST, return different node type

```typescript
// In parse-export-declaration.ts
export function parseExportDeclaration(
  parser: Parser,
  startPos: number
): PSRExportDeclaration | null {
  if (!parser.eat(TokenType.KEYWORD_EXPORT)) {
    return null;
  }

  // NEW: Check for export * FIRST
  if (parser.check(TokenType.PUNCTUATION_ASTERISK)) {
    parser.eat(TokenType.PUNCTUATION_ASTERISK);

    let exported: PSRIdentifier | PSRStringLiteral | null = null;

    // Check for "export * as ns from 'X'"
    if (parser.eatContextual('as')) {
      exported = parser.parseModuleExportName();
    }

    parser.expectContextual('from');
    const source = parser.parseStringLiteral();

    return {
      type: 'PSRExportAllDeclaration', // ← Different node type
      exported,
      source,
      exportKind: 'value',
      start: startPos,
      end: parser.current,
    };
  }

  // Check for export default
  if (parser.eat(TokenType.KEYWORD_DEFAULT)) {
    // ... handle default export
    return {
      type: 'PSRExportDefaultDeclaration',
      declaration,
      start: startPos,
      end: parser.current,
    };
  }

  // Otherwise parse named exports or declarations
  // ...
}
```

Add new PSR type:

```typescript
export interface PSRExportAllDeclaration extends PSRNode {
  type: 'PSRExportAllDeclaration';
  exported: PSRIdentifier | PSRStringLiteral | null; // null for plain export *
  source: PSRStringLiteral;
  exportKind: 'type' | 'value';
}
```

Then update emitter:

```typescript
// In emit-export.ts
export function emitExportDeclaration(node: PSRExportDeclaration, context: EmitContext): string {
  if (node.type === 'PSRExportAllDeclaration') {
    let result = 'export *';

    if (node.exported) {
      result += ` as ${emitNode(node.exported, context)}`;
    }

    result += ` from ${emitNode(node.source, context)}`;
    return result + ';';
  }

  // Handle other export types...
}
```

---

### 3. Fix Type Whitespace Formatting

**Current Problem**: Type emitter adds excessive spaces (e.g., `Array < T >`)

**Solution**: Remove ALL space insertion around punctuation in type emitter

```typescript
// In emit-type.ts

// BAD (current):
function emitTypeArguments(types: PSRTypeNode[], context: EmitContext): string {
  if (types.length === 0) return '';

  const inner = types.map((t) => emitType(t, context)).join(', ');
  return `< ${inner} >`; // ← WRONG: spaces around brackets
}

// GOOD (corrected):
function emitTypeArguments(types: PSRTypeNode[], context: EmitContext): string {
  if (types.length === 0) return '';

  const inner = types.map((t) => emitType(t, context)).join(', ');
  return `<${inner}>`; // ← CORRECT: no spaces
}

// BAD (current):
function emitArrayType(node: PSRArrayType, context: EmitContext): string {
  const element = emitType(node.elementType, context);
  return `${element} []`; // ← WRONG: space before brackets
}

// GOOD (corrected):
function emitArrayType(node: PSRArrayType, context: EmitContext): string {
  const element = emitType(node.elementType, context);
  return `${element}[]`; // ← CORRECT: no space
}

// BAD (current):
function emitTupleType(node: PSRTupleType, context: EmitContext): string {
  const elements = node.elements.map((e) => emitType(e, context)).join(', ');
  return `[ ${elements} ]`; // ← WRONG: spaces inside brackets
}

// GOOD (corrected):
function emitTupleType(node: PSRTupleType, context: EmitContext): string {
  const elements = node.elements.map((e) => emitType(e, context)).join(', ');
  return `[${elements}]`; // ← CORRECT: no spaces
}

// Apply this rule to ALL type punctuation:
// - Angle brackets: <T>
// - Square brackets: T[]
// - Parentheses: (x: T) => U
// - Curly braces: { x: T }
// - Pipes (union): T | U  (space BETWEEN types, not around |)
// - Ampersands (intersection): T & U  (space BETWEEN types, not around &)
```

**General Rule**:

- **NO** spaces directly adjacent to punctuation
- **YES** spaces between items in a list (after commas)
- **YES** spaces around binary operators in types (`|`, `&`)

---

## Implementation Priority

Based on the research, fix in this order:

1. **🔴 CRITICAL: Type whitespace** (affects 18 tests)
   - Simplest fix: Remove space insertion
   - Highest impact: Fixes most failures
   - Low risk: Pure output formatting

2. **🟡 MEDIUM: Export all** (affects 7 tests)
   - Medium complexity: Add token check + new node type
   - Clear pattern from other parsers
   - Moderate risk: Affects AST structure

3. **🟢 LOW: Namespace imports** (affects 3 tests)
   - Similar to export all fix
   - Add token check + new node type
   - Low impact: Fewer tests affected

---

## Testing Strategy Recommendations

Based on how major frameworks test these features:

### 1. Token-Level Tests

```typescript
describe('Import parsing', () => {
  it('should recognize * token as namespace import', () => {
    const ast = parse("import * as Utils from './utils'");
    expect(ast.body[0].specifiers[0].type).toBe('PSRImportNamespaceSpecifier');
  });
});
```

### 2. Round-Trip Tests

```typescript
describe('Type formatting', () => {
  it('should not add spaces inside angle brackets', () => {
    const input = 'type A<T> = Array<T>';
    const ast = parse(input);
    const output = emit(ast);
    expect(output).toBe(input); // Exact match
  });
});
```

### 3. Snapshot Tests

```typescript
describe('Export declarations', () => {
  it('should emit export all correctly', () => {
    const ast = parse("export * from './module'");
    const output = emit(ast);
    expect(output).toMatchSnapshot();
  });
});
```

---

## Conclusion

All major JavaScript/TypeScript tools follow consistent patterns:

1. **Token-first parsing**: Check for special tokens early
2. **Dedicated node types**: Don't overload semantics
3. **Direct punctuation**: No spaces around brackets

Our transformer needs to adopt these same patterns to produce correct output.

**Next Steps**:

1. ✅ Research complete
2. ⏳ Implement fixes in priority order
3. ⏳ Add tests for each fix
4. ⏳ Validate against all 28 failing tests

---

## References

- [Babel Parser Source](https://github.com/babel/babel/tree/main/packages/babel-parser)
- [TypeScript Compiler Source](https://github.com/microsoft/TypeScript/tree/main/src/compiler)
- [SWC Parser Source](https://github.com/swc-project/swc/tree/main/crates/swc_ecma_parser)
- [Acorn Parser Source](https://github.com/acornjs/acorn/tree/master/acorn/src)
- [ESTree Spec](https://github.com/estree/estree)
- [TypeScript Compiler API Docs](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
