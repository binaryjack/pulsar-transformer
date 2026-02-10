# Parser & AST Construction Patterns

**Research from: TypeScript, Babel, Svelte, Vue Compiler, Solid.js**

---

## Core Concepts

### What is Parsing?

Parsing is the process of analyzing a sequence of tokens to build an Abstract Syntax Tree (AST). The AST is a tree representation of the syntactic structure of code that's easier to analyze and transform than raw tokens.

**Tokens → AST:**

```psr
component Counter() {
  const [count, setCount] = signal(0);
}
```

**AST (Simplified):**

```
ComponentDeclaration {
  name: "Counter",
  params: [],
  body: BlockStatement {
    statements: [
      VariableDeclaration {
        kind: "const",
        declarations: [
          VariableDeclarator {
            id: ArrayPattern {
              elements: [
                Identifier("count"),
                Identifier("setCount")
              ]
            },
            init: CallExpression {
              callee: Identifier("signal"),
              arguments: [NumericLiteral(0)]
            }
          }
        ]
      }
    ]
  }
}
```

---

## Parser Architecture Patterns

### Pattern 1: Recursive Descent Parser (Most Common)

**Used by: TypeScript, Babel, Svelte**

```typescript
interface IParser {
  tokens: IToken[];
  pos: number;
  current: IToken;

  advance(): void;
  expect(type: TokenType): void;
  match(...types: TokenType[]): boolean;

  parseProgram(): IProgramNode;
  parseStatement(): IStatementNode;
  parseExpression(): IExpressionNode;
}

function parseProgram(parser: IParser): IProgramNode {
  const statements: IStatementNode[] = [];

  while (parser.current.type !== TokenType.EOF) {
    const stmt = parseStatement(parser);
    statements.push(stmt);
  }

  return {
    type: 'Program',
    body: statements,
  };
}

function parseStatement(parser: IParser): IStatementNode {
  // Dispatch based on current token
  switch (parser.current.type) {
    case TokenType.Component:
      return parseComponentDeclaration(parser);
    case TokenType.Const:
    case TokenType.Let:
    case TokenType.Var:
      return parseVariableDeclaration(parser);
    case TokenType.If:
      return parseIfStatement(parser);
    case TokenType.For:
      return parseForStatement(parser);
    case TokenType.Return:
      return parseReturnStatement(parser);
    case TokenType.LBrace:
      return parseBlockStatement(parser);
    default:
      return parseExpressionStatement(parser);
  }
}

function parseExpression(parser: IParser, precedence: number = 0): IExpressionNode {
  // Pratt parsing for operator precedence
  let left = parsePrimaryExpression(parser);

  while (isOperator(parser.current) && getPrecedence(parser.current) > precedence) {
    const operator = parser.current;
    parser.advance();

    const right = parseExpression(parser, getPrecedence(operator));

    left = {
      type: 'BinaryExpression',
      operator: operator.value,
      left,
      right,
    };
  }

  return left;
}
```

### Pattern 2: Pratt Parsing (Operator Precedence)

**Used for expression parsing in TypeScript, Babel**

```typescript
type PrefixParseFn = (parser: IParser) => IExpressionNode;
type InfixParseFn = (parser: IParser, left: IExpressionNode) => IExpressionNode;

const prefixParsers = new Map<TokenType, PrefixParseFn>();
const infixParsers = new Map<TokenType, InfixParseFn>();
const precedences = new Map<TokenType, number>();

// Register prefix parsers
prefixParsers.set(TokenType.Number, parseNumberLiteral);
prefixParsers.set(TokenType.String, parseStringLiteral);
prefixParsers.set(TokenType.Identifier, parseIdentifier);
prefixParsers.set(TokenType.LParen, parseGroupedExpression);
prefixParsers.set(TokenType.LBracket, parseArrayLiteral);
prefixParsers.set(TokenType.LBrace, parseObjectLiteral);
prefixParsers.set(TokenType.Minus, parsePrefixExpression);
prefixParsers.set(TokenType.Bang, parsePrefixExpression);
prefixParsers.set(TokenType.JSXOpenTag, parseJSXElement);

// Register infix parsers
infixParsers.set(TokenType.Plus, parseBinaryExpression);
infixParsers.set(TokenType.Minus, parseBinaryExpression);
infixParsers.set(TokenType.Star, parseBinaryExpression);
infixParsers.set(TokenType.Slash, parseBinaryExpression);
infixParsers.set(TokenType.LParen, parseCallExpression);
infixParsers.set(TokenType.LBracket, parseMemberExpression);
infixParsers.set(TokenType.Dot, parseDotMemberExpression);

// Precedences (higher = binds tighter)
precedences.set(TokenType.Equals, 1);
precedences.set(TokenType.EqualsEquals, 2);
precedences.set(TokenType.Plus, 3);
precedences.set(TokenType.Minus, 3);
precedences.set(TokenType.Star, 4);
precedences.set(TokenType.Slash, 4);
precedences.set(TokenType.LParen, 5); // Call expression
precedences.set(TokenType.Dot, 6); // Member access

function parseExpression(parser: IParser, precedence: number = 0): IExpressionNode {
  // Get prefix parser
  const prefixParseFn = prefixParsers.get(parser.current.type);
  if (!prefixParseFn) {
    throw new Error(`No prefix parser for ${parser.current.type}`);
  }

  let left = prefixParseFn(parser);

  // Handle infix operators
  while (precedence < getPrecedence(parser.current.type)) {
    const infixParseFn = infixParsers.get(parser.current.type);
    if (!infixParseFn) {
      return left;
    }

    left = infixParseFn(parser, left);
  }

  return left;
}

function parseBinaryExpression(parser: IParser, left: IExpressionNode): IExpressionNode {
  const operator = parser.current;
  const precedence = getPrecedence(operator.type);
  parser.advance();

  const right = parseExpression(parser, precedence);

  return {
    type: 'BinaryExpression',
    operator: operator.value,
    left,
    right,
    start: left.start,
    end: right.end,
  };
}

function parseCallExpression(parser: IParser, callee: IExpressionNode): IExpressionNode {
  parser.expect(TokenType.LParen);

  const args: IExpressionNode[] = [];

  if (parser.current.type !== TokenType.RParen) {
    do {
      args.push(parseExpression(parser));
    } while (parser.match(TokenType.Comma) && parser.advance());
  }

  parser.expect(TokenType.RParen);

  return {
    type: 'CallExpression',
    callee,
    arguments: args,
    start: callee.start,
    end: parser.current.end,
  };
}
```

---

## AST Node Types (Standard)

### From TypeScript & Babel

```typescript
// Base Node
interface INode {
  type: string;
  start: number;
  end: number;
  loc?: ISourceLocation;
}

interface ISourceLocation {
  start: IPosition;
  end: IPosition;
  source?: string;
}

// Program (Root)
interface IProgramNode extends INode {
  type: 'Program';
  body: IStatementNode[];
  sourceType: 'module' | 'script';
}

// Statements
interface IVariableDeclaration extends INode {
  type: 'VariableDeclaration';
  declarations: IVariableDeclarator[];
  kind: 'const' | 'let' | 'var';
}

interface IVariableDeclarator extends INode {
  type: 'VariableDeclarator';
  id: IPattern;
  init: IExpressionNode | null;
}

interface IFunctionDeclaration extends INode {
  type: 'FunctionDeclaration';
  id: IIdentifier | null;
  params: IPattern[];
  body: IBlockStatement;
  async: boolean;
  generator: boolean;
}

interface IBlockStatement extends INode {
  type: 'BlockStatement';
  body: IStatementNode[];
}

interface IReturnStatement extends INode {
  type: 'ReturnStatement';
  argument: IExpressionNode | null;
}

interface IIfStatement extends INode {
  type: 'IfStatement';
  test: IExpressionNode;
  consequent: IStatementNode;
  alternate: IStatementNode | null;
}

// Expressions
interface IBinaryExpression extends INode {
  type: 'BinaryExpression';
  operator: string;
  left: IExpressionNode;
  right: IExpressionNode;
}

interface ICallExpression extends INode {
  type: 'CallExpression';
  callee: IExpressionNode;
  arguments: Array<IExpressionNode | ISpreadElement>;
}

interface IMemberExpression extends INode {
  type: 'MemberExpression';
  object: IExpressionNode;
  property: IExpressionNode;
  computed: boolean;
}

interface IArrowFunctionExpression extends INode {
  type: 'ArrowFunctionExpression';
  params: IPattern[];
  body: IBlockStatement | IExpressionNode;
  async: boolean;
}

// Literals
interface IIdentifier extends INode {
  type: 'Identifier';
  name: string;
}

interface INumericLiteral extends INode {
  type: 'NumericLiteral';
  value: number;
}

interface IStringLiteral extends INode {
  type: 'StringLiteral';
  value: string;
}

interface IBooleanLiteral extends INode {
  type: 'BooleanLiteral';
  value: boolean;
}

interface IArrayExpression extends INode {
  type: 'ArrayExpression';
  elements: Array<IExpressionNode | ISpreadElement | null>;
}

interface IObjectExpression extends INode {
  type: 'ObjectExpression';
  properties: Array<IObjectProperty | ISpreadElement>;
}

// Patterns (for destructuring)
interface IArrayPattern extends INode {
  type: 'ArrayPattern';
  elements: Array<IPattern | null>;
}

interface IObjectPattern extends INode {
  type: 'ObjectPattern';
  properties: Array<IObjectProperty | IRestElement>;
}
```

---

## JSX AST Nodes (Critical for Pulsar)

### From React, Solid.js, Svelte

```typescript
// JSX Element
interface IJSXElement extends INode {
  type: 'JSXElement';
  openingElement: IJSXOpeningElement;
  closingElement: IJSXClosingElement | null;
  children: Array<IJSXElement | IJSXText | IJSXExpressionContainer>;
  selfClosing: boolean;
}

interface IJSXOpeningElement extends INode {
  type: 'JSXOpeningElement';
  name: IJSXIdentifier | IJSXMemberExpression;
  attributes: Array<IJSXAttribute | IJSXSpreadAttribute>;
  selfClosing: boolean;
}

interface IJSXClosingElement extends INode {
  type: 'JSXClosingElement';
  name: IJSXIdentifier | IJSXMemberExpression;
}

interface IJSXAttribute extends INode {
  type: 'JSXAttribute';
  name: IJSXIdentifier;
  value: IJSXAttributeValue | null;
}

type IJSXAttributeValue = IStringLiteral | IJSXExpressionContainer | IJSXElement;

interface IJSXExpressionContainer extends INode {
  type: 'JSXExpressionContainer';
  expression: IExpressionNode | IJSXEmptyExpression;
}

interface IJSXText extends INode {
  type: 'JSXText';
  value: string;
  raw: string;
}

interface IJSXFragment extends INode {
  type: 'JSXFragment';
  openingFragment: IJSXOpeningFragment;
  closingFragment: IJSXClosingFragment;
  children: Array<IJSXElement | IJSXText | IJSXExpressionContainer>;
}
```

### JSX Parsing Implementation

```typescript
function parseJSXElement(parser: IParser): IJSXElement {
  const start = parser.current.start;
  const openingElement = parseJSXOpeningElement(parser);

  // Self-closing
  if (openingElement.selfClosing) {
    return {
      type: 'JSXElement',
      openingElement,
      closingElement: null,
      children: [],
      selfClosing: true,
      start,
      end: parser.current.end,
    };
  }

  // Parse children
  const children: Array<IJSXChild> = [];

  while (parser.current.type !== TokenType.JSXCloseTag && !isEOF(parser)) {
    if (parser.current.type === TokenType.JSXText) {
      children.push(parseJSXText(parser));
    } else if (parser.current.type === TokenType.JSXExpressionStart) {
      children.push(parseJSXExpression(parser));
    } else if (parser.current.type === TokenType.JSXOpenTag) {
      children.push(parseJSXElement(parser)); // Recursive
    }
  }

  const closingElement = parseJSXClosingElement(parser);

  // Validate matching tags
  if (openingElement.name.name !== closingElement.name.name) {
    throw new Error(
      `JSX closing tag </$ {closingElement.name.name}> does not match opening tag <${openingElement.name.name}>`
    );
  }

  return {
    type: 'JSXElement',
    openingElement,
    closingElement,
    children,
    selfClosing: false,
    start,
    end: parser.current.end,
  };
}

function parseJSXOpeningElement(parser: IParser): IJSXOpeningElement {
  const start = parser.current.start;

  parser.expect(TokenType.JSXOpenTag); // '<'

  const name = parseJSXIdentifier(parser);
  const attributes: IJSXAttribute[] = [];

  // Parse attributes
  while (
    parser.current.type !== TokenType.JSXSelfClose &&
    parser.current.type !== TokenType.GreaterThan &&
    !isEOF(parser)
  ) {
    if (parser.current.type === TokenType.LBrace) {
      // Spread attribute: <Component {...props} />
      attributes.push(parseJSXSpreadAttribute(parser));
    } else {
      attributes.push(parseJSXAttribute(parser));
    }
  }

  let selfClosing = false;

  if (parser.current.type === TokenType.JSXSelfClose) {
    selfClosing = true;
    parser.advance(); // '/>'
  } else {
    parser.expect(TokenType.GreaterThan); // '>'
  }

  return {
    type: 'JSXOpeningElement',
    name,
    attributes,
    selfClosing,
    start,
    end: parser.current.end,
  };
}

function parseJSXAttribute(parser: IParser): IJSXAttribute {
  const start = parser.current.start;
  const name = parseJSXIdentifier(parser);

  let value: IJSXAttributeValue | null = null;

  if (parser.match(TokenType.Equals)) {
    parser.advance();

    if (parser.current.type === TokenType.String) {
      value = parseStringLiteral(parser);
    } else if (parser.current.type === TokenType.LBrace) {
      value = parseJSXExpression(parser);
    }
  }

  return {
    type: 'JSXAttribute',
    name,
    value,
    start,
    end: parser.current.end,
  };
}

function parseJSXExpression(parser: IParser): IJSXExpressionContainer {
  const start = parser.current.start;

  parser.expect(TokenType.LBrace); // '{'

  // Empty expression: {}
  if (parser.current.type === TokenType.RBrace) {
    parser.advance();
    return {
      type: 'JSXExpressionContainer',
      expression: { type: 'JSXEmptyExpression' },
      start,
      end: parser.current.end,
    };
  }

  const expression = parseExpression(parser);

  parser.expect(TokenType.RBrace); // '}'

  return {
    type: 'JSXExpressionContainer',
    expression,
    start,
    end: parser.current.end,
  };
}
```

---

## Template Literal Parsing

```typescript
interface ITemplateLiteral extends INode {
  type: 'TemplateLiteral';
  quasis: ITemplateElement[];
  expressions: IExpressionNode[];
}

interface ITemplateElement extends INode {
  type: 'TemplateElement';
  value: {
    raw: string;
    cooked: string;
  };
  tail: boolean;
}

function parseTemplateLiteral(parser: IParser): ITemplateLiteral {
  const start = parser.current.start;
  const quasis: ITemplateElement[] = [];
  const expressions: IExpressionNode[] = [];

  parser.expect(TokenType.TemplateHead); // '`...${'

  quasis.push({
    type: 'TemplateElement',
    value: {
      raw: parser.current.value,
      cooked: parseEscapeSequences(parser.current.value),
    },
    tail: false,
    start: parser.current.start,
    end: parser.current.end,
  });

  parser.advance();

  while (parser.current.type === TokenType.TemplateMiddle) {
    // Parse expression
    expressions.push(parseExpression(parser));

    parser.expect(TokenType.TemplateMiddle); // '}...${' or '}...`'

    quasis.push({
      type: 'TemplateElement',
      value: {
        raw: parser.current.value,
        cooked: parseEscapeSequences(parser.current.value),
      },
      tail: parser.current.type === TokenType.TemplateTail,
      start: parser.current.start,
      end: parser.current.end,
    });

    parser.advance();
  }

  // Final expression + tail
  if (parser.current.type !== TokenType.TemplateTail) {
    expressions.push(parseExpression(parser));
    parser.expect(TokenType.TemplateTail); // '}`
  }

  return {
    type: 'TemplateLiteral',
    quasis,
    expressions,
    start,
    end: parser.current.end,
  };
}
```

---

## Svelte-Specific AST Nodes

### Reactive Declarations

```typescript
interface IReactiveDeclaration extends INode {
  type: 'ReactiveDeclaration';
  label: IIdentifier; // '$'
  body: IExpressionStatement | IDeclaration;
}

// Example: $: doubled = count * 2;
function parseSvelteReactiveDeclaration(parser: IParser): IReactiveDeclaration {
  const start = parser.current.start;

  parser.expect(TokenType.Identifier); // '$'
  parser.expect(TokenType.Colon);

  const body = parseStatement(parser);

  return {
    type: 'ReactiveDeclaration',
    label: { type: 'Identifier', name: '$' },
    body,
    start,
    end: parser.current.end,
  };
}
```

### Directives

```typescript
interface ISvelteDirective extends INode {
  type: 'SvelteDirective';
  kind: 'bind' | 'on' | 'use' | 'transition' | 'animate';
  name: string;
  expression: IExpressionNode | null;
  modifiers: string[];
}

// Example: on:click|preventDefault={handleClick}
function parseSvelteDirective(parser: IParser): ISvelteDirective {
  // 'on:click|preventDefault'
  const parts = parser.current.value.split(':');
  const kind = parts[0]; // 'on'
  const nameAndModifiers = parts[1].split('|');
  const name = nameAndModifiers[0]; // 'click'
  const modifiers = nameAndModifiers.slice(1); // ['preventDefault']

  parser.advance();

  let expression: IExpressionNode | null = null;

  if (parser.match(TokenType.Equals)) {
    parser.advance();
    parser.expect(TokenType.LBrace);
    expression = parseExpression(parser);
    parser.expect(TokenType.RBrace);
  }

  return {
    type: 'SvelteDirective',
    kind: kind as any,
    name,
    expression,
    modifiers,
    start: parser.current.start,
    end: parser.current.end,
  };
}
```

---

## Custom PSR AST Nodes

```typescript
// PSR Component Declaration
interface IComponentDeclaration extends INode {
  type: 'ComponentDeclaration';
  id: IIdentifier;
  params: IPattern[];
  body: IBlockStatement;
  returnType?: ITypeAnnotation;
}

// Example: component Counter() { ... }
function parseComponentDeclaration(parser: IParser): IComponentDeclaration {
  const start = parser.current.start;

  parser.expect(TokenType.Component); // 'component'

  const id = parseIdentifier(parser);

  parser.expect(TokenType.LParen);
  const params = parseParameterList(parser);
  parser.expect(TokenType.RParen);

  // Optional return type
  let returnType: ITypeAnnotation | undefined;
  if (parser.match(TokenType.Colon)) {
    parser.advance();
    returnType = parseTypeAnnotation(parser);
  }

  const body = parseBlockStatement(parser);

  return {
    type: 'ComponentDeclaration',
    id,
    params,
    body,
    returnType,
    start,
    end: parser.current.end,
  };
}

// PSR Signal Call Detection
interface ISignalCallExpression extends ICallExpression {
  callee: IIdentifier & { name: 'signal' };
  isReactive: true;
}

function isSignalCall(node: ICallExpression): node is ISignalCallExpression {
  return node.callee.type === 'Identifier' && node.callee.name === 'signal';
}
```

---

## Error Recovery Strategies

### From TypeScript Compiler

```typescript
// Synchronization points for error recovery
function synchronize(parser: IParser): void {
  parser.advance();

  while (!isEOF(parser)) {
    // Stop at statement boundaries
    if (parser.current.type === TokenType.Semicolon) {
      parser.advance();
      return;
    }

    // Stop at keyword starts
    switch (parser.current.type) {
      case TokenType.Component:
      case TokenType.Function:
      case TokenType.Const:
      case TokenType.Let:
      case TokenType.If:
      case TokenType.For:
      case TokenType.While:
      case TokenType.Return:
        return;
    }

    parser.advance();
  }
}

function parseStatementWithRecovery(parser: IParser): IStatementNode {
  try {
    return parseStatement(parser);
  } catch (error) {
    // Log error
    parser.errors.push({
      message: error.message,
      position: parser.current.start,
      code: 'PARSE_ERROR',
    });

    // Try to recover
    synchronize(parser);

    // Return error node
    return {
      type: 'ErrorStatement',
      start: parser.current.start,
      end: parser.current.end,
    };
  }
}
```

### Partial AST Construction

```typescript
// Continue parsing even with errors
function parseComponentWithRecovery(parser: IParser): IComponentDeclaration {
  const start = parser.current.start;

  parser.expect(TokenType.Component);

  // Try to parse name
  let id: IIdentifier;
  try {
    id = parseIdentifier(parser);
  } catch {
    // Use placeholder
    id = { type: 'Identifier', name: '__error__', start, end: parser.current.end };
    synchronize(parser);
  }

  // Try to parse parameters
  let params: IPattern[] = [];
  try {
    parser.expect(TokenType.LParen);
    params = parseParameterList(parser);
    parser.expect(TokenType.RParen);
  } catch {
    parser.errors.push({ message: 'Invalid parameters', position: parser.current.start });
    synchronize(parser);
  }

  // Try to parse body
  let body: IBlockStatement;
  try {
    body = parseBlockStatement(parser);
  } catch {
    body = { type: 'BlockStatement', body: [], start, end: parser.current.end };
    synchronize(parser);
  }

  return {
    type: 'ComponentDeclaration',
    id,
    params,
    body,
    start,
    end: parser.current.end,
  };
}
```

---

## AST Validation

```typescript
interface IASTValidator {
  errors: IValidationError[];
  warnings: IValidationWarning[];

  validate(node: INode): void;
}

function validateAST(ast: IProgramNode): IASTValidator {
  const validator: IASTValidator = {
    errors: [],
    warnings: [],
  };

  walk(ast, {
    enter(node) {
      // Validate node structure
      if (!node.type) {
        validator.errors.push({
          message: 'Node missing type property',
          node,
        });
      }

      // Validate specific nodes
      if (node.type === 'ComponentDeclaration') {
        validateComponent(node as IComponentDeclaration, validator);
      }

      if (node.type === 'JSXElement') {
        validateJSXElement(node as IJSXElement, validator);
      }
    },
  });

  return validator;
}

function validateComponent(node: IComponentDeclaration, validator: IASTValidator): void {
  // Component must have a name
  if (!node.id || !node.id.name) {
    validator.errors.push({
      message: 'Component declaration must have a name',
      node,
    });
  }

  // Component name should be PascalCase
  if (node.id && !/^[A-Z]/.test(node.id.name)) {
    validator.warnings.push({
      message: 'Component names should start with uppercase letter',
      node: node.id,
    });
  }

  // Component must return JSX
  const hasReturn = findReturnStatement(node.body);
  if (!hasReturn) {
    validator.errors.push({
      message: 'Component must have a return statement',
      node,
    });
  }
}
```

---

## Performance Optimizations

### Node Object Pooling

```typescript
class NodePool {
  private pool: Map<string, INode[]> = new Map();

  acquire<T extends INode>(type: string): T {
    const nodes = this.pool.get(type);

    if (nodes && nodes.length > 0) {
      return nodes.pop() as T;
    }

    return this.createNode<T>(type);
  }

  release(node: INode): void {
    // Reset node properties
    for (const key in node) {
      if (key !== 'type') {
        delete (node as any)[key];
      }
    }

    const nodes = this.pool.get(node.type) || [];
    nodes.push(node);
    this.pool.set(node.type, nodes);
  }

  private createNode<T>(type: string): T {
    return { type } as T;
  }
}
```

###Lookahead Minimization

```typescript
// Instead of multiple lookaheads, cache decisions
interface IParserContext {
  isArrowFunction: boolean;
  isArrayPattern: boolean;
  isObjectPattern: boolean;
}

function parseParenthesizedExpression(parser: IParser): IExpressionNode {
  const context: IParserContext = {
    isArrowFunction: lookaheadIsArrowFunction(parser),
    isArrayPattern: false,
    isObjectPattern: false,
  };

  if (context.isArrowFunction) {
    return parseArrowFunction(parser);
  }

  return parseGroupedExpression(parser);
}
```

---

## Best Practices

1. **TypeScript**: Lookahead caching, error recovery, partial AST
2. **Babel**: Plugin system, node visitor pattern, immutable transforms
3. **Svelte**: Directive parsing, reactive declaration detection
4. **Vue**: Template-specific AST nodes, directive handling
5. **Solid.js**: JSX preservation, signal tracking in AST

---

**Next:** [03-reactivity-transformation-patterns.md](./03-reactivity-transformation-patterns.md)
