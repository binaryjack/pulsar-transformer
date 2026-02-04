# Phase 16: Enum Declarations

**Goal**: Add TypeScript enum support to the Pulsar transformer.

**Priority**: High - Enums are fundamental TypeScript feature

**Estimated Effort**: 4-6 hours

---

## Overview

TypeScript enums allow defining a set of named constants. They can be numeric or string-based.

### Examples

```typescript
// Numeric enum
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

// String enum
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

// Mixed enum
enum Mixed {
  No = 0,
  Yes = 'YES',
}

// Computed enum
enum FileAccess {
  None,
  Read = 1 << 1,
  Write = 1 << 2,
  ReadWrite = Read | Write,
}

// Const enum
const enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
}
```

---

## Implementation Plan

### Task 1: AST Types

**File**: `src/parser/ast/ast-node-types.ts`

Add enum AST node types:

```typescript
export interface IEnumDeclarationNode extends IASTNode {
  type: 'EnumDeclaration';
  name: IIdentifierNode;
  members: IEnumMemberNode[];
  const?: boolean; // const enum modifier
  location: ILocation;
}

export interface IEnumMemberNode extends IASTNode {
  type: 'EnumMember';
  name: IIdentifierNode;
  initializer?: IExpressionNode; // For explicit values
  location: ILocation;
}

// Add to ASTNodeType enum
export enum ASTNodeType {
  // ... existing types ...
  ENUM_DECLARATION = 'EnumDeclaration',
  ENUM_MEMBER = 'EnumMember',
}
```

**Acceptance Criteria:**

- [ ] IEnumDeclarationNode interface created
- [ ] IEnumMemberNode interface created
- [ ] Enum types added to ASTNodeType enum
- [ ] TypeScript compiles without errors

---

### Task 2: Tokenizer Updates

**File**: `src/lexer/tokenizer.ts`

Enum keyword already exists in TokenType.ENUM. Verify it's included in keywords:

```typescript
const KEYWORDS: Record<string, TokenType> = {
  // ... existing keywords ...
  enum: TokenType.ENUM,
  const: TokenType.CONST, // Already exists
};
```

**Acceptance Criteria:**

- [ ] ENUM token type verified
- [ ] CONST token type verified
- [ ] Both recognized as keywords

---

### Task 3: Enum Parser Implementation

**File**: `src/parser/prototype/parse-enum-declaration.ts`

```typescript
import type { IParserInternal } from '../parser.types';
import type { IEnumDeclarationNode, IEnumMemberNode, IIdentifierNode } from '../ast/ast-node-types';
import { ASTNodeType } from '../ast/ast-node-types';
import { TokenType } from '../../lexer/token-types';

/**
 * Parses TypeScript enum declarations.
 *
 * Grammar:
 *   EnumDeclaration
 *     : 'const'? 'enum' Identifier '{' EnumMemberList? '}'
 *
 *   EnumMemberList
 *     : EnumMember (',' EnumMember)* ','?
 *
 *   EnumMember
 *     : Identifier ('=' Expression)?
 *
 * @this {IParserInternal}
 * @returns {IEnumDeclarationNode}
 */
export function parseEnumDeclaration(this: IParserInternal): IEnumDeclarationNode {
  const startToken = this._getCurrentToken()!;
  const startLocation = {
    line: startToken.line,
    column: startToken.column,
  };

  // Check for 'const' modifier
  let isConst = false;
  if (this._getCurrentToken()?.type === TokenType.CONST) {
    isConst = true;
    this._advance(); // consume 'const'
  }

  // Expect 'enum' keyword
  if (this._getCurrentToken()?.type !== TokenType.ENUM) {
    throw this._createError(
      `Expected 'enum' keyword, got '${this._getCurrentToken()?.value}'`,
      this._getCurrentToken()!
    );
  }
  this._advance(); // consume 'enum'

  // Parse enum name
  const name = this._parseIdentifier();

  // Expect '{'
  if (this._getCurrentToken()?.type !== TokenType.LBRACE) {
    throw this._createError(
      `Expected '{' after enum name, got '${this._getCurrentToken()?.value}'`,
      this._getCurrentToken()!
    );
  }
  this._advance(); // consume '{'

  // Parse enum members
  const members: IEnumMemberNode[] = [];

  while (this._getCurrentToken() && this._getCurrentToken()!.type !== TokenType.RBRACE) {
    members.push(this._parseEnumMember());

    // Optional trailing comma
    if (this._getCurrentToken()?.type === TokenType.COMMA) {
      this._advance(); // consume ','
    }
  }

  // Expect '}'
  if (this._getCurrentToken()?.type !== TokenType.RBRACE) {
    throw this._createError(
      `Expected '}' after enum members, got '${this._getCurrentToken()?.value}'`,
      this._getCurrentToken()!
    );
  }
  const endToken = this._getCurrentToken()!;
  this._advance(); // consume '}'

  return {
    type: ASTNodeType.ENUM_DECLARATION,
    name,
    members,
    const: isConst ? true : undefined,
    location: {
      start: startLocation,
      end: {
        line: endToken.line,
        column: endToken.column + 1,
      },
    },
  };
}

/**
 * Parses a single enum member.
 *
 * @this {IParserInternal}
 * @returns {IEnumMemberNode}
 */
function parseEnumMember(this: IParserInternal): IEnumMemberNode {
  const startToken = this._getCurrentToken()!;

  // Parse member name
  const name = this._parseIdentifier();

  let initializer: IExpressionNode | undefined;

  // Check for initializer
  if (this._getCurrentToken()?.type === TokenType.ASSIGN) {
    this._advance(); // consume '='
    initializer = this._parseExpression();
  }

  const endToken = this._getPreviousToken()!;

  return {
    type: ASTNodeType.ENUM_MEMBER,
    name,
    initializer,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
      },
      end: {
        line: endToken.line,
        column: endToken.column + endToken.value.length,
      },
    },
  };
}

// Attach to parser prototype
export function attachEnumParser(parser: IParserInternal): void {
  Object.defineProperty(parser, '_parseEnumDeclaration', {
    value: parseEnumDeclaration,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(parser, '_parseEnumMember', {
    value: parseEnumMember,
    writable: false,
    enumerable: false,
    configurable: false,
  });
}
```

**Acceptance Criteria:**

- [ ] parseEnumDeclaration function implemented
- [ ] parseEnumMember helper implemented
- [ ] Handles const enum modifier
- [ ] Handles optional initializers
- [ ] Handles trailing commas
- [ ] Proper error messages
- [ ] Location tracking accurate

---

### Task 4: Parser Type Definitions

**File**: `src/parser/parser.types.ts`

Add to IParserInternal interface:

```typescript
export interface IParserInternal {
  // ... existing methods ...
  _parseEnumDeclaration(): IEnumDeclarationNode;
  _parseEnumMember(): IEnumMemberNode;
}
```

**Acceptance Criteria:**

- [ ] \_parseEnumDeclaration type added
- [ ] \_parseEnumMember type added
- [ ] TypeScript compiles without errors

---

### Task 5: Integration into Main Parser

**File**: `src/parser/prototype/parse.ts`

Add enum detection in top-level statement parsing:

```typescript
export function parse(this: IParserInternal): IProgramNode {
  const body: IASTNode[] = [];

  while (this._hasTokens()) {
    const token = this._getCurrentToken();

    // ... existing cases ...

    // ENUM DECLARATION
    if (token?.type === TokenType.CONST) {
      const nextToken = this._peekToken(1);
      if (nextToken?.type === TokenType.ENUM) {
        body.push(this._parseEnumDeclaration());
        continue;
      }
    }

    if (token?.type === TokenType.ENUM) {
      body.push(this._parseEnumDeclaration());
      continue;
    }

    // ... rest of parsing ...
  }

  return {
    type: ASTNodeType.PROGRAM,
    body,
    location: {
      /* ... */
    },
  };
}
```

**Acceptance Criteria:**

- [ ] Enum detection added
- [ ] Const enum detection added
- [ ] Integrated into main parse loop
- [ ] No breaking changes to existing parsing

---

### Task 6: Prototype Attachment

**File**: `src/parser/prototype/index.ts`

```typescript
// Import enum parser
import { attachEnumParser } from './parse-enum-declaration';

// Attach to prototype
export function attachParsers(parser: IParserInternal): void {
  // ... existing attachments ...
  attachEnumParser(parser);
}
```

**Acceptance Criteria:**

- [ ] Import added
- [ ] Attachment called
- [ ] Methods available on parser instances

---

### Task 7: Unit Tests

**File**: `src/parser/prototype/__tests__/parse-enum-declaration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createParser } from '../../index';
import type { IEnumDeclarationNode, IEnumMemberNode } from '../../ast/ast-node-types';
import { ASTNodeType } from '../../ast/ast-node-types';

describe('Enum Declaration Parsing', () => {
  describe('basic enums', () => {
    it('should parse numeric enum', () => {
      const code = `enum Direction { Up, Down, Left, Right }`;
      const parser = createParser(code);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      const enumDecl = ast.body[0] as IEnumDeclarationNode;

      expect(enumDecl.type).toBe(ASTNodeType.ENUM_DECLARATION);
      expect(enumDecl.name.name).toBe('Direction');
      expect(enumDecl.members).toHaveLength(4);
      expect(enumDecl.members[0].name.name).toBe('Up');
      expect(enumDecl.members[0].initializer).toBeUndefined();
    });

    it('should parse string enum', () => {
      const code = `enum Color {
        Red = "RED",
        Green = "GREEN",
        Blue = "BLUE"
      }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members).toHaveLength(3);
      expect(enumDecl.members[0].initializer).toBeDefined();
    });

    it('should parse const enum', () => {
      const code = `const enum LogLevel { Debug, Info, Warning, Error }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.const).toBe(true);
      expect(enumDecl.members).toHaveLength(4);
    });
  });

  describe('enum members', () => {
    it('should parse explicit numeric values', () => {
      const code = `enum FileAccess { None = 0, Read = 1, Write = 2 }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members[0].initializer).toBeDefined();
      expect(enumDecl.members[1].initializer).toBeDefined();
    });

    it('should parse computed values', () => {
      const code = `enum FileAccess {
        None,
        Read = 1 << 1,
        Write = 1 << 2
      }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members[1].initializer).toBeDefined();
    });

    it('should handle trailing comma', () => {
      const code = `enum Direction { Up, Down, }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members).toHaveLength(2);
    });
  });

  describe('location tracking', () => {
    it('should track enum declaration location', () => {
      const code = `enum Direction { Up }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.location).toBeDefined();
      expect(enumDecl.location.start.line).toBe(1);
    });

    it('should track enum member location', () => {
      const code = `enum Direction { Up }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members[0].location).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should parse empty enum', () => {
      const code = `enum Empty {}`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members).toHaveLength(0);
    });

    it('should handle mixed enum', () => {
      const code = `enum Mixed { No = 0, Yes = "YES" }`;
      const parser = createParser(code);
      const ast = parser.parse();

      const enumDecl = ast.body[0] as IEnumDeclarationNode;
      expect(enumDecl.members).toHaveLength(2);
    });

    it('should throw on missing name', () => {
      const code = `enum { Up }`;
      const parser = createParser(code);

      expect(() => parser.parse()).toThrow(/identifier/i);
    });

    it('should throw on missing braces', () => {
      const code = `enum Direction`;
      const parser = createParser(code);

      expect(() => parser.parse()).toThrow(/\{/);
    });
  });
});
```

**Acceptance Criteria:**

- [ ] 15+ test cases written
- [ ] Basic enum parsing tested
- [ ] Const enum tested
- [ ] String enum tested
- [ ] Computed values tested
- [ ] Trailing comma tested
- [ ] Empty enum tested
- [ ] Error cases tested
- [ ] Location tracking verified
- [ ] All tests passing

---

### Task 8: Integration Tests

**File**: `src/parser/prototype/__tests__/enum-integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createParser } from '../../index';

describe('Enum Integration', () => {
  it('should parse enum with class', () => {
    const code = `
      enum Status { Active, Inactive }
      
      class User {
        status: Status;
      }
    `;
    const parser = createParser(code);
    const ast = parser.parse();

    expect(ast.body).toHaveLength(2);
    expect(ast.body[0].type).toBe('EnumDeclaration');
    expect(ast.body[1].type).toBe('ClassDeclaration');
  });

  it('should parse multiple enums', () => {
    const code = `
      enum Color { Red, Green, Blue }
      enum Size { Small, Medium, Large }
    `;
    const parser = createParser(code);
    const ast = parser.parse();

    expect(ast.body).toHaveLength(2);
  });

  it('should parse enum in namespace', () => {
    const code = `
      namespace Utils {
        enum LogLevel { Debug, Info, Error }
      }
    `;
    const parser = createParser(code);
    const ast = parser.parse();

    // Should parse namespace with enum inside
    expect(ast.body).toHaveLength(1);
  });
});
```

**Acceptance Criteria:**

- [ ] Integration with classes tested
- [ ] Multiple enums tested
- [ ] Namespace integration tested
- [ ] All tests passing

---

### Task 9: Documentation

**File**: Update `README.md` and `CHANGELOG.md`

**README.md:**

```markdown
## Features

- ✅ TypeScript enum declarations
  - Numeric enums
  - String enums
  - Const enums
  - Computed values
- ✅ Decorators (classes, methods)
- ✅ Generators (yield, yield\*)
- ✅ Async/await
```

**CHANGELOG.md:**

```markdown
## [1.0.0-alpha.7] - 2026-02-04

### Added

- TypeScript enum declarations support
  - Numeric enums
  - String enums
  - Const enums
  - Computed enum values
  - Empty enums
- 15+ enum parsing tests
- Full enum AST node types
```

**Acceptance Criteria:**

- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Examples added
- [ ] Feature list current

---

## Testing Strategy

### Unit Tests (15+ cases)

1. ✅ Basic numeric enum
2. ✅ String enum
3. ✅ Const enum
4. ✅ Explicit numeric values
5. ✅ Computed values
6. ✅ Trailing comma
7. ✅ Empty enum
8. ✅ Mixed enum
9. ✅ Location tracking (enum)
10. ✅ Location tracking (member)
11. ✅ Error: Missing name
12. ✅ Error: Missing braces
13. ✅ Error: Invalid member
14. ✅ Multiple members
15. ✅ Single member

### Integration Tests (3+ cases)

1. ✅ Enum with class
2. ✅ Multiple enums
3. ✅ Enum in namespace

---

## Acceptance Criteria

### Implementation Complete When:

- [ ] All AST types defined
- [ ] Parser implemented
- [ ] Integrated into main parser
- [ ] 15+ unit tests passing
- [ ] 3+ integration tests passing
- [ ] TypeScript compiles (0 errors)
- [ ] Documentation updated
- [ ] CHANGELOG updated

### Quality Gates:

- [ ] 95%+ test coverage
- [ ] All edge cases tested
- [ ] Error messages clear
- [ ] Location tracking accurate
- [ ] No breaking changes

---

## Timeline

**Estimated**: 4-6 hours

1. **Hour 1-2**: AST types + tokenizer verification
2. **Hour 3-4**: Parser implementation
3. **Hour 5**: Tests
4. **Hour 6**: Integration + documentation

---

## Notes

- Enums are transformed differently in const vs regular enums
- Const enums are inlined at compile time
- Regular enums become runtime objects
- This parser focuses on AST generation, not transformation

---

## References

- [TypeScript Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TS AST Viewer](https://ts-ast-viewer.com/)
- [Babel Parser](https://github.com/babel/babel/tree/main/packages/babel-parser)

---

**Ready to implement?** Start with Task 1 (AST Types).
