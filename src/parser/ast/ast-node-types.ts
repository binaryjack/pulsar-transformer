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
  FUNCTION_DECLARATION = 'FunctionDeclaration',
  CLASS_DECLARATION = 'ClassDeclaration',
  INTERFACE_DECLARATION = 'InterfaceDeclaration',
  TYPE_ALIAS = 'TypeAlias',
  TYPE_ANNOTATION = 'TypeAnnotation',
  ENUM_DECLARATION = 'EnumDeclaration',
  NAMESPACE_DECLARATION = 'NamespaceDeclaration',
  IMPORT_DECLARATION = 'ImportDeclaration',
  EXPORT_DECLARATION = 'ExportDeclaration',

  // Class Members
  CLASS_BODY = 'ClassBody',
  PROPERTY_DEFINITION = 'PropertyDefinition',
  METHOD_DEFINITION = 'MethodDefinition',
  CONSTRUCTOR_DEFINITION = 'ConstructorDefinition',

  // Enum Members
  ENUM_MEMBER = 'EnumMember',

  // Statements
  BLOCK_STATEMENT = 'BlockStatement',
  RETURN_STATEMENT = 'ReturnStatement',
  EXPRESSION_STATEMENT = 'ExpressionStatement',
  TRY_STATEMENT = 'TryStatement',
  CATCH_CLAUSE = 'CatchClause',
  THROW_STATEMENT = 'ThrowStatement',
  SWITCH_STATEMENT = 'SwitchStatement',
  SWITCH_CASE = 'SwitchCase',
  FOR_STATEMENT = 'ForStatement',
  WHILE_STATEMENT = 'WhileStatement',
  DO_WHILE_STATEMENT = 'DoWhileStatement',
  BREAK_STATEMENT = 'BreakStatement',
  CONTINUE_STATEMENT = 'ContinueStatement',

  // Expressions
  IDENTIFIER = 'Identifier',
  LITERAL = 'Literal',
  CALL_EXPRESSION = 'CallExpression',
  ARROW_FUNCTION = 'ArrowFunction',
  BINARY_EXPRESSION = 'BinaryExpression',
  MEMBER_EXPRESSION = 'MemberExpression',
  AWAIT_EXPRESSION = 'AwaitExpression',
  ARRAY_PATTERN = 'ArrayPattern',
  OBJECT_PATTERN = 'ObjectPattern',

  // PSR-specific
  PSR_ELEMENT = 'PSRElement',
  PSR_FRAGMENT = 'PSRFragment',
  PSR_ATTRIBUTE = 'PSRAttribute',
  PSR_SPREAD_ATTRIBUTE = 'PSRSpreadAttribute',
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
 * const value: number = 42;
 * const { name, age } = user;
 */
export interface IVariableDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.VARIABLE_DECLARATION;
  readonly kind: 'const' | 'let';
  readonly declarations: Array<{
    id: IIdentifierNode | IArrayPatternNode | IObjectPatternNode;
    init: ICallExpressionNode | ILiteralNode | null;
    typeAnnotation?: ITypeAnnotationNode;
  }>;
}

/**
 * Function Declaration
 *
 * @example
 * function greet(name: string): string { return `Hello, ${name}`; }
 * async function fetchData(): Promise<Data> { ... }
 */
export interface IFunctionDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.FUNCTION_DECLARATION;
  readonly name: IIdentifierNode;
  readonly params: Array<{
    name: IIdentifierNode;
    typeAnnotation?: ITypeAnnotationNode;
  }>;
  readonly returnType?: ITypeAnnotationNode;
  readonly body: IBlockStatementNode;
  readonly async?: boolean;
  readonly generator?: boolean;
}

/**
 * Block Statement
 *
 * @example
 * { return true; }
 */
export interface IBlockStatementNode extends IASTNode {
  readonly type: ASTNodeType.BLOCK_STATEMENT;
  readonly body: IASTNode[];
}

/**
 * Import Declaration
 *
 * @example
 * import { createSignal } from '@pulsar/runtime';
 * import React from 'react';
 * import './styles.css';
 */
export interface IImportDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.IMPORT_DECLARATION;
  readonly specifiers: IIdentifierNode[];
  readonly source: ILiteralNode;
  readonly importKind?: 'named' | 'default' | 'side-effect' | 'namespace' | 'mixed'; // Added to distinguish import types
  readonly isTypeOnly?: boolean; // For: import type { Foo } from './types'
}

/**
 * Export Declaration
 *
 * @example
 * export { foo, bar };
 * export { foo as bar };
 * export const x = 1;
 * export default Component;
 * export * from './utils';
 * export { foo } from './utils';
 */
export interface IExportDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.EXPORT_DECLARATION;
  readonly declaration: IASTNode | null; // For: export const x = 1;
  readonly specifiers: IIdentifierNode[]; // For: export { foo, bar };
  readonly source: ILiteralNode | null; // For: export { foo } from './utils';
  readonly exportKind?: 'named' | 'default' | 'all'; // 'all' for export *
  readonly isTypeOnly?: boolean; // For: export type { Foo } from './types'
}

/**
 * Type Annotation
 *
 * @example
 * : number
 * : string
 * : Array<T>
 */
export interface ITypeAnnotationNode extends IASTNode {
  readonly type: ASTNodeType.TYPE_ANNOTATION;
  readonly typeString: string; // Raw type string for now
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
  readonly alias?: string; // For import/export aliases: import { foo as bar }
  readonly isTypeOnly?: boolean; // For type imports/exports: import { type Foo }
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
 * Object Pattern (destructuring)
 *
 * @example
 * { name, age }
 * { name: firstName, age: userAge }
 */
export interface IObjectPatternNode extends IASTNode {
  readonly type: ASTNodeType.OBJECT_PATTERN;
  readonly properties: Array<{
    key: IIdentifierNode;
    value: IIdentifierNode;
    shorthand: boolean; // true for { name }, false for { name: firstName }
  }>;
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
  readonly attributes: (IPSRAttributeNode | IPSRSpreadAttributeNode)[];
  readonly children: IASTNode[];
  readonly selfClosing: boolean;
}

/**
 * PSR Fragment
 *
 * @example
 * <>
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 * </>
 */
export interface IPSRFragmentNode extends IASTNode {
  readonly type: ASTNodeType.PSR_FRAGMENT;
  readonly children: IASTNode[];
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
 * PSR Spread Attribute
 *
 * @example
 * {...props}, {...otherProps}
 */
export interface IPSRSpreadAttributeNode extends IASTNode {
  readonly type: ASTNodeType.PSR_SPREAD_ATTRIBUTE;
  readonly argument: IIdentifierNode | IASTNode;
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

/**
 * Interface Declaration
 *
 * @example
 * interface IUser {
 *   name: string;
 *   age: number;
 * }
 *
 * interface IExtended extends IBase {
 *   extra: string;
 * }
 */
export interface IInterfaceDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.INTERFACE_DECLARATION;
  readonly name: IIdentifierNode;
  readonly extends?: IIdentifierNode[];
  readonly body: string; // Raw interface body as string for now
}

/**
 * Type Alias Declaration
 *
 * @example
 * type Status = 'idle' | 'loading' | 'success';
 * type Nullable<T> = T | null;
 */
export interface ITypeAliasNode extends IASTNode {
  readonly type: ASTNodeType.TYPE_ALIAS;
  readonly name: IIdentifierNode;
  readonly typeAnnotation: string; // Raw type definition as string
}

/**
 * Class Declaration
 *
 * @example
 * class User {
 *   name: string;
 *   constructor(name: string) {}
 * }
 *
 * abstract class Shape extends BaseShape<T> {
 *   abstract area(): number;
 * }
 */
export interface IClassDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.CLASS_DECLARATION;
  readonly name: IIdentifierNode;
  readonly superClass: IIdentifierNode | null;
  readonly typeParameters: string | null; // Generic parameters: <T, U>
  readonly body: IClassBodyNode;
  readonly abstract: boolean;
}

/**
 * Class Body
 *
 * Container for class members (properties, methods, constructor)
 */
export interface IClassBodyNode extends IASTNode {
  readonly type: ASTNodeType.CLASS_BODY;
  readonly members: Array<
    IPropertyDefinitionNode | IMethodDefinitionNode | IConstructorDefinitionNode
  >;
}

/**
 * Property Definition
 *
 * @example
 * public name: string;
 * private static count = 0;
 * protected readonly id: string;
 */
export interface IPropertyDefinitionNode extends IASTNode {
  readonly type: ASTNodeType.PROPERTY_DEFINITION;
  readonly name: IIdentifierNode;
  readonly typeAnnotation: ITypeAnnotationNode | null;
  readonly initializer: IASTNode | null; // Expression node
  readonly static: boolean;
  readonly readonly: boolean;
  readonly accessModifier: 'public' | 'private' | 'protected' | null;
}

/**
 * Method Definition
 *
 * @example
 * public greet(): string { return "Hello"; }
 * private static getInstance(): App { }
 * protected async fetchData(): Promise<Data> { }
 * public get name(): string { }
 * public set name(value: string) { }
 */
export interface IMethodDefinitionNode extends IASTNode {
  readonly type: ASTNodeType.METHOD_DEFINITION;
  readonly name: IIdentifierNode;
  readonly kind: 'method' | 'get' | 'set';
  readonly parameters: IParameterNode[];
  readonly returnType: ITypeAnnotationNode | null;
  readonly body: IBlockStatementNode;
  readonly static: boolean;
  readonly async: boolean;
  readonly generator: boolean;
  readonly abstract: boolean;
  readonly accessModifier: 'public' | 'private' | 'protected' | null;
}

/**
 * Constructor Definition
 *
 * @example
 * constructor(name: string, age: number) {
 *   this.name = name;
 *   this.age = age;
 * }
 */
export interface IConstructorDefinitionNode extends IASTNode {
  readonly type: ASTNodeType.CONSTRUCTOR_DEFINITION;
  readonly parameters: IParameterNode[];
  readonly body: IBlockStatementNode;
}
/**
 * Enum Declaration
 *
 * @example
 * enum Status {
 *   Active,
 *   Inactive,
 *   Pending = 3
 * }
 */
export interface IEnumDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.ENUM_DECLARATION;
  readonly name: IIdentifierNode;
  readonly members: IEnumMemberNode[];
  readonly isConst: boolean;
}

/**
 * Enum Member
 *
 * @example
 * Active
 * Inactive = 1
 * Pending = "pending"
 */
export interface IEnumMemberNode extends IASTNode {
  readonly type: ASTNodeType.ENUM_MEMBER;
  readonly name: IIdentifierNode;
  readonly initializer: IASTNode | null;
}

/**
 * Namespace Declaration
 *
 * @example
 * namespace Utils {
 *   export function helper() {}
 * }
 */
export interface INamespaceDeclarationNode extends IASTNode {
  readonly type: ASTNodeType.NAMESPACE_DECLARATION;
  readonly name: IIdentifierNode;
  readonly body: IASTNode[];
}

/**
 * Try Statement
 *
 * @example
 * try {
 *   riskyOperation();
 * } catch (error) {
 *   console.error(error);
 * } finally {
 *   cleanup();
 * }
 */
export interface ITryStatementNode extends IASTNode {
  readonly type: ASTNodeType.TRY_STATEMENT;
  readonly block: IBlockStatementNode;
  readonly handler: ICatchClauseNode | null;
  readonly finalizer: IBlockStatementNode | null;
}

/**
 * Catch Clause
 *
 * @example
 * catch (error) {
 *   console.error(error);
 * }
 */
export interface ICatchClauseNode extends IASTNode {
  readonly type: ASTNodeType.CATCH_CLAUSE;
  readonly param: IIdentifierNode | null;
  readonly body: IBlockStatementNode;
}

/**
 * Throw Statement
 *
 * @example
 * throw new Error("Something went wrong");
 */
export interface IThrowStatementNode extends IASTNode {
  readonly type: ASTNodeType.THROW_STATEMENT;
  readonly argument: IASTNode;
}

/**
 * Switch Statement
 *
 * @example
 * switch (value) {
 *   case 1: break;
 *   default: break;
 * }
 */
export interface ISwitchStatementNode extends IASTNode {
  readonly type: ASTNodeType.SWITCH_STATEMENT;
  readonly discriminant: IASTNode;
  readonly cases: ISwitchCaseNode[];
}

/**
 * Switch Case
 *
 * @example
 * case 1: return "one";
 * default: return "other";
 */
export interface ISwitchCaseNode extends IASTNode {
  readonly type: ASTNodeType.SWITCH_CASE;
  readonly test: IASTNode | null; // null for default case
  readonly consequent: IASTNode[];
}

/**
 * For Statement
 *
 * @example
 * for (let i = 0; i < 10; i++) { }
 */
export interface IForStatementNode extends IASTNode {
  readonly type: ASTNodeType.FOR_STATEMENT;
  readonly init: IASTNode | null;
  readonly test: IASTNode | null;
  readonly update: IASTNode | null;
  readonly body: IBlockStatementNode;
}

/**
 * While Statement
 *
 * @example
 * while (condition) { }
 */
export interface IWhileStatementNode extends IASTNode {
  readonly type: ASTNodeType.WHILE_STATEMENT;
  readonly test: IASTNode;
  readonly body: IBlockStatementNode;
}

/**
 * Do-While Statement
 *
 * @example
 * do { } while (condition);
 */
export interface IDoWhileStatementNode extends IASTNode {
  readonly type: ASTNodeType.DO_WHILE_STATEMENT;
  readonly body: IBlockStatementNode;
  readonly test: IASTNode;
}

/**
 * Break Statement
 *
 * @example
 * break;
 */
export interface IBreakStatementNode extends IASTNode {
  readonly type: ASTNodeType.BREAK_STATEMENT;
  readonly label: IIdentifierNode | null;
}

/**
 * Continue Statement
 *
 * @example
 * continue;
 */
export interface IContinueStatementNode extends IASTNode {
  readonly type: ASTNodeType.CONTINUE_STATEMENT;
  readonly label: IIdentifierNode | null;
}
