/**
 * Transformer - Transforms PSR AST to TypeScript AST
 * Pattern: Prototype-based class with Visitor pattern
 */

import type {
  IASTNode,
  IBlockStatement,
  ICallExpression,
  IComponentDeclaration,
  IExpression,
  IFunctionDeclaration,
  IInterfaceDeclaration,
  IJSXElement,
  IProgramNode,
  IStatementNode,
  IVariableDeclaration,
} from '../parser/parser.types.js';
import type { ITransformContext, ITransformResult } from './transformer.types.js';

/**
 * Transformer interface (prototype-based class)
 */
export interface ITransformer {
  new (ast: IProgramNode, options?: Partial<ITransformContext>): ITransformer;

  // State
  ast: IProgramNode;
  context: ITransformContext;

  // Main API
  transform(): ITransformResult;

  // Visitor methods (one per node type)
  transformProgram(node: IProgramNode): IProgramNode;
  transformStatement(node: IStatementNode): IStatementNode;
  transformComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration;
  transformInterfaceDeclaration(node: IInterfaceDeclaration): IInterfaceDeclaration;
  transformVariableDeclaration(node: IVariableDeclaration): IVariableDeclaration;
  transformFunctionDeclaration(node: IFunctionDeclaration): IFunctionDeclaration;
  transformExportNamedDeclaration(node: any): any;
  transformExpression(node: IExpression): IExpression;
  transformJSXElement(node: IJSXElement): IJSXElement;
  transformCallExpression(node: ICallExpression): ICallExpression;
  transformBlockStatement(node: IBlockStatement): IBlockStatement;

  // Import management
  addFrameworkImports(program: IProgramNode): void;
  collectUsedImports(node: IASTNode): void;

  // Utilities
  addError(type: string, message: string, node: IASTNode): void;
}

/**
 * Transformer constructor
 */
export const Transformer: ITransformer = function (
  this: ITransformer,
  ast: IProgramNode,
  options: Partial<ITransformContext> = {}
) {
  this.ast = ast;
  this.context = {
    sourceFile: options.sourceFile || 'unknown',
    usedImports: options.usedImports || new Set(),
    errors: options.errors || [],
  };
} as any;

/**
 * Export prototype for registration
 */
export const TransformerPrototype = Transformer.prototype;
