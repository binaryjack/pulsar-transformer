/**
 * Diagnostic Null-Object Stubs
 *
 * Typed no-op implementations of all five diagnostic subsystems.
 * Used when the diagnostic system fails to initialise so that
 * `diagnosticTransform` always receives real objects instead of
 * `null as any`, honouring ZERO_ANY_STRICT_UNIONS.
 *
 * Every stub satisfies the exact interface contract while
 * performing no side-effects and incurring zero overhead.
 */

import type { IASTNode } from '../ast.types.js';
import type { ITransformerDebugInfo } from './debug-tools.js';
import type { ITransformerDiagnostic } from './diagnostics.js';
import type { ITransformerEdgeCase } from './edge-cases.js';
import type { ITransformationSession } from './state-tracker.js';
import type { ITransformer } from './transformer.js';
import type { IRecoveryAction, RecoveryStrategy } from './warning-recovery.js';

// ---------------------------------------------------------------------------
// Diagnostics stub
// ---------------------------------------------------------------------------

export interface IDiagnosticsStub {
  readonly isStub: true;
  diagnostics: ITransformerDiagnostic[];
  context: { sourceFile: string; phase: string };
  addError(..._args: unknown[]): void;
  addWarning(..._args: unknown[]): void;
  addInfo(..._args: unknown[]): void;
  addDiagnostic(_d: ITransformerDiagnostic): void;
  getDiagnostics(): ITransformerDiagnostic[];
  getAllDiagnostics(): ITransformerDiagnostic[];
  getLastDiagnostic(): undefined;
  getDiagnosticsByType(_t: string): ITransformerDiagnostic[];
  getDiagnosticsByPhase(_p: string): ITransformerDiagnostic[];
  hasErrors(): false;
  getSummary(): { total: 0; errors: 0; warnings: 0; info: 0; byPhase: Record<string, number> };
  clear(): void;
  getSeverity(_code: string): ITransformerDiagnostic['severity'];
  getPhase(_code: string): ITransformerDiagnostic['phase'];
  extractLocation(_node: unknown): undefined;
}

export const createDiagnosticsStub = (): IDiagnosticsStub => ({
  isStub: true,
  diagnostics: [],
  context: { sourceFile: 'unknown', phase: 'unknown' },
  addError: () => undefined,
  addWarning: () => undefined,
  addInfo: () => undefined,
  addDiagnostic: () => undefined,
  getDiagnostics: () => [],
  getAllDiagnostics: () => [],
  getLastDiagnostic: () => undefined,
  getDiagnosticsByType: () => [],
  getDiagnosticsByPhase: () => [],
  hasErrors: () => false,
  getSummary: () => ({ total: 0, errors: 0, warnings: 0, info: 0, byPhase: {} }),
  clear: () => undefined,
  getSeverity: () => 'low',
  getPhase: () => 'statement',
  extractLocation: () => undefined,
});

// ---------------------------------------------------------------------------
// StateTracker stub
// ---------------------------------------------------------------------------

export interface IStateTrackerStub {
  readonly isStub: true;
  sessions: Map<string, ITransformationSession>;
  activeSession: ITransformationSession;
  stepCounter: 0;
  startSession(_src: string, _opts?: unknown): string;
  endSession(): null;
  startStep(..._args: unknown[]): void;
  completeStep(..._args: unknown[]): void;
  failStep(..._args: unknown[]): void;
  updateMetadata(_u: unknown): void;
  getCurrentSession(): ITransformationSession;
  recordStep(_opts: unknown): void;
  completeCurrentStep(_opts: unknown): void;
  getSession(_id: string): null;
  getSessionStats(_id?: string): null;
  clearSessions(): void;
  endCurrentStep(..._args: unknown[]): void;
}

const STUB_SESSION: ITransformationSession = {
  sessionId: 'stub-session',
  sourceFile: 'unknown',
  startTime: 0,
  phases: new Map(),
  metadata: {
    totalNodes: 0,
    transformedNodes: 0,
    componentCount: 0,
    jsxElementCount: 0,
    importCount: 0,
    errorCount: 0,
    warningCount: 0,
  },
};

export const createStateTrackerStub = (): IStateTrackerStub => ({
  isStub: true,
  sessions: new Map(),
  activeSession: STUB_SESSION,
  stepCounter: 0,
  startSession: () => 'stub-session',
  endSession: () => null,
  startStep: () => undefined,
  completeStep: () => undefined,
  failStep: () => undefined,
  updateMetadata: () => undefined,
  getCurrentSession: () => STUB_SESSION,
  recordStep: () => undefined,
  completeCurrentStep: () => undefined,
  getSession: () => null,
  getSessionStats: () => null,
  clearSessions: () => undefined,
  endCurrentStep: () => undefined,
});

// ---------------------------------------------------------------------------
// EdgeCaseDetector stub
// ---------------------------------------------------------------------------

export interface IEdgeCaseDetectorStub {
  readonly isStub: true;
  detectedCases: Set<string>;
  checkNode(_node: unknown): string[];
  detectEdgeCase(_node: unknown, _phase: string): null;
  getDetectedCases(): ITransformerEdgeCase[];
  getDetectedEdgeCases(): ITransformerEdgeCase[];
  isKnownUnsupported(_input: string, _nodeType?: string): false;
  getWorkaround(_id: string): undefined;
  clear(): void;
}

export const createEdgeCaseDetectorStub = (): IEdgeCaseDetectorStub => ({
  isStub: true,
  detectedCases: new Set(),
  checkNode: () => [],
  detectEdgeCase: () => null,
  getDetectedCases: () => [],
  getDetectedEdgeCases: () => [],
  isKnownUnsupported: () => false,
  getWorkaround: () => undefined,
  clear: () => undefined,
});

// ---------------------------------------------------------------------------
// Debugger stub
// ---------------------------------------------------------------------------

export interface IDebuggerStub {
  readonly isStub: true;
  config: { enabled: false };
  debugLog: ITransformerDebugInfo[];
  activeBreakpoints: Set<string>;
  stepMode: false;
  logTransformationStep(..._args: unknown[]): void;
  logTransformationComplete(..._args: unknown[]): void;
  dumpAST(_node: IASTNode, _title?: string): void;
  compareAST(_orig: IASTNode, _transformed: IASTNode, _op: string): void;
  addBreakpoint(_id: string): void;
  removeBreakpoint(_id: string): void;
  enableStepMode(): void;
  disableStepMode(): void;
  getDebugStats(): null;
  clearDebugLog(): void;
  exportDebugData(_id?: string): void;
}

export const createDebuggerStub = (): IDebuggerStub => ({
  isStub: true,
  config: { enabled: false },
  debugLog: [],
  activeBreakpoints: new Set(),
  stepMode: false,
  logTransformationStep: () => undefined,
  logTransformationComplete: () => undefined,
  dumpAST: () => undefined,
  compareAST: () => undefined,
  addBreakpoint: () => undefined,
  removeBreakpoint: () => undefined,
  enableStepMode: () => undefined,
  disableStepMode: () => undefined,
  getDebugStats: () => null,
  clearDebugLog: () => undefined,
  exportDebugData: () => undefined,
});

// ---------------------------------------------------------------------------
// RecoveryController stub  — pass-through: returns original node unchanged
// ---------------------------------------------------------------------------

export interface IRecoveryControllerStub {
  readonly isStub: true;
  config: { enabled: false; maxRecoveryAttempts: 0 };
  recoveryActions: IRecoveryAction[];
  recoveryAttempts: Map<string, number>;
  attemptRecovery(
    _transformer: ITransformer,
    node: IASTNode,
    _error: Error,
    _method: string
  ): IASTNode;
  recoverComponentTransformation(
    _transformer: ITransformer,
    node: IASTNode,
    _error: Error
  ): IASTNode;
  recoverJSXTransformation(_transformer: ITransformer, node: IASTNode, _error: Error): IASTNode;
  recoverImportInjection(..._args: unknown[]): void;
  getRecoveryStats(): null;
  clearRecoveryHistory(): void;
  determineRecoveryStrategy(_node: IASTNode, _error: Error, _method: string): RecoveryStrategy;
  calculateSuccessRate(): 100;
}

export const createRecoveryControllerStub = (): IRecoveryControllerStub => ({
  isStub: true,
  config: { enabled: false, maxRecoveryAttempts: 0 },
  recoveryActions: [],
  recoveryAttempts: new Map(),
  attemptRecovery: (_transformer, node) => node,
  recoverComponentTransformation: (_transformer, node) => node,
  recoverJSXTransformation: (_transformer, node) => node,
  recoverImportInjection: () => undefined,
  getRecoveryStats: () => null,
  clearRecoveryHistory: () => undefined,
  determineRecoveryStrategy: () => 'PASS_THROUGH',
  calculateSuccessRate: () => 100,
});

// ---------------------------------------------------------------------------
// Bundled factory — creates all five stubs in one call
// ---------------------------------------------------------------------------

export interface IDiagnosticStubs {
  diagnostics: IDiagnosticsStub;
  stateTracker: IStateTrackerStub;
  edgeDetector: IEdgeCaseDetectorStub;
  debugger: IDebuggerStub;
  recovery: IRecoveryControllerStub;
}

export const createDiagnosticStubs = (): IDiagnosticStubs => ({
  diagnostics: createDiagnosticsStub(),
  stateTracker: createStateTrackerStub(),
  edgeDetector: createEdgeCaseDetectorStub(),
  debugger: createDebuggerStub(),
  recovery: createRecoveryControllerStub(),
});
