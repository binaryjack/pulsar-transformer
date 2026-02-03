/**
 * Lexer getPosition method
 *
 * Get current lexer position.
 */

import type { ILexerInternal, ILexerPosition } from '../lexer.types';

/**
 * Get current position in source
 *
 * @returns Current lexer position
 */
export function getPosition(this: ILexerInternal): ILexerPosition {
  return {
    position: this._position,
    line: this._line,
    column: this._column,
  };
}
