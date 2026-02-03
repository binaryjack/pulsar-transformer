/**
 * Parser factory function
 *
 * Creates a Parser instance for parsing PSR source code.
 */

import { Parser } from './parser';
import type { IParser, IParserConfig } from './parser.types';
import './prototype'; // Ensure prototype methods are attached

/**
 * Create a Parser instance
 *
 * @param config - Parser configuration
 * @returns Parser instance
 *
 * @example
 * const parser = createParser();
 * const ast = parser.parse('component MyButton() { return <button>Click</button>; }');
 */
export function createParser(config?: IParserConfig): IParser {
  return new Parser(config || {}) as unknown as IParser;
}
