/**
 * Create Lexer Factory
 * 
 * Factory function to create lexer instances.
 */

import { Lexer } from './lexer';
import type { ILexer, ILexerConfig } from './lexer.types';
import './prototype'; // Ensure prototype methods are attached

/**
 * Create a new PSR lexer
 * 
 * @param config - Optional lexer configuration
 * @returns Lexer instance
 * 
 * @example
 * ```typescript
 * const lexer = createLexer();
 * const tokens = lexer.tokenize('component MyButton() { return <button>Click</button>; }');
 * ```
 */
export function createLexer(config?: ILexerConfig): ILexer {
  return new Lexer(config) as unknown as ILexer;
}
