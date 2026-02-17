/**
 * Error reporting
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';
import type { ISemanticError, SemanticErrorType } from '../semantic-analyzer.types.js';

/**
 * Add semantic error
 */
export function addError(
  this: ISemanticAnalyzer,
  type: SemanticErrorType,
  message: string,
  node: any
): void {
  const error: ISemanticError = {
    type,
    message,
    node,
    line: node.line,
    column: node.column,
  };

  this.errors.push(error);
}

/**
 * Add semantic warning
 */
export function addWarning(
  this: ISemanticAnalyzer,
  type: SemanticErrorType,
  message: string,
  node: any
): void {
  const warning: ISemanticError = {
    type,
    message,
    node,
    line: node.line,
    column: node.column,
  };

  this.warnings.push(warning);
}

