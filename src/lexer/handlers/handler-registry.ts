/**
 * Token Handler Registry
 * Maps characters to their handler functions (TypeScript compiler pattern)
 * 
 * This replaces the monolithic 400-line switch statement with
 * separate, testable handler functions.
 */

import type { ILexer } from '../lexer.types.js';

export type TokenHandler = (lexer: ILexer, char: string) => void;

/**
 * Registry of token handlers by first character
 */
export const tokenHandlers = new Map<string, TokenHandler>();

/**
 * Register a handler for a specific character
 */
export function registerHandler(char: string, handler: TokenHandler): void {
  tokenHandlers.set(char, handler);
}

/**
 * Get handler for a character
 */
export function getHandler(char: string): TokenHandler | undefined {
  return tokenHandlers.get(char);
}
