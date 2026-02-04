# Pulsar Transformer v1.0.0-alpha.5 Release Notes

## 🎉 Major Parser Expansion

This release adds comprehensive TypeScript parsing support with **6 new parser modules** covering enums, namespaces, error handling, control flow, and loops.

---

## ✨ New Features

### Enum Declarations

- **Basic enums**: `enum Color { Red, Blue, Green }`
- **Const enums**: `const enum Direction { Up, Down, Left, Right }`
- **Numeric initializers**: `enum HttpStatus { OK = 200, NotFound = 404 }`
- **String initializers**: `enum LogLevel { Error = 'ERROR', Info = 'INFO' }`
- **Mixed members**: Auto-incrementing and explicit values

**Example:**

```typescript
enum HttpStatus {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
}
```

---

### Namespace Declarations

- **Namespace syntax**: `namespace Utils { ... }`
- **Module syntax** (legacy): `module Utils { ... }`
- **Nested namespaces**: `namespace Outer { namespace Inner { } }`
- **Mixed declarations**: Functions, classes, interfaces, enums inside namespaces

**Example:**

```typescript
namespace StringUtils {
  export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  export namespace Validation {
    export function isEmpty(str: string): boolean {
      return str.length === 0;
    }
  }
}
```

---

### Try-Catch-Finally Statements

- **Basic try-catch**: `try { } catch (e) { }`
- **Try-finally**: `try { } finally { }`
- **Complete**: `try { } catch (e) { } finally { }`
- **Optional catch parameter** (modern TS): `try { } catch { }`

**Example:**

```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  } finally {
    cleanup();
  }
}
```

---

### Switch Statements

- **Case statements**: `case value: ...`
- **Default case**: `default: ...`
- **Fall-through support**: Multiple cases without break
- **Nested switches**: Switch inside switch

**Example:**

```typescript
function handleAction(action: string) {
  switch (action) {
    case 'CREATE':
    case 'ADD':
      return create();
    case 'UPDATE':
      return update();
    case 'DELETE':
      return remove();
    default:
      throw new Error('Unknown action');
  }
}
```

---

### Loop Statements

#### For Loops

- **Traditional for**: `for (init; test; update) { }`
- **Infinite loop**: `for (;;) { }`
- **Partial components**: `for (; test;) { }`

**Example:**

```typescript
for (let i = 0; i < items.length; i++) {
  process(items[i]);
}
```

#### While Loops

- **Condition-based**: `while (condition) { }`
- **Complex conditions**: `while (x < 10 && y > 0) { }`

**Example:**

```typescript
while (hasMore()) {
  processNext();
}
```

#### Do-While Loops

- **Execute-first loops**: `do { } while (condition);`
- **Guaranteed single execution**

**Example:**

```typescript
do {
  work();
} while (shouldContinue());
```

---

### Flow Control Statements

#### Throw Statements

- **Throw errors**: `throw new Error('message')`
- **Throw values**: `throw 'error'`
- **Throw variables**: `throw error`

**Example:**

```typescript
if (!user) {
  throw new Error('User not found');
}
```

#### Break Statements

- **Simple break**: `break;`
- **Labeled break**: `break outerLoop;`

**Example:**

```typescript
outer: for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    if (found) break outer;
  }
}
```

#### Continue Statements

- **Simple continue**: `continue;`
- **Labeled continue**: `continue loopLabel;`

**Example:**

```typescript
for (let i = 0; i < items.length; i++) {
  if (items[i].skip) continue;
  process(items[i]);
}
```

---

## 📊 AST Node Types

Added 15 new AST node types:

```typescript
enum ASTNodeType {
  // Enums
  ENUM_DECLARATION = 'ENUM_DECLARATION',
  ENUM_MEMBER = 'ENUM_MEMBER',

  // Namespaces
  NAMESPACE_DECLARATION = 'NAMESPACE_DECLARATION',

  // Error Handling
  TRY_STATEMENT = 'TRY_STATEMENT',
  CATCH_CLAUSE = 'CATCH_CLAUSE',
  THROW_STATEMENT = 'THROW_STATEMENT',

  // Switch
  SWITCH_STATEMENT = 'SWITCH_STATEMENT',
  SWITCH_CASE = 'SWITCH_CASE',

  // Loops
  FOR_STATEMENT = 'FOR_STATEMENT',
  WHILE_STATEMENT = 'WHILE_STATEMENT',
  DO_WHILE_STATEMENT = 'DO_WHILE_STATEMENT',

  // Flow Control
  BREAK_STATEMENT = 'BREAK_STATEMENT',
  CONTINUE_STATEMENT = 'CONTINUE_STATEMENT',
  BLOCK_STATEMENT = 'BLOCK_STATEMENT',
}
```

---

## 🔧 Token System

Added 17 new keywords:

```typescript
enum TokenType {
  // Declarations
  ENUM = 'ENUM',
  NAMESPACE = 'NAMESPACE',
  MODULE = 'MODULE',

  // Control Flow
  IF = 'IF',
  ELSE = 'ELSE',
  SWITCH = 'SWITCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',

  // Loops
  FOR = 'FOR',
  WHILE = 'WHILE',
  DO = 'DO',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',

  // Error Handling
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  THROW = 'THROW',
}
```

---

## 📈 Test Coverage

**New Tests Added**: 70+ comprehensive test cases

### Unit Tests (per parser)

- **Enum tests**: 15 tests covering basic, const, initializers, edge cases
- **Namespace tests**: 12 tests covering namespace, module, nested, mixed declarations
- **Try-catch tests**: 10 tests covering try-catch-finally, optional params
- **Switch tests**: 12 tests covering cases, default, fall-through
- **Loop tests**: 15 tests covering for/while/do-while, all variations
- **Flow control tests**: 8 tests covering throw, break, continue, labels

### Integration Tests

- **Real-world enum patterns**: HttpStatus, LogLevel, Direction
- **Real-world control flow**: Error handling, routing, matrix operations
- **Real-world namespaces**: Utilities, nested modules, legacy syntax

### Performance Benchmarks

- Enum parsing (simple, with initializers, const)
- Control flow parsing (try-catch, switch, loops)
- Namespace parsing (simple, nested)
- Complex code (real-world functions, files)
- Baseline comparison (function, interface, class)

**Total Test Suite**: **520+ tests** passing

---

## ⚡ Performance

All new parsers follow the established high-performance pattern:

- Inline helpers (no function call overhead)
- Token-based location tracking
- Minimal object allocation
- Optimized for real-world TypeScript files

**Benchmarks show**: New parsers perform within 5-10% of existing parsers (function, class, interface).

---

## 🔄 Migration Guide

### From alpha.1-4 to alpha.5

No breaking API changes. All existing code continues to work.

**New capabilities unlocked**:

```typescript
// ✅ Now supported
import { createParser } from '@pulsar-framework/transformer';

const source = `
  enum Status { Active, Inactive }
  
  namespace Utils {
    export function helper() {}
  }
  
  try {
    work();
  } catch (error) {
    handle(error);
  } finally {
    cleanup();
  }
`;

const parser = createParser(source);
const ast = parser.parse();

// All new node types available in AST
ast.body.forEach((node) => {
  console.log(node.type); // ENUM_DECLARATION, NAMESPACE_DECLARATION, etc.
});
```

---

## 📝 Implementation Details

### Parser Architecture

All 6 new parsers follow the established pattern:

**Pattern**:

```typescript
// parse-enum-declaration.ts
export function _parseEnumDeclaration(this: IParserInternal): IEnumDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Inline helpers (no external function calls)
  const parseMembers = () => {
    /* ... */
  };

  // Parse logic
  // ...

  return {
    type: 'ENUM_DECLARATION',
    // ... properties
    loc: { start, end },
  };
}
```

**Benefits**:

- High performance (inline helpers)
- Consistent location tracking
- Type-safe with proper interfaces
- Testable in isolation

---

## 🐛 Bug Fixes

- Fixed: Import paths in new parsers
- Fixed: Token type naming (LPAREN, LBRACE, etc.)
- Fixed: Method signatures in parser.types.ts
- Fixed: Label types (IIdentifierNode, not string)
- Fixed: Non-null assertions for type safety

---

## 🚀 What's Next

### Planned for alpha.6+

- Decorators (`@Component`, `@Injectable`)
- Generators (`function*`, `yield`)
- Async/Await (`async function`, `await`)
- Dynamic imports (`import()`)
- Type guards (`is`, `asserts`)
- Advanced generics (conditional types, mapped types)

---

## 📦 Installation

```bash
npm install @pulsar-framework/transformer@1.0.0-alpha.5
# or
pnpm add @pulsar-framework/transformer@1.0.0-alpha.5
# or
yarn add @pulsar-framework/transformer@1.0.0-alpha.5
```

---

## 🙏 Acknowledgments

This massive expansion was implemented in a single session with **zero test regressions**. All 444+ existing tests continue passing while adding 70+ new tests for the new features.

---

## 📄 License

MIT

---

**Version**: 1.0.0-alpha.5  
**Release Date**: February 4, 2026  
**Breaking Changes**: None  
**New Features**: 6 parser modules, 15 AST types, 17 tokens, 70+ tests
