/**
 * AST Node Type Definitions for PSR Parser
 * Based on ESTree spec, TypeScript, and Babel patterns
 */

/**
 * Base node interface - all AST nodes extend this
 */
export interface IASTNode {
  type: string;
  start: number;
  end: number;
  line?: number;
  column?: number;
}

/**
 * Program - Root AST node
 */
export interface IProgramNode extends IASTNode {
  type: 'Program';
  body: IStatementNode[];
  sourceType: 'module' | 'script';
}

/**
 * ==================== DECLARATIONS ====================
 */

/**
 * Import Declaration
 * import { createSignal } from '@pulsar-framework/pulsar.dev';
 */
export interface IImportDeclaration extends IASTNode {
  type: 'ImportDeclaration';
  specifiers: IImportSpecifier[];
  source: IStringLiteral;
  typeOnly?: boolean; // true for 'import type { ... }'
}

export interface IImportSpecifier extends IASTNode {
  type: 'ImportSpecifier';
  imported: IIdentifier;
  local: IIdentifier;
  typeOnly?: boolean; // true for 'import { type Foo, ... }'
}

/**
 * Export Declaration
 * export component Counter() {}
 * export const Badge = () => {}
 */
export interface IExportNamedDeclaration extends IASTNode {
  type: 'ExportNamedDeclaration';
  declaration: IDeclarationNode | null;
  specifiers: IExportSpecifier[];
}

export interface IExportSpecifier extends IASTNode {
  type: 'ExportSpecifier';
  exported: IIdentifier;
  local: IIdentifier;
}

export interface IExportDefaultDeclaration extends IASTNode {
  type: 'ExportDefaultDeclaration';
  declaration: IExpression;
}

/**
 * Interface Declaration (TypeScript)
 * interface ICounterProps { id?: string; }
 */
export interface IInterfaceDeclaration extends IASTNode {
  type: 'InterfaceDeclaration';
  name: IIdentifier;
  body: IInterfaceBody;
}

export interface IInterfaceBody extends IASTNode {
  type: 'InterfaceBody';
  properties: IPropertySignature[];
}

export interface IPropertySignature extends IASTNode {
  type: 'PropertySignature';
  key: IIdentifier;
  optional: boolean;
  typeAnnotation: ITypeAnnotation;
}

export interface ITypeAnnotation extends IASTNode {
  type: 'TypeAnnotation';
  typeAnnotation: ITypeNode;
}

/**
 * Component Declaration (PSR-specific)
 * component Counter({id}: ICounterProps) { ... }
 */
export interface IComponentDeclaration extends IASTNode {
  type: 'ComponentDeclaration';
  name: IIdentifier;
  typeParameters?: any[];
  params: IParameter[];
  body: IBlockStatement;
  exported: boolean;
}

/**
 * Function Declaration
 * const Badge = ({label}: IBadgeProps): HTMLElement => { ... }
 */
export interface IFunctionDeclaration extends IASTNode {
  type: 'FunctionDeclaration';
  id: IIdentifier | null;
  typeParameters?: any[];
  params: IParameter[];
  body: IBlockStatement;
  returnType?: ITypeAnnotation;
  async: boolean;
}

export interface IParameter extends IASTNode {
  type: 'Parameter';
  pattern: IPattern;
  typeAnnotation?: ITypeAnnotation;
}

/**
 * Variable Declaration
 * const [count, setCount] = createSignal(0);
 */
export interface IVariableDeclaration extends IASTNode {
  type: 'VariableDeclaration';
  kind: 'const' | 'let' | 'var';
  declarations: IVariableDeclarator[];
}

export interface IVariableDeclarator extends IASTNode {
  type: 'VariableDeclarator';
  id: IPattern;
  init: IExpression | null;
}

/**
 * ==================== STATEMENTS ====================
 */

export type IStatementNode =
  | IImportDeclaration
  | IExportNamedDeclaration
  | IExportDefaultDeclaration
  | IInterfaceDeclaration
  | IComponentDeclaration
  | IFunctionDeclaration
  | IVariableDeclaration
  | IBlockStatement
  | IReturnStatement
  | IExpressionStatement
  | IIfStatement
  | IForStatement
  | IWhileStatement;

export type IDeclarationNode =
  | IComponentDeclaration
  | IFunctionDeclaration
  | IVariableDeclaration
  | IInterfaceDeclaration;

export interface IBlockStatement extends IASTNode {
  type: 'BlockStatement';
  body: IStatementNode[];
}

export interface IReturnStatement extends IASTNode {
  type: 'ReturnStatement';
  argument: IExpression | null;
}

export interface IExpressionStatement extends IASTNode {
  type: 'ExpressionStatement';
  expression: IExpression;
}

export interface IIfStatement extends IASTNode {
  type: 'IfStatement';
  test: IExpression;
  consequent: IStatementNode;
  alternate: IStatementNode | null;
}

export interface IForStatement extends IASTNode {
  type: 'ForStatement';
  init: IVariableDeclaration | IExpression | null;
  test: IExpression | null;
  update: IExpression | null;
  body: IStatementNode;
}

export interface IWhileStatement extends IASTNode {
  type: 'WhileStatement';
  test: IExpression;
  body: IStatementNode;
}

/**
 * ==================== EXPRESSIONS ====================
 */

export type IExpression =
  | IIdentifier
  | ILiteral
  | ITemplateLiteral
  | ICallExpression
  | IMemberExpression
  | IBinaryExpression
  | ILogicalExpression
  | IUnaryExpression
  | IUpdateExpression
  | IConditionalExpression
  | IArrowFunctionExpression
  | IArrayExpression
  | IObjectExpression
  | IJSXElement;

export interface IIdentifier extends IASTNode {
  type: 'Identifier';
  name: string;
}

export interface ILiteral extends IASTNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

/**
 * Template Literal (ES2015)
 * `hello ${name}!`
 * Following ESTree specification
 */
export interface ITemplateLiteral extends IASTNode {
  type: 'TemplateLiteral';
  quasis: ITemplateElement[];
  expressions: IExpression[];
}

export interface ITemplateElement extends IASTNode {
  type: 'TemplateElement';
  value: {
    cooked: string; // Processed value (escape sequences converted)
    raw: string; // Raw value (as written in source)
  };
  tail: boolean; // true if this is the last element
}

export interface IStringLiteral extends ILiteral {
  value: string;
}

export interface INumberLiteral extends ILiteral {
  value: number;
}

export interface IBooleanLiteral extends ILiteral {
  value: boolean;
}

export interface ICallExpression extends IASTNode {
  type: 'CallExpression';
  callee: IExpression;
  arguments: IExpression[];
}

export interface IMemberExpression extends IASTNode {
  type: 'MemberExpression';
  object: IExpression;
  property: IExpression;
  computed: boolean; // true for a[b], false for a.b
}

export interface IBinaryExpression extends IASTNode {
  type: 'BinaryExpression';
  left: IExpression;
  operator: string; // +, -, *, /, %, ==, ===, !=, !==, <, >, <=, >=
  right: IExpression;
}

export interface ILogicalExpression extends IASTNode {
  type: 'LogicalExpression';
  left: IExpression;
  operator: '&&' | '||';
  right: IExpression;
}

export interface IUnaryExpression extends IASTNode {
  type: 'UnaryExpression';
  operator: string; // !, -, +, ~
  argument: IExpression;
  prefix: boolean;
}

export interface IUpdateExpression extends IASTNode {
  type: 'UpdateExpression';
  operator: string; // ++, --
  argument: IExpression;
  prefix: boolean; // true for ++x, false for x++
}

export interface IConditionalExpression extends IASTNode {
  type: 'ConditionalExpression';
  test: IExpression;
  consequent: IExpression;
  alternate: IExpression;
}

export interface IArrowFunctionExpression extends IASTNode {
  type: 'ArrowFunctionExpression';
  params: IParameter[];
  body: IBlockStatement | IExpression;
  async: boolean;
}

export interface IArrayExpression extends IASTNode {
  type: 'ArrayExpression';
  elements: (IExpression | null)[];
}

export interface IObjectExpression extends IASTNode {
  type: 'ObjectExpression';
  properties: IProperty[];
}

export interface IProperty extends IASTNode {
  type: 'Property';
  key: IExpression;
  value: IExpression;
  computed: boolean;
  shorthand: boolean;
}

/**
 * ==================== PATTERNS ====================
 */

export type IPattern = IIdentifier | IArrayPattern | IObjectPattern;

export interface IArrayPattern extends IASTNode {
  type: 'ArrayPattern';
  elements: (IPattern | null)[];
}

export interface IObjectPattern extends IASTNode {
  type: 'ObjectPattern';
  properties: IObjectPatternProperty[];
}

export interface IObjectPatternProperty extends IASTNode {
  type: 'Property';
  key: IIdentifier;
  value: IPattern;
  shorthand: boolean;
}

/**
 * ==================== JSX ====================
 */

export interface IJSXElement extends IASTNode {
  type: 'JSXElement';
  openingElement: IJSXOpeningElement;
  children: IJSXChild[];
  closingElement: IJSXClosingElement | null;
}

export interface IJSXOpeningElement extends IASTNode {
  type: 'JSXOpeningElement';
  name: IJSXIdentifier;
  attributes: IJSXAttribute[];
  selfClosing: boolean;
}

export interface IJSXClosingElement extends IASTNode {
  type: 'JSXClosingElement';
  name: IJSXIdentifier;
}

export interface IJSXIdentifier extends IASTNode {
  type: 'JSXIdentifier';
  name: string;
}

export interface IJSXAttribute extends IASTNode {
  type: 'JSXAttribute';
  name: IJSXIdentifier;
  value: IStringLiteral | IJSXExpressionContainer | null;
}

export interface IJSXExpressionContainer extends IASTNode {
  type: 'JSXExpressionContainer';
  expression: IExpression;
}

export interface IJSXText extends IASTNode {
  type: 'JSXText';
  value: string;
  raw: string;
}

export type IJSXChild = IJSXElement | IJSXText | IJSXExpressionContainer;

/**
 * ==================== TYPE NODES ====================
 */

export type ITypeNode =
  | ITypeReference
  | IUnionType
  | IStringKeyword
  | INumberKeyword
  | IBooleanKeyword;

export interface ITypeReference extends IASTNode {
  type: 'TypeReference';
  typeName: IIdentifier;
}

export interface IUnionType extends IASTNode {
  type: 'UnionType';
  types: ITypeNode[];
}

export interface IStringKeyword extends IASTNode {
  type: 'StringKeyword';
}

export interface INumberKeyword extends IASTNode {
  type: 'NumberKeyword';
}

export interface IBooleanKeyword extends IASTNode {
  type: 'BooleanKeyword';
}
