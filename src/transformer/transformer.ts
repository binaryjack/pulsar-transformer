/**
 * Transformer - Transforms PSR AST to TypeScript AST
 * Pattern: Prototype-based class with Visitor pattern
 * Now with enterprise-grade diagnostic system
 */

import type {
  IASTNode,
  IBlockStatement,
  ICallExpression,
  IComponentDeclaration,
  IExpression,
  IFunctionDeclaration,
  IInterfaceDeclaration,
  IJSXElement,
  IProgramNode,
  IStatementNode,
  IVariableDeclaration,
} from '../ast.types.js';
import type { ITransformContext, ITransformResult } from './transformer.types.js';

// Enterprise diagnostic system imports
import { getTransformerDiagnostics } from './diagnostics.js';
import { getTransformationTracker } from './state-tracker.js';
import { getTransformerEdgeCaseDetector } from './edge-cases.js';
import { getTransformerDebugger } from './debug-tools.js';
import { getTransformerRecoveryController } from './warning-recovery.js';

/**
 * Transformer interface (prototype-based class with enterprise diagnostics)
 */
export interface ITransformer {
  new (ast: IProgramNode, options?: Partial<ITransformContext>): ITransformer;

  // State
  ast: IProgramNode;
  context: ITransformContext;

  // Diagnostic system components
  diagnostics: ReturnType<typeof getTransformerDiagnostics>;
  stateTracker: ReturnType<typeof getTransformationTracker>;
  edgeDetector: ReturnType<typeof getTransformerEdgeCaseDetector>;
  debugger: ReturnType<typeof getTransformerDebugger>;
  recovery: ReturnType<typeof getTransformerRecoveryController>;

  // Main API
  transform(): ITransformResult;

  // Visitor methods (one per node type)
  transformProgram(node: IProgramNode): IProgramNode;
  transformStatement(node: IStatementNode): IStatementNode;
  transformComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration;
  transformInterfaceDeclaration(node: IInterfaceDeclaration): IInterfaceDeclaration;
  transformVariableDeclaration(node: IVariableDeclaration): IVariableDeclaration;
  transformFunctionDeclaration(node: IFunctionDeclaration): IFunctionDeclaration;
  transformExportNamedDeclaration(node: any): any;
  transformExpression(node: IExpression): IExpression;
  transformJSXElement(node: IJSXElement): IJSXElement;
  transformCallExpression(node: ICallExpression): ICallExpression;
  transformBlockStatement(node: IBlockStatement): IBlockStatement;

  // Import management
  addFrameworkImports(program: IProgramNode): void;
  collectUsedImports(node: IASTNode): void;

  // Utilities with diagnostics
  addError(type: string, message: string, node: IASTNode): void;
  countASTNodes(node: any): number;

  // Diagnostic utilities
  diagnosticTransform<TIn extends IASTNode, TOut extends IASTNode = TIn>(
    node: TIn,
    transformFn: (node: TIn) => TOut,
    phase: string,
    method: string
  ): TOut;
}

/**
 * Transformer constructor with optional enterprise diagnostics
 */
export const Transformer: ITransformer = function (
  this: ITransformer,
  ast: IProgramNode,
  options: Partial<ITransformContext> = {}
) {
  // Initialize core state
  this.ast = ast;
  this.context = {
    sourceFile: options.sourceFile || 'unknown',
    usedImports: options.usedImports || new Set(),
    errors: options.errors || [],
  };

  // Initialize enterprise diagnostic systems (with fallback for compatibility)
  try {
    this.diagnostics = getTransformerDiagnostics();
    this.stateTracker = getTransformationTracker();
    this.edgeDetector = getTransformerEdgeCaseDetector();
    this.debugger = getTransformerDebugger();
    this.recovery = getTransformerRecoveryController();

    // Start transformation session if diagnostics available
    this.stateTracker.startSession(this.context.sourceFile, {
      astNodeCount: this.countASTNodes(ast),
      timestamp: Date.now(),
    });
  } catch (error) {
    // Fallback mode - create minimal diagnostic stubs for backward compatibility
    console.log('[TRANSFORMER] Diagnostic system not available, using fallback mode');
    this.diagnostics = null as any;
    this.stateTracker = null as any;
    this.edgeDetector = null as any;
    this.debugger = null as any;
    this.recovery = null as any;
  }
} as any;

// Add diagnostic helper methods to prototype
Transformer.prototype.countASTNodes = function (node: any): number {
  if (!node || typeof node !== 'object') return 0;
  let count = 1; // Count current node

  // Recursively count child nodes
  for (const key in node) {
    if (node.hasOwnProperty(key) && node[key]) {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          count += this.countASTNodes(child);
        }
      } else if (typeof node[key] === 'object') {
        count += this.countASTNodes(node[key]);
      }
    }
  }
  return count;
};

Transformer.prototype.diagnosticTransform = function <
  TIn extends IASTNode,
  TOut extends IASTNode = TIn,
>(
  this: ITransformer,
  node: TIn,
  transformFn: (node: TIn) => TOut,
  phase: string,
  method: string
): TOut {
  // If diagnostic systems not available, fall back to simple transformation
  if (
    !this.stateTracker ||
    !this.diagnostics ||
    !this.edgeDetector ||
    !this.debugger ||
    !this.recovery
  ) {
    try {
      return transformFn(node);
    } catch (error) {
      // Simple error handling without diagnostics
      console.error(`[TRANSFORMER-FALLBACK] ${method} failed:`, error);
      throw error;
    }
  }

  const session = this.stateTracker.getCurrentSession();
  if (!session) {
    throw new Error('No active transformation session');
  }

  // Check for known edge cases
  const edgeCase = this.edgeDetector.detectEdgeCase(node, phase);
  if (edgeCase && edgeCase.severity === 'critical') {
    this.diagnostics.addDiagnostic({
      code: (edgeCase.code || edgeCase.id) as any,
      type: 'error',
      severity: 'critical',
      phase: phase as any,
      message: `Critical edge case detected: ${edgeCase.description}`,
      node,
    });
    return this.recovery.attemptRecovery(
      this,
      node,
      new Error(edgeCase.description),
      method
    ) as TOut;
  }

  // Log transformation step start
  this.debugger.logTransformationStep(
    session.sessionId,
    phase,
    node.type,
    node,
    undefined,
    edgeCase && this.diagnostics.getLastDiagnostic() ? [this.diagnostics.getLastDiagnostic()!] : []
  );

  try {
    // Record step start
    this.stateTracker.recordStep({
      stepId: `${phase}_${method}_${Date.now()}`,
      phase: phase as any,
      nodeType: node.type,
      description: `${method} on ${node.type}`,
      inputData: node,
    });

    // Apply transformation
    const result = transformFn(node);

    // Record step completion
    this.stateTracker.completeCurrentStep({
      success: true,
      outputData: result,
      endTime: performance.now(),
    });

    // Log successful transformation
    this.debugger.logTransformationStep(session.sessionId, phase, node.type, node, result);

    return result;
  } catch (error) {
    // Handle transformation error with recovery
    const errorDiag = {
      code: `TRF${Math.floor(Math.random() * 900) + 100}` as any,
      type: 'error' as const,
      severity: 'high' as const,
      phase: phase as any,
      message: `Transformation failed in ${method}: ${error instanceof Error ? error.message : String(error)}`,
      node,
    };

    this.diagnostics.addDiagnostic(errorDiag);

    // Record step failure
    this.stateTracker.completeCurrentStep({
      error: error instanceof Error ? error : new Error(String(error)),
      endTime: performance.now(),
    });

    // Attempt recovery
    return this.recovery.attemptRecovery(
      this,
      node,
      error instanceof Error ? error : new Error(String(error)),
      method
    ) as TOut;
  }
};

/**
 * Export prototype for registration
 */
export const TransformerPrototype = Transformer.prototype;


