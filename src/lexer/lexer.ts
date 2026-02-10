/**
 * Lexer - PSR source code tokenizer
 * Pattern: Prototype-based class following TypeScript compiler architecture
 */

import type { ILexer } from './lexer.types.js';

/**
 * Lexer constructor
 * Converts PSR source code into token stream
 */
export function Lexer(this: ILexer, source: string, filePath: string = '<input>'): void {
  this.source = source;
  this.filePath = filePath;
  this.pos = 0;
  this.line = 1;
  this.column = 1;
  this.tokens = [];
}

// Assign prototype methods (defined in separate files)
Object.assign(Lexer.prototype, {
  // Core scanning (implemented in separate files)
  scanTokens: undefined,
  scanToken: undefined,

  // Character navigation
  advance: undefined,
  peek: undefined,
  match: undefined,
  isAtEnd: undefined,

  // Token creation
  addToken: undefined,

  // Specific scanners
  scanIdentifier: undefined,
  scanString: undefined,
  scanNumber: undefined,
  scanComment: undefined,

  // Helpers
  isKeyword: undefined,
  skipWhitespace: undefined,
});

// Export type-safe constructor
export const createLexer = (source: string, filePath?: string): ILexer => {
  return new (Lexer as any)(source, filePath) as ILexer;
};
