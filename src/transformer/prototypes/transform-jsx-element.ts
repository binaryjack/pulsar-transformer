/**
 * Transform JSX Element - Pass through unchanged
 * CodeGenerator handles JSX → t_element() transformation
 */

import type { IJSXElement } from '../../ast.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * JSX elements pass through without transformation
 * CodeGenerator phase will handle JSX → t_element() conversion
 * We just track that t_element import is needed
 */
export function transformJSXElement(this: ITransformer, node: IJSXElement): IJSXElement {
  // Track import usage
  this.context.usedImports.add('t_element');

  // Pass through unchanged
  return node;
}

