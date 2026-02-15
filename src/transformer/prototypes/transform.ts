/**
 * Transform - Main entry point for transformation with enterprise diagnostics
 */

import type { ITransformer } from '../transformer.js';
import type { ITransformResult } from '../transformer.types.js';

/**
 * Transform PSR AST to TypeScript AST with optional diagnostic tracking
 *
 * Algorithm:
 * 1. Initialize diagnostic tracking (if available)
 * 2. Collect used imports from original AST (with diagnostics if available)
 * 3. Transform program and all statements (with diagnostics if available)
 * 4. Add framework imports at top (with diagnostics if available)
 * 5. Finalize diagnostic session and return results (if available)
 */
export function transform(this: ITransformer): ITransformResult {
  // Check if diagnostic system is available
  const hasDiagnostics =
    this.stateTracker && this.diagnostics && this.edgeDetector && this.debugger && this.recovery;

  if (hasDiagnostics) {
    return transformWithDiagnostics.call(this);
  } else {
    return transformWithoutDiagnostics.call(this);
  }
}

/**
 * Transform with full diagnostic tracking
 */
function transformWithDiagnostics(this: ITransformer): ITransformResult {
  const session = this.stateTracker.getCurrentSession();
  if (!session) {
    throw new Error('No active transformation session found');
  }

  this.diagnostics.addDiagnostic({
    code: 'TRF001',
    type: 'info',
    severity: 'low',
    phase: 'program',
    message: `Starting transformation for ${this.context.sourceFile}`,
    node: this.ast,
  });

  try {
    // Step 1: Collect imports used in original AST (with diagnostics)
    this.stateTracker.recordStep({
      method: 'collectUsedImports',
      phase: 'import',
      nodeType: 'Program',
      startTime: performance.now(),
    });

    this.collectUsedImports(this.ast);

    this.stateTracker.completeCurrentStep({
      endTime: performance.now(),
      metadata: {
        collectedImports: Array.from(this.context.usedImports),
        importCount: this.context.usedImports.size,
      },
    });

    // Step 2: Transform the entire program (with diagnostics)
    const transformedAst = this.diagnosticTransform(
      this.ast,
      (node) => this.transformProgram(node),
      'program',
      'transformProgram'
    );

    // Step 3: Add framework imports at top (with diagnostics)
    this.stateTracker.recordStep({
      method: 'addFrameworkImports',
      phase: 'import',
      nodeType: 'Program',
      startTime: performance.now(),
    });

    try {
      this.addFrameworkImports(transformedAst);

      this.stateTracker.completeCurrentStep({
        endTime: performance.now(),
        metadata: {
          finalImportCount: transformedAst.body.filter((stmt) => stmt.type === 'ImportDeclaration')
            .length,
        },
      });
    } catch (importError) {
      this.diagnostics.addDiagnostic({
        code: 'TRF201',
        type: 'warning',
        severity: 'medium',
        phase: 'import',
        message: `Framework import injection failed: ${importError instanceof Error ? importError.message : String(importError)}`,
        node: transformedAst,
      });

      // Use recovery system
      this.recovery.recoverImportInjection(
        this,
        transformedAst,
        importError instanceof Error ? importError : new Error(String(importError))
      );

      this.stateTracker.completeCurrentStep({
        error: importError instanceof Error ? importError : new Error(String(importError)),
        endTime: performance.now(),
      });
    }

    // Step 4: Finalize session and generate comprehensive report
    const finalSession = this.stateTracker.endSession();

    this.diagnostics.addDiagnostic({
      code: 'TRF002',
      type: 'info',
      severity: 'low',
      phase: 'program',
      message: `Transformation completed successfully. Duration: ${finalSession.totalDuration}ms`,
      node: transformedAst,
    });

    // Log completion with all diagnostic data
    this.debugger.logTransformationComplete(
      finalSession.sessionId,
      {
        ast: transformedAst,
        context: this.context,
      },
      finalSession
    );

    // Step 5: Return comprehensive result with diagnostic data
    const result: ITransformResult = {
      ast: transformedAst,
      context: {
        ...this.context,
        // Add diagnostic information to context
        diagnostics: this.diagnostics.getAllDiagnostics(),
        session: finalSession,
        recoveryStats: this.recovery.getRecoveryStats(),
        edgeCases: this.edgeDetector.getDetectedEdgeCases(),
      },
    };

    return result;
  } catch (transformationError) {
    // Handle catastrophic transformation failure
    this.diagnostics.addDiagnostic({
      code: 'TRF505',
      type: 'error',
      severity: 'critical',
      phase: 'program',
      message: `Critical transformation failure: ${transformationError instanceof Error ? transformationError.message : String(transformationError)}`,
      node: this.ast,
    });

    const failedSession = this.stateTracker.endSession();

    throw new Error(
      `Transformation failed after ${failedSession.totalDuration}ms: ${transformationError instanceof Error ? transformationError.message : String(transformationError)}`
    );
  }
}

/**
 * Transform without diagnostics (fallback mode)
 */
function transformWithoutDiagnostics(this: ITransformer): ITransformResult {
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
