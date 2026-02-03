/**
 * Parser getErrors method
 * 
 * Returns all parsing errors.
 */

import type { IParserInternal, IParserError } from '../parser.types';

/**
 * Get all parser errors
 * 
 * @returns Array of parsing errors
 */
export function getErrors(this: IParserInternal): readonly IParserError[] {
  return this._errors;
}
