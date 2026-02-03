/**
 * Parser hasErrors method
 *
 * Checks if parser encountered any errors.
 */

import type { IParserInternal } from '../parser.types';

/**
 * Check if parser has errors
 *
 * @returns True if errors exist
 */
export function hasErrors(this: IParserInternal): boolean {
  return this._errors.length > 0;
}
