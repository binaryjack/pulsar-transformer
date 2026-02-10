/**
 * Transform - Main entry point for transformation
 */

import type { ITransformer } from '../transformer.js';
import type { ITransformResult } from '../transformer.types.js';

/**
 * Transform PSR AST to TypeScript AST
 *
 * Algorithm:
 * 1. Collect used imports from original AST
 * 2. Transform program and all statements
 * 3. Add framework imports at top
 * 4. Return transformed AST with context
 */
export function transform(this: ITransformer): ITransformResult {
  // Step 1: Collect imports used in original AST
  this.collectUsedImports(this.ast);

  // Step 2: Transform the entire program
  const transformedAst = this.transformProgram(this.ast);

  // Step 3: Add framework imports at top
  this.addFrameworkImports(transformedAst);

  // Step 4: Return result
  return {
    ast: transformedAst,
    context: this.context,
  };
}
