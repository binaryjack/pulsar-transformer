/**
 * Transformer Type Definitions
 * Context, results, and error types for AST transformation with enterprise diagnostics
 */

import type { IASTNode, IProgramNode } from '../ast.types.js';
import type { ITransformerDiagnostic } from './diagnostics.js';
import type { ITransformationSession } from './state-tracker.js';
import type { ITransformerEdgeCase } from './edge-cases.js';

/**
 * Transform context - shared state during transformation with diagnostic data
 */
export interface ITransformContext {
  sourceFile: string;
  usedImports: Set<string>;
  errors: ITransformError[];

  // Enterprise diagnostic extensions
  diagnostics?: ITransformerDiagnostic[];
  session?: ITransformationSession;
  recoveryStats?: {
    totalRecoveries: number;
    byStrategy: Record<string, number>;
    byNodeType: Record<string, number>;
    successRate: number;
  };
  edgeCases?: ITransformerEdgeCase[];
}

/**
 * Transform error (enhanced with diagnostic integration)
 */
export interface ITransformError {
  type: string;
  message: string;
  node: IASTNode;

  // Enhanced error tracking
  diagnosticCode?: string;
  timestamp?: number;
  recoverable?: boolean;
  phase?: string;
}

/**
 * Transform result (enhanced with comprehensive diagnostic data)
 */
export interface ITransformResult {
  ast: IProgramNode;
  context: ITransformContext;

  // Optional performance and quality metrics
  metrics?: {
    transformationDuration: number;
    nodeCount: {
      original: number;
      transformed: number;
    };
    diagnosticSummary: {
      errors: number;
      warnings: number;
      info: number;
    };
    qualityScore?: number; // 0-100 based on diagnostic severity
  };
}

