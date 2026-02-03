/**
 * Analyzer Context Methods
 *
 * Get context, check errors, retrieve errors.
 */

import type { IAnalyzerContext, IAnalyzerError, IAnalyzerInternal } from '../analyzer.types';

/**
 * Get analyzer context
 */
export function getContext(this: IAnalyzerInternal): IAnalyzerContext {
  return this._context;
}

/**
 * Check if analyzer has errors
 */
export function hasErrors(this: IAnalyzerInternal): boolean {
  return this._errors.length > 0;
}

/**
 * Get all analyzer errors
 */
export function getErrors(this: IAnalyzerInternal): readonly IAnalyzerError[] {
  return this._errors;
}
