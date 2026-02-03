/**
 * PSR AST Node Types
 *
 * Abstract Syntax Tree node type definitions for PSR syntax.
 * Each node represents a syntactic construct in PSR code.
 */

/**
 * Base AST node interface
 * All nodes extend this base interface
 */
export interface IASTNode {
  readonly type: ASTNodeType;
  readonly location: INodeLocation;
}

/**
 * Node location information for error reporting
 */
export interface INodeLocation {
  readonly start: IPosition;
  readonly end: IPosition;
}

/**
 * Position in source code
 */
export interface IPosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

/**
 * AST Node Types Enum
 */
export enum ASTNodeType {
  // Program
  PROGRAM = 'Program',

  // Declarations
  COMPONENT_DECLARATION = 'ComponentDeclaration',
  VARIABLE_DECLARATION = 'VariableDeclaration',
  IMPORT_DECLARATION = 'ImportDeclaration',
  EXPORT_DECLARATION = 'ExportDeclaration',

  // Statements
  RETURN_STATEMENT = 'ReturnStatement',
  EXPRESSION_STATEMENT = 'ExpressionStatement',

  // Expressions
  IDENTIFIER = 'Identifier',
  LITERAL = 'Literal',
  CALL_EXPRESSION = 'CallExpression',
  ARROW_FUNCTION = 'ArrowFunction',
  ARRAY_PATTERN = 'ArrayPattern',

  // PSR-specific
  PSR_ELEMENT = 'PSRElement',
  PSR_ATTRIBUTE = 'PSRAttribute',
  PSR_SIGNAL_BINDING = 'PSRSignalBinding',
  PSR_EVENT_HANDLER = 'PSREventHandler',
  PSR_TEXT_NODE = 'PSRTextNode',
  PSR_CHILDREN = 'PSRChildren',
}

/**
 * Program node - root of AST
 */
export interface IProgramNode extends IASTNode {
  readonly type: ASTNodeType.PROGRAM;
  readonly body: IASTNode[];
}

/**
 * Component Declaration
 *
 * @example
 * component MyButton() { return <button>Click</button>; }
 */
export interface IComponentDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.COMPONENT_DECLARATION;
  readonly name: IIdentifierNode;
  readonly params: IIdentifierNode[];
  readonly body: IASTNode[];
  readonly returnStatement: IReturnStatementNode | null;
}

/**
 * Variable Declaration
 *
 * @example
 * const [count, setCount] = createSignal(0);
 */
export interface IVariableDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.VARIABLE_DECLARATION;
  readonly kind: 'const' | 'let';
  readonly declarations: Array<{
    id: IIdentifierNode | IArrayPatternNode;
    init: ICallExpressionNode | ILiteralNode | null;
  }>;
}

/**
 * Import Declaration
 *
 * @example
 * import { createSignal } from '@pulsar/runtime';
 */
export interface IImportDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.IMPORT_DECLARATION;
  readonly specifiers: IIdentifierNode[];
  readonly source: ILiteralNode;
}

/**
 * Export Declaration
 *
 * @example
 * export { MyButton };
 */
export interface IExportDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.EXPORT_DECLARATION;
  readonly declaration: IASTNode | null;
  readonly specifiers: IIdentifierNode[];
}

/**
 * Return Statement
 *
 * @example
 * return <button>Click</button>;
 */
export interface IReturnStatementNode extends IASTNode {
  readonly type: ASTNodeType.RETURN_STATEMENT;
  readonly argument: IASTNode | null;
}

/**
 * Expression Statement
 *
 * @example
 * console.log("Hello");
 */
export interface IExpressionStatementNode extends IASTNode {
  readonly type: ASTNodeType.EXPRESSION_STATEMENT;
  readonly expression: IASTNode;
}

/**
 * Identifier
 *
 * @example
 * count, setCount, MyButton
 */
export interface IIdentifierNode extends IASTNode {
  readonly type: ASTNodeType.IDENTIFIER;
  readonly name: string;
}

/**
 * Literal value
 *
 * @example
 * 0, "hello", true
 */
export interface ILiteralNode extends IASTNode {
  readonly type: ASTNodeType.LITERAL;
  readonly value: string | number | boolean | null;
  readonly raw: string;
}

/**
 * Call Expression
 *
 * @example
 * createSignal(0)
 */
export interface ICallExpressionNode extends IASTNode {
  readonly type: ASTNodeType.CALL_EXPRESSION;
  readonly callee: IIdentifierNode;
  readonly arguments: IASTNode[];
}

/**
 * Arrow Function
 *
 * @example
 * () => setCount(count() + 1)
 */
export interface IArrowFunctionNode extends IASTNode {
  readonly type: ASTNodeType.ARROW_FUNCTION;
  readonly params: IIdentifierNode[];
  readonly body: IASTNode | IASTNode[];
}

/**
 * Array Pattern (destructuring)
 *
 * @example
 * [count, setCount]
 */
export interface IArrayPatternNode extends IASTNode {
  readonly type: ASTNodeType.ARRAY_PATTERN;
  readonly elements: IIdentifierNode[];
}

/**
 * PSR Element
 *
 * @example
 * <button class="btn">Click</button>
 */
export interface IPSRElementNode extends IASTNode {
  readonly type: ASTNodeType.PSR_ELEMENT;
  readonly tagName: string;
  readonly attributes: IPSRAttributeNode[];
  readonly children: IASTNode[];
  readonly selfClosing: boolean;
}

/**
 * PSR Attribute
 *
 * @example
 * class="btn", disabled={loading}
 */
export interface IPSRAttributeNode extends IASTNode {
  readonly type: ASTNodeType.PSR_ATTRIBUTE;
  readonly name: string;
  readonly value: ILiteralNode | IASTNode | null;
  readonly isStatic: boolean;
}

/**
 * PSR Signal Binding
 *
 * @example
 * $(count)
 */
export interface IPSRSignalBindingNode extends IASTNode {
  readonly type: ASTNodeType.PSR_SIGNAL_BINDING;
  readonly signal: IIdentifierNode;
}

/**
 * PSR Event Handler
 *
 * @example
 * onClick={() => handleClick()}
 */
export interface IPSREventHandlerNode extends IASTNode {
  readonly type: ASTNodeType.PSR_EVENT_HANDLER;
  readonly eventName: string;
  readonly handler: IArrowFunctionNode | IIdentifierNode;
}

/**
 * PSR Text Node
 *
 * @example
 * "Click me"
 */
export interface IPSRTextNode extends IASTNode {
  readonly type: ASTNodeType.PSR_TEXT_NODE;
  readonly value: string;
}

/**
 * PSR Children container
 */
export interface IPSRChildrenNode extends IASTNode {
  readonly type: ASTNodeType.PSR_CHILDREN;
  readonly children: IASTNode[];
}
