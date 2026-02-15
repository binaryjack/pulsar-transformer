/**
 * Code Generator Diagnostic Methods - Enterprise diagnostic integration
 * Prototype methods for diagnostic reporting and error recovery
 */

import type { ICodeGenerator } from '../code-generator.js';
import { DiagnosticCode, DiagnosticSeverity, CodeGeneratorDiagnostic } from '../diagnostics.js';
import { IRecoveryContext } from '../warning-recovery.js';

/**
 * Report a diagnostic issue
 */
export function reportDiagnostic(this: ICodeGenerator, diagnostic: CodeGeneratorDiagnostic): void {
  this.diagnostics.add(diagnostic);

  // Update state tracker position
  this.stateTracker.updatePosition(diagnostic.line, diagnostic.column);

  // Enable verbose logging for errors
  if (diagnostic.severity === DiagnosticSeverity.Error && this.debugTools.isVerboseLogging()) {
    console.error(`[CG-ERROR] ${diagnostic.code}: ${diagnostic.message}`);
    if (diagnostic.suggestion) {
      console.error(`  Suggestion: ${diagnostic.suggestion}`);
    }
  }
}

/**
 * Check edge cases for a node and report any issues
 */
export function checkEdgeCases(this: ICodeGenerator, node: any): void {
  if (!node) return;

  this.stateTracker.enterNode(node);

  const edgeCases = this.edgeCases.getAllEdgeCases(node);

  edgeCases.forEach((edgeCase) => {
    if (edgeCase.detected) {
      const diagnostic: CodeGeneratorDiagnostic = {
        severity: edgeCase.severity,
        code: edgeCase.code,
        message: edgeCase.message,
        line: this.stateTracker.getState().lineNumber,
        column: this.stateTracker.getState().columnNumber,
        length: 0,
        phase: this.stateTracker.getState().phase,
        suggestion: edgeCase.suggestion,
        node: edgeCase.node,
      };

      this.reportDiagnostic(diagnostic);
    }
  });

  this.stateTracker.exitNode();
}

/**
 * Attempt to recover from a generation error
 */
export function attemptRecovery(this: ICodeGenerator, error: Error, node: any): string | null {
  const context: IRecoveryContext = {
    node,
    generationState: this.stateTracker.getState(),
    originalError: error,
    attemptNumber: 1,
    maxRetries: 3,
    previousOutput: '',
    diagnostics: this.diagnostics.getAll(),
  };

  const recoveryResult = this.warningRecovery.attemptRecovery(error, context);

  if (recoveryResult.success) {
    // Report recovery warnings
    recoveryResult.warningsGenerated.forEach((warning) => {
      this.reportDiagnostic(warning);
    });

    // Capture debug snapshot of recovery
    if (this.debugTools.isVerboseLogging()) {
      this.debugTools.captureSnapshot(node, this.stateTracker.getState(), recoveryResult.output);
      console.log(
        `[CG-RECOVERY] Strategy '${recoveryResult.strategyApplied}' ${recoveryResult.fallbackUsed ? '(fallback)' : 'succeeded'}`
      );
    }

    return recoveryResult.output;
  }

  // Recovery failed - report final error
  this.reportDiagnostic({
    severity: DiagnosticSeverity.Error,
    code: DiagnosticCode.ComponentGenerationFailed,
    message: `Generation failed and recovery unsuccessful: ${error.message}`,
    line: this.stateTracker.getState().lineNumber,
    column: this.stateTracker.getState().columnNumber,
    length: 0,
    phase: this.stateTracker.getState().phase,
    node,
  });

  return null;
}

/**
 * Get diagnostic summary report
 */
export function getDiagnosticSummary(this: ICodeGenerator): string {
  const summary = this.diagnostics.summarize();
  const performanceReport = this.stateTracker.getPerformanceReport();
  const recoveryStats = this.warningRecovery.getRecoveryStatistics();

  const perfIssues = this.stateTracker.checkPerformanceThresholds();

  const report = [
    '=== Code Generator Diagnostic Summary ===',
    summary,
    '',
    '--- Performance Metrics ---',
    performanceReport,
    '',
  ];

  if (perfIssues.length > 0) {
    report.push('--- Performance Issues ---');
    perfIssues.forEach((issue) => {
      report.push(`${issue.code}: ${issue.message}`);
    });
    report.push('');
  }

  if (recoveryStats.totalRecoveryAttempts > 0) {
    report.push('--- Recovery Statistics ---');
    report.push(`Total Recovery Attempts: ${recoveryStats.totalRecoveryAttempts}`);
    report.push(`Successful Recoveries: ${recoveryStats.successfulRecoveries}`);
    report.push(`Failed Recoveries: ${recoveryStats.failedRecoveries}`);
    report.push(`Fallbacks Generated: ${recoveryStats.fallbacksGenerated}`);
    report.push('');
  }

  const criticalIssues = this.diagnostics.getBySeverity(DiagnosticSeverity.Error);
  if (criticalIssues.length > 0) {
    report.push('--- Critical Issues ---');
    criticalIssues.slice(0, 5).forEach((issue) => {
      report.push(`[${issue.code}] Line ${issue.line}: ${issue.message}`);
      if (issue.suggestion) {
        report.push(`  → ${issue.suggestion}`);
      }
    });
  }

  return report.join('\n');
}

/**
 * Check if there are any error-level diagnostics
 */
export function hasErrors(this: ICodeGenerator): boolean {
  return this.diagnostics.hasErrors();
}

/**
 * Check if there are any warning-level diagnostics
 */
export function hasWarnings(this: ICodeGenerator): boolean {
  return this.diagnostics.hasWarnings();
}

/**
 * Enhanced generate method with diagnostic integration
 */
export function generate(this: ICodeGenerator): string {
  try {
    this.stateTracker.setPhase('program');

    // Generate code with diagnostic monitoring
    const result = this.generateProgram();

    // Check for performance issues
    const perfIssues = this.stateTracker.checkPerformanceThresholds();
    perfIssues.forEach((issue) => {
      this.diagnostics.addWarning(issue.code, issue.message, issue.line, issue.column);
    });

    // Finalize generation
    this.stateTracker.finishGeneration();

    // Log summary if verbose
    if (this.debugTools.isVerboseLogging()) {
      console.log(this.getDiagnosticSummary());
    }

    return result;
  } catch (error) {
    // Attempt recovery from generation failure
    const recoveredOutput = this.attemptRecovery(error as Error, this.ast);

    if (recoveredOutput) {
      return recoveredOutput;
    }

    // Recovery failed - create diagnostic report and re-throw
    const debugReport = this.debugTools.generateDebugReport(this.diagnostics.getAll(), []);

    console.error('Code generation failed:');
    console.error(debugReport);

    throw error;
  }
}

// Helper method to safely generate with edge case checking
export function safeGenerate(
  this: ICodeGenerator,
  node: any,
  generatorMethod: (node: any) => string
): string {
  try {
    // Check edge cases before generation
    this.checkEdgeCases(node);

    // Proceed with generation if no critical edge cases
    if (!this.diagnostics.getBySeverity(DiagnosticSeverity.Error).length) {
      return generatorMethod.call(this, node);
    }

    // Critical edge cases detected - attempt recovery
    const fakeError = new Error('Critical edge cases detected');
    const recoveredOutput = this.attemptRecovery(fakeError, node);

    return recoveredOutput || '/* Generation failed */';
  } catch (error) {
    return this.attemptRecovery(error as Error, node) || '/* Generation failed */';
  }
}

// Export diagnostic utilities for internal use
export const CodeGeneratorDiagnosticUtils = {
  /**
   * Create diagnostic for interface generation issue
   */
  createInterfaceDiagnostic(
    message: string,
    node: any,
    code: DiagnosticCode = DiagnosticCode.InterfaceGenerationFailed
  ): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Error,
      code,
      message,
      line: node?.loc?.start?.line || 1,
      column: node?.loc?.start?.column || 1,
      length: 0,
      phase: 'interface',
      node,
    };
  },

  /**
   * Create diagnostic for component generation issue
   */
  createComponentDiagnostic(
    message: string,
    node: any,
    code: DiagnosticCode = DiagnosticCode.ComponentGenerationFailed
  ): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Error,
      code,
      message,
      line: node?.loc?.start?.line || 1,
      column: node?.loc?.start?.column || 1,
      length: 0,
      phase: 'component',
      node,
    };
  },

  /**
   * Create diagnostic for JSX generation issue
   */
  createJSXDiagnostic(
    message: string,
    node: any,
    code: DiagnosticCode = DiagnosticCode.JSXElementGenerationFailed
  ): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Error,
      code,
      message,
      line: node?.loc?.start?.line || 1,
      column: node?.loc?.start?.column || 1,
      length: 0,
      phase: 'jsx',
      node,
    };
  },
};
