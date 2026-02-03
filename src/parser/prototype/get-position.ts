/**
 * Parser getPosition method
 *
 * Returns current parsing position information.
 */

import type { INodeLocation } from '../ast';
import type { IParserInternal } from '../parser.types';

/**
 * Get current parser position
 *
 * @returns Current location information
 */
export function getPosition(this: IParserInternal): INodeLocation {
  const token = this._getCurrentToken();

  if (!token) {
    return {
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 0, offset: 0 },
    };
  }

  return {
    start: {
      line: token.line,
      column: token.column,
      offset: token.start,
    },
    end: {
      line: token.line,
      column: token.column + token.value.length,
      offset: token.end,
    },
  };
}
