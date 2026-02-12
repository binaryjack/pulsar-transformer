/**
 * Code Generator - Transforms PSR AST to TypeScript code
 * Combines transformation and emission into single phase
 */

import type { IProgramNode } from '../parser/parser.types.js';

/**
 * Code generation options
 */
export interface ICodeGeneratorOptions {
  filePath?: string;
  sourceMap?: boolean;
  indent?: string;
}

/**
 * Generated code result
 */
export interface IGeneratedCode {
  code: string;
  imports: Set<string>;
}

/**
 * Code Generator interface (prototype-based class)
 */
export interface ICodeGenerator {
  new (ast: IProgramNode, options?: ICodeGeneratorOptions): ICodeGenerator;

  // State
  ast: IProgramNode;
  options: ICodeGeneratorOptions;
  imports: Set<string>;
  indentLevel: number;

  // Core methods
  generate(): string;

  // Generation methods
  generateProgram(): string;
  generateImports(): string;
  generateStatement(node: any): string;
  generateExpression(node: any): string;
  generateJSXElement(node: any): string;
  generateCallExpression(node: any): string;
  generateArrowFunction(node: any): string;
  generateObjectExpression(node: any): string;
  generateTemplateLiteral(node: any): string;
  generateInterface(node: any): string;
  generateComponent(node: any): string;
  generateFunction(node: any): string;
  generateVariableDeclaration(node: any): string;
  generateBlockStatement(node: any): string;
  generateTypeAnnotation(typeNode: any): string;

  // Helpers
  indent(): string;
  addImport(name: string): void;
  needsRegistryWrap(node: any): boolean;
  isReactiveExpression(node: any): boolean;
}

/**
 * Code Generator constructor
 */
export function CodeGenerator(
  this: ICodeGenerator,
  ast: IProgramNode,
  options: ICodeGeneratorOptions = {}
): void {
  this.ast = ast;
  this.options = {
    indent: '  ',
    sourceMap: false,
    ...options,
  };
  this.imports = new Set();
  this.indentLevel = 0;
}

// Assign prototype methods
Object.assign(CodeGenerator.prototype, {
  generate: undefined,
  generateProgram: undefined,
  generateImports: undefined,
  generateStatement: undefined,
  generateExpression: undefined,
  generateJSXElement: undefined,
  indent: undefined,
  addImport: undefined,
  needsRegistryWrap: undefined,
});

// Export type-safe constructor
export const createCodeGenerator = (
  ast: IProgramNode,
  options?: ICodeGeneratorOptions
): ICodeGenerator => {
  return new (CodeGenerator as any)(ast, options) as ICodeGenerator;
};
