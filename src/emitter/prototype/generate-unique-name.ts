/**
 * Generate Unique Name Helper Method
 *
 * Generates unique variable names.
 */

import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Generate unique variable name
 */
export function _generateUniqueName(this: IEmitterInternal, base: string): string {
  let counter = 0;
  let name = base + counter;

  while (this.context.usedNames.has(name)) {
    counter++;
    name = base + counter;
  }

  this.context.usedNames.add(name);
  return name;
}
