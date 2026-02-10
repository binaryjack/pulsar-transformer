# Phase 2: Parser Implementation Plan

**Date:** 2026-02-10 21:45  
**Goal:** Build AST from token stream for counter.psr  
**Status:** In Progress

---

## Objective

Convert token stream from Lexer → Abstract Syntax Tree (AST).

**Input:** Tokens from Lexer  
**Output:** AST representing program structure

---

## AST Node Types Needed

From counter.psr analysis:

```typescript
// Import statement
interface IImportDeclaration {
  type: 'ImportDeclaration';
  specifiers: IImportSpecifier[];
  source: string;
}

// Interface declaration
interface IInterfaceDeclaration {
  type: 'InterfaceDeclaration';
  name: string;
  properties: IProperty[];
}

// Component declaration
interface IComponentDeclaration {
  type: 'ComponentDeclaration';
  name: string;
  params: IParameter[];
  body: IBlockStatement;
}

// Statements
interface IVariableDeclaration {
  type: 'VariableDeclaration';
  kind: 'const' | 'let' | 'var';
  declarations: IVariableDeclarator[];
}

interface IReturnStatement {
  type: 'ReturnStatement';
  argument: IExpression;
}

// Expressions
interface ICallExpression {
  type: 'CallExpression';
  callee: IExpression;
  arguments: IExpression[];
}

// JSX
interface IJSXElement {
  type: 'JSXElement';
  tagName: string;
  attributes: IJSXAttribute[];
  children: (IJSXElement | IJSXText | IJSXExpression)[];
  selfClosing: boolean;
}
```

---

## Parser Architecture

**Prototype-based structure:**

```
src/parser/
  parser.ts              ← Parser constructor + core methods
  parser.types.ts        ← AST node interfaces
  prototypes/
    parse-program.ts     ← Top-level parsing
    parse-import.ts      ← Import declarations
    parse-interface.ts   ← Interface declarations
    parse-component.ts   ← Component declarations
    parse-statement.ts   ← Statement parsing
    parse-expression.ts  ← Expression parsing
    parse-jsx.ts         ← JSX element parsing
```

---

## Implementation Steps

### Step 1: AST Node Types ✅ NEXT

- Define all AST node interfaces
- Create base node type
- Export type guards

### Step 2: Parser Core

- Constructor with token stream
- Current token tracking
- advance(), peek(), match() methods
- Error handling

### Step 3: Top-Level Parsing

- parseProgram() - entry point
- Handles imports, interfaces, components

### Step 4: Declaration Parsing

- parseImport()
- parseInterface()
- parseComponent()

### Step 5: Statement Parsing

- parseStatement()
- parseVariableDeclaration()
- parseReturnStatement()

### Step 6: Expression Parsing

- parseExpression() - operator precedence
- parseCallExpression()
- parseIdentifier()
- parseLiteral()

### Step 7: JSX Parsing

- parseJSXElement()
- parseJSXAttributes()
- parseJSXChildren()

---

## Time Estimate

- AST types: 30min
- Core parser: 30min
- Top-level: 20min
- Declarations: 45min
- Statements: 30min
- Expressions: 45min
- JSX: 60min

**Total: ~4.5 hours**

---

## Next Action

Create AST node type definitions.
