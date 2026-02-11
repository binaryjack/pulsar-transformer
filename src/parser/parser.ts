/**
 * Parser - Converts token stream to AST
 * Pattern: Prototype-based class, recursive descent parsing
 */

import type { IToken } from '../lexer/lexer.types.js';
import type { IProgramNode } from './parser.types.js';

/**
 * Parser interface (prototype-based class)
 */
export interface IParser {
  new (tokens: IToken[], filePath?: string): IParser;

  // State
  tokens: IToken[];
  filePath: string;
  current: number;

  // Core methods
  parse(): IProgramNode;

  // Token navigation
  peek(offset?: number): IToken;
  advance(): IToken;
  match(...types: string[]): boolean;
  expect(type: string, message?: string): IToken;
  isAtEnd(): boolean;
  isKeywordToken(tokenType: string): boolean;

  // Parsing methods
  parseProgram(): IProgramNode;
  parseStatement(): any;
  parseImportDeclaration(): any;
  parseExportDeclaration(): any;
  parseInterfaceDeclaration(): any;
  parseComponentDeclaration(): any;
  parseFunctionDeclaration(): any;
  parseVariableDeclaration(): any;
  parseBlockStatement(): any;
  parseIfStatement(): any;
  parseReturnStatement(): any;
  parseExpression(precedence?: number): any;
  parseJSXElement(): any;
  parsePrimaryExpression(): any;
  parseCallExpression(callee: any): any;
  parseArrowFunction(params: any[]): any;
  parseArrayExpression(): any;
  parseObjectExpression(): any;
  parseJSXOpeningElement(): any;
  parseJSXClosingElement(tagName: string): any;
  parseJSXExpressionContainer(): any;

  // Type parsing
  parseTypeAnnotation(): any;
  parseUnionType(): any;
  parsePrimaryType(): any;
}

/**
 * Parser constructor
 */
export function Parser(this: IParser, tokens: IToken[], filePath: string = '<input>'): void {
  this.tokens = tokens;
  this.filePath = filePath;
  this.current = 0;
}

// Assign prototype methods
Object.assign(Parser.prototype, {
  // Core methods
  parse: undefined,

  // Token navigation
  peek: undefined,
  advance: undefined,
  match: undefined,
  expect: undefined,
  isAtEnd: undefined,
  isKeywordToken: undefined,

  // Parsing methods
  parseProgram: undefined,
  parseStatement: undefined,
  parseImportDeclaration: undefined,
  parseExportDeclaration: undefined,
  parseInterfaceDeclaration: undefined,
  parseComponentDeclaration: undefined,
  parseFunctionDeclaration: undefined,
  parseVariableDeclaration: undefined,
  parseBlockStatement: undefined,
  parseIfStatement: undefined,
  parseReturnStatement: undefined,
  parseExpression: undefined,
  parseJSXElement: undefined,
});

// Export type-safe constructor
export const createParser = (tokens: IToken[], filePath?: string): IParser => {
  return new (Parser as any)(tokens, filePath) as IParser;
};
