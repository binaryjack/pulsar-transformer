/**
 * Add Error - Track transformation errors
 */

import type { IASTNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';
import type { ITransformError } from '../transformer.types.js';

/**
 * Add transformation error to context
 */
export function addError(this: ITransformer, type: string, message: string, node: IASTNode): void {
  const error: ITransformError = {
    type,
    message,
    node,
  };

  this.context.errors.push(error);
}
