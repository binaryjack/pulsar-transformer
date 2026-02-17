/**
 * Shared AST type definitions
 * Used by transformer and semantic analyzer
 * NOTE: These are legacy types from the old custom parser.
 * New code should use @babel/types where possible.
 */

export type NodeType =
  | 'Program'
  | 'ComponentDeclaration'
  | 'FunctionDeclaration'
  | 'VariableDeclaration'
  | 'VariableDeclarator'
  | 'BlockStatement'
  | 'ExpressionStatement'
  | 'ReturnStatement'
  | 'IfStatement'
  | 'ForStatement'
  | 'WhileStatement'
  | 'CallExpression'
  | 'Identifier'
  | 'Literal'
  | 'StringLiteral'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'MemberExpression'
  | 'ArrayExpression'
  | 'ObjectExpression'
  | 'Property'
  | 'ArrowFunctionExpression'
  | 'JSXElement'
  | 'JSXOpeningElement'
  | 'JSXClosingElement'
  | 'JSXAttribute'
  | 'JSXText'
  | 'JSXExpressionContainer'
  | 'JSXSpreadAttribute'
  | 'JSXIdentifier'
  | 'JSXMemberExpression'
  | 'JSXFragment'
  | 'ImportDeclaration'
  | 'ImportSpecifier'
  | 'ImportDefaultSpecifier'
  | 'ImportNamespaceSpecifier'
  | 'ExportNamedDeclaration'
  | 'ExportDefaultDeclaration'
  | 'ExportSpecifier'
  | 'InterfaceDeclaration'
  | 'TypeAnnotation'
  | 'TypeParameterDeclaration'
  | 'TypeParameter';

export interface ISourceLocation {
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

/**
 * Base AST Node interface
 */
export interface IASTNode {
  type: NodeType;
  loc?: ISourceLocation;
  [key: string]: unknown;
}

/**
 * Program Node (root of AST)
 */
export interface IProgramNode extends IASTNode {
  type: 'Program';
  body: IStatementNode[];
  sourceType: 'module' | 'script';
}

/**
 * Statement Nodes
 */
export interface IStatementNode extends IASTNode {
  type:
    | 'ComponentDeclaration'
    | 'FunctionDeclaration'
    | 'VariableDeclaration'
    | 'BlockStatement'
    | 'ExpressionStatement'
    | 'ReturnStatement'
    | 'IfStatement'
    | 'ForStatement'
    | 'WhileStatement'
    | 'ImportDeclaration'
    | 'ExportNamedDeclaration'
    | 'ExportDefaultDeclaration'
    | 'InterfaceDeclaration';
}

export interface IComponentDeclaration extends IStatementNode {
  type: 'ComponentDeclaration';
  id: IIdentifier;
  params: IIdentifier[];
  body: IBlockStatement;
  exported: boolean;
  typeParameters?: ITypeParameterDeclaration;
}

export interface IFunctionDeclaration extends IStatementNode {
  type: 'FunctionDeclaration';
  id: IIdentifier;
  params: IIdentifier[];
  body: IBlockStatement;
  async?: boolean;
  generator?: boolean;
}

export interface IVariableDeclaration extends IStatementNode {
  type: 'VariableDeclaration';
  kind: 'const' | 'let' | 'var';
  declarations: IVariableDeclarator[];
}

export interface IVariableDeclarator extends IASTNode {
  type: 'VariableDeclarator';
  id: IIdentifier;
  init?: IExpression;
}

export interface IBlockStatement extends IStatementNode {
  type: 'BlockStatement';
  body: IStatementNode[];
}

export interface IExpressionStatement extends IStatementNode {
  type: 'ExpressionStatement';
  expression: IExpression;
}

export interface IReturnStatement extends IStatementNode {
  type: 'ReturnStatement';
  argument?: IExpression;
}

export interface IIfStatement extends IStatementNode {
  type: 'IfStatement';
  test: IExpression;
  consequent: IStatementNode;
  alternate?: IStatementNode;
}

export interface IForStatement extends IStatementNode {
  type: 'ForStatement';
  init?: IVariableDeclaration | IExpression;
  test?: IExpression;
  update?: IExpression;
  body: IStatementNode;
}

export interface IWhileStatement extends IStatementNode {
  type: 'WhileStatement';
  test: IExpression;
  body: IStatementNode;
}

export interface IImportDeclaration extends IStatementNode {
  type: 'ImportDeclaration';
  specifiers: IImportSpecifier[];
  source: ILiteral;
}

export interface IImportSpecifier extends IASTNode {
  type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
  local: IIdentifier;
  imported?: IIdentifier;
}

export interface IExportNamedDeclaration extends IStatementNode {
  type: 'ExportNamedDeclaration';
  declaration?: IStatementNode;
  specifiers?: IExportSpecifier[];
  source?: ILiteral;
}

export interface IExportDefaultDeclaration extends IStatementNode {
  type: 'ExportDefaultDeclaration';
  declaration: IStatementNode | IExpression;
}

export interface IExportSpecifier extends IASTNode {
  type: 'ExportSpecifier';
  local: IIdentifier;
  exported: IIdentifier;
}

export interface IInterfaceDeclaration extends IStatementNode {
  type: 'InterfaceDeclaration';
  id: IIdentifier;
  body: IObjectExpression;
  typeParameters?: ITypeParameterDeclaration;
  extends?: IIdentifier[];
}

/**
 * Expression Nodes
 */
export interface IExpression extends IASTNode {
  type:
    | 'CallExpression'
    | 'Identifier'
    | 'Literal'
    | 'StringLiteral'
    | 'BinaryExpression'
    | 'UnaryExpression'
    | 'MemberExpression'
    | 'ArrayExpression'
    | 'ObjectExpression'
    | 'ArrowFunctionExpression'
    | 'JSXElement'
    | 'JSXFragment'
    | 'JSXExpressionContainer';
}

export interface ICallExpression extends IExpression {
  type: 'CallExpression';
  callee: IExpression;
  arguments: IExpression[];
}

export interface IIdentifier extends IExpression {
  type: 'Identifier';
  name: string;
}

export interface ILiteral extends IExpression {
  type: 'Literal' | 'StringLiteral';
  value: string | number | boolean | null;
  raw?: string;
}

export type IStringLiteral = ILiteral;

export interface IBinaryExpression extends IExpression {
  type: 'BinaryExpression';
  operator: string;
  left: IExpression;
  right: IExpression;
}

export interface IUnaryExpression extends IExpression {
  type: 'UnaryExpression';
  operator: string;
  argument: IExpression;
  prefix: boolean;
}

export interface IMemberExpression extends IExpression {
  type: 'MemberExpression';
  object: IExpression;
  property: IExpression;
  computed: boolean;
}

export interface IArrayExpression extends IExpression {
  type: 'ArrayExpression';
  elements: IExpression[];
}

export interface IObjectExpression extends IExpression {
  type: 'ObjectExpression';
  properties: IProperty[];
}

export interface IProperty extends IASTNode {
  type: 'Property';
  key: IExpression;
  value: IExpression;
  kind: 'init' | 'get' | 'set';
  method: boolean;
  shorthand: boolean;
  computed: boolean;
}

export interface IArrowFunctionExpression extends IExpression {
  type: 'ArrowFunctionExpression';
  params: IIdentifier[];
  body: IBlockStatement | IExpression;
  async?: boolean;
}

/**
 * JSX Nodes
 */
export interface IJSXElement extends IExpression {
  type: 'JSXElement';
  openingElement: IJSXOpeningElement;
  closingElement?: IJSXClosingElement;
  children: IJSXChild[];
}

export interface IJSXOpeningElement extends IASTNode {
  type: 'JSXOpeningElement';
  name: IJSXIdentifier | IJSXMemberExpression;
  attributes: (IJSXAttribute | IJSXSpreadAttribute)[];
  selfClosing: boolean;
}

export interface IJSXClosingElement extends IASTNode {
  type: 'JSXClosingElement';
  name: IJSXIdentifier | IJSXMemberExpression;
}

export interface IJSXAttribute extends IASTNode {
  type: 'JSXAttribute';
  name: IJSXIdentifier;
  value?: ILiteral | IJSXExpressionContainer | IJSXElement;
}

export interface IJSXSpreadAttribute extends IASTNode {
  type: 'JSXSpreadAttribute';
  argument: IExpression;
}

export interface IJSXIdentifier extends IASTNode {
  type: 'JSXIdentifier';
  name: string;
}

export interface IJSXMemberExpression extends IASTNode {
  type: 'JSXMemberExpression';
  object: IJSXIdentifier | IJSXMemberExpression;
  property: IJSXIdentifier;
}

export interface IJSXText extends IASTNode {
  type: 'JSXText';
  value: string;
  raw: string;
}

export interface IJSXExpressionContainer extends IExpression {
  type: 'JSXExpressionContainer';
  expression: IExpression;
}

export interface IJSXFragment extends IExpression {
  type: 'JSXFragment';
  children: IJSXChild[];
}

export type IJSXChild = IJSXElement | IJSXText | IJSXExpressionContainer | IJSXFragment;

/**
 * TypeScript Nodes
 */
export interface ITypeParameterDeclaration extends IASTNode {
  type: 'TypeParameterDeclaration';
  params: ITypeParameter[];
}

export interface ITypeParameter extends IASTNode {
  type: 'TypeParameter';
  name: string;
  constraint?: IASTNode;
  default?: IASTNode;
}

export interface ITypeAnnotation extends IASTNode {
  type: 'TypeAnnotation';
  typeAnnotation: IASTNode;
}

/**
 * Token type (minimal definition for validator)
 */
export interface IToken {
  type: string;
  value: string;
  line: number;
  column: number;
  start: number;
  end: number;
}
