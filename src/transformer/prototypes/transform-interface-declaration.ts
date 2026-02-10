/**
 * Transform Interface Declaration - Pass through unchanged
 * TypeScript handles interface declarations natively
 */

import type { IInterfaceDeclaration } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Interface declarations pass through without transformation
 * TypeScript compiler handles these natively
 */
export function transformInterfaceDeclaration(
  this: ITransformer,
  node: IInterfaceDeclaration
): IInterfaceDeclaration {
  return node;
}
