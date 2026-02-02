/**
 * add-return-type.types.ts
 * Type definitions for auto-return-type utility
 *
 * @see docs/architecture/transformation-issues/agents/auto-return-type-agent.md
 * @see .github/00-CRITICAL-RULES.md - One item per file rule
 */

import * as ts from 'typescript';

/**
 * Result of return type analysis
 */
export interface IReturnTypeAnalysis {
  /** Whether the node already has a return type */
  hasReturnType: boolean;

  /** The existing return type text, if any */
  existingType?: string;

  /** Whether the existing type is correct for a component */
  isCorrectType: boolean;

  /** Warning message if type is incorrect */
  warning?: string;
}

/**
 * Configuration for adding return types
 */
export interface IAddReturnTypeConfig {
  /** Target return type to add (default: 'HTMLElement') */
  targetType?: string;

  /** Whether to add comment flag for auto-typed functions */
  addCommentFlag?: boolean;

  /** Whether to emit warnings for incorrect types */
  emitWarnings?: boolean;

  /** Whether to error on async functions */
  errorOnAsync?: boolean;
}

/**
 * Result of adding return type
 */
export interface IAddReturnTypeResult {
  /** The updated node (or original if no changes) */
  node: ts.Node;

  /** Whether the node was modified */
  modified: boolean;

  /** Warning message, if any */
  warning?: string;

  /** Error message, if any */
  error?: string;

  /** Whether a comment flag was added */
  hasCommentFlag: boolean;
}
