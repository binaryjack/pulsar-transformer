/**
 * Unified Transformation Session Tracker
 * Integrates tracer events with transformation tracker for end-to-end visibility
 */

import type { ITransformationTracker } from '../typescript-transformer/transformation-tracker.types.js';
import { getTracerManager } from './tracer/core/tracer-manager.js';
import type { TraceEvent } from './tracer/types/trace-event.types.js';

/**
 * Session-level tracking for complete pipeline transformations
 */
export interface ITransformationSession {
  sessionId: string;
  filePath: string;
  startTime: number;
  endTime?: number;
  phases: {
    lexer: IPhaseResult;
    parser: IPhaseResult;
    transformer?: IPhaseResult;
    codegen: IPhaseResult;
  };
  transformationTracker?: ITransformationTracker;
  traceEvents: TraceEvent[];
  metrics: ISessionMetrics;
  errors: ISessionError[];
}

export interface IPhaseResult {
  phase: 'lexer' | 'parser' | 'transformer' | 'codegen';
  startTime: number;
  endTime?: number;
  success: boolean;
  inputSize: number;
  outputSize?: number;
  errors: string[];
  functionCalls: number;
}

export interface ISessionMetrics {
  totalDuration: number;
  totalFunctionCalls: number;
  totalErrors: number;
  phaseBreakdown: Record<string, number>;
  criticalPath: string[];
}

export interface ISessionError {
  phase: string;
  functionName: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
}

/**
 * Unified session tracker (singleton per transformation)
 */
export interface IUnifiedTracker {
  currentSession?: ITransformationSession;
  startSession(filePath: string, inputSize: number): string;
  startPhase(phase: 'lexer' | 'parser' | 'transformer' | 'codegen', inputSize: number): void;
  endPhase(
    phase: 'lexer' | 'parser' | 'transformer' | 'codegen',
    outputSize: number,
    success: boolean
  ): void;
  recordError(phase: string, functionName: string, error: Error): void;
  attachTransformationTracker(tracker: ITransformationTracker): void;
  endSession(): ITransformationSession;
  getReport(): string;
}

/**
 * Unified Tracker constructor (prototype-based)
 */
export const UnifiedTracker: IUnifiedTracker = function (this: IUnifiedTracker) {
  this.currentSession = undefined;
} as any;

/**
 * Start a new transformation session
 */
(UnifiedTracker as any).prototype.startSession = function (
  this: IUnifiedTracker,
  filePath: string,
  inputSize: number
): string {
  const sessionId = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  this.currentSession = {
    sessionId,
    filePath,
    startTime: performance.now(),
    phases: {
      lexer: {
        phase: 'lexer',
        startTime: 0,
        success: false,
        inputSize,
        errors: [],
        functionCalls: 0,
      },
      parser: {
        phase: 'parser',
        startTime: 0,
        success: false,
        inputSize: 0,
        errors: [],
        functionCalls: 0,
      },
      codegen: {
        phase: 'codegen',
        startTime: 0,
        success: false,
        inputSize: 0,
        errors: [],
        functionCalls: 0,
      },
    },
    traceEvents: [],
    metrics: {
      totalDuration: 0,
      totalFunctionCalls: 0,
      totalErrors: 0,
      phaseBreakdown: {},
      criticalPath: [],
    },
    errors: [],
  };

  // Subscribe to tracer events for this session
  const tracer = getTracerManager();
  const unsubscribe = tracer.subscribeAll((event: TraceEvent) => {
    if (this.currentSession) {
      this.currentSession.traceEvents.push(event);

      // Count function calls per phase
      if (event.type === 'function.start') {
        const phase =
          this.currentSession.phases[event.channel as keyof typeof this.currentSession.phases];
        if (phase) {
          phase.functionCalls++;
        }
      }
    }
  });

  // Store unsubscribe function for cleanup
  (this.currentSession as any)._unsubscribe = unsubscribe;

  console.log(`[UNIFIED-TRACKER] Session started: ${sessionId} for ${filePath}`);
  return sessionId;
};

/**
 * Start tracking a pipeline phase
 */
(UnifiedTracker as any).prototype.startPhase = function (
  this: IUnifiedTracker,
  phase: 'lexer' | 'parser' | 'transformer' | 'codegen',
  inputSize: number
): void {
  if (!this.currentSession) {
    console.warn('[UNIFIED-TRACKER] No active session for phase:', phase);
    return;
  }

  const phaseResult = this.currentSession.phases[phase];
  if (phaseResult) {
    phaseResult.startTime = performance.now();
    phaseResult.inputSize = inputSize;
    console.log(`[UNIFIED-TRACKER] Phase started: ${phase} (input: ${inputSize})`);
  }

  // Add transformer phase if needed
  if (phase === 'transformer' && !this.currentSession.phases.transformer) {
    this.currentSession.phases.transformer = {
      phase: 'transformer',
      startTime: performance.now(),
      success: false,
      inputSize,
      errors: [],
      functionCalls: 0,
    };
  }
};

/**
 * End tracking a pipeline phase
 */
(UnifiedTracker as any).prototype.endPhase = function (
  this: IUnifiedTracker,
  phase: 'lexer' | 'parser' | 'transformer' | 'codegen',
  outputSize: number,
  success: boolean
): void {
  if (!this.currentSession) {
    console.warn('[UNIFIED-TRACKER] No active session for phase end:', phase);
    return;
  }

  const phaseResult = this.currentSession.phases[phase];
  if (phaseResult && phaseResult.startTime > 0) {
    phaseResult.endTime = performance.now();
    phaseResult.outputSize = outputSize;
    phaseResult.success = success;

    const duration = phaseResult.endTime - phaseResult.startTime;
    this.currentSession.metrics.phaseBreakdown[phase] = duration;

    console.log(
      `[UNIFIED-TRACKER] Phase ended: ${phase} (${duration.toFixed(2)}ms, output: ${outputSize}, success: ${success})`
    );
  }
};

/**
 * Record an error during transformation
 */
(UnifiedTracker as any).prototype.recordError = function (
  this: IUnifiedTracker,
  phase: string,
  functionName: string,
  error: Error
): void {
  if (!this.currentSession) {
    console.warn('[UNIFIED-TRACKER] No active session for error:', error.message);
    return;
  }

  const sessionError: ISessionError = {
    phase,
    functionName,
    message: error.message,
    timestamp: performance.now(),
    recoverable: !error.message.includes('FATAL') && !error.message.includes('Critical'),
  };

  this.currentSession.errors.push(sessionError);
  this.currentSession.metrics.totalErrors++;

  // Add to phase errors if phase exists
  const phaseResult = this.currentSession.phases[phase as keyof typeof this.currentSession.phases];
  if (phaseResult) {
    phaseResult.errors.push(error.message);
  }

  console.error(`[UNIFIED-TRACKER] Error in ${phase}:${functionName}:`, error.message);
};

/**
 * Attach transformation tracker to session
 */
(UnifiedTracker as any).prototype.attachTransformationTracker = function (
  this: IUnifiedTracker,
  tracker: ITransformationTracker
): void {
  if (!this.currentSession) {
    console.warn('[UNIFIED-TRACKER] No active session for tracker attachment');
    return;
  }

  this.currentSession.transformationTracker = tracker;
  console.log('[UNIFIED-TRACKER] Transformation tracker attached');
};

/**
 * End the current transformation session
 */
(UnifiedTracker as any).prototype.endSession = function (
  this: IUnifiedTracker
): ITransformationSession {
  if (!this.currentSession) {
    throw new Error('No active transformation session to end');
  }

  this.currentSession.endTime = performance.now();
  this.currentSession.metrics.totalDuration =
    this.currentSession.endTime - this.currentSession.startTime;

  // Calculate total function calls
  this.currentSession.metrics.totalFunctionCalls = Object.values(this.currentSession.phases).reduce(
    (total, phase) => total + (phase?.functionCalls || 0),
    0
  );

  // Cleanup tracer subscription
  if ((this.currentSession as any)._unsubscribe) {
    (this.currentSession as any)._unsubscribe();
  }

  const session = this.currentSession;
  this.currentSession = undefined;

  console.log(
    `[UNIFIED-TRACKER] Session ended: ${session.sessionId} (${session.metrics.totalDuration.toFixed(2)}ms)`
  );
  return session;
};

/**
 * Generate comprehensive report
 */
(UnifiedTracker as any).prototype.getReport = function (this: IUnifiedTracker): string {
  if (!this.currentSession) {
    return 'No active transformation session';
  }

  const { sessionId, filePath, metrics, phases, errors, transformationTracker } =
    this.currentSession;

  const report = [
    `🔍 TRANSFORMATION SESSION REPORT`,
    `═══════════════════════════════════════`,
    `Session ID: ${sessionId}`,
    `File: ${filePath}`,
    `Duration: ${metrics.totalDuration.toFixed(2)}ms`,
    `Function Calls: ${metrics.totalFunctionCalls}`,
    `Errors: ${metrics.totalErrors}`,
    ``,
    `📊 PHASE BREAKDOWN:`,
    ...Object.entries(phases).map(([name, phase]) => {
      const duration = metrics.phaseBreakdown[name] || 0;
      const status = phase?.success ? '✅' : phase?.endTime ? '❌' : '⏳';
      return `  ${status} ${name.padEnd(12)}: ${duration.toFixed(2)}ms (${phase?.functionCalls || 0} calls)`;
    }),
    ``,
    `🚨 ERRORS (${errors.length}):`,
    ...errors.slice(0, 5).map((err) => `  ❌ ${err.phase}:${err.functionName}: ${err.message}`),
    ...(errors.length > 5 ? [`  ... ${errors.length - 5} more errors`] : []),
  ];

  if (transformationTracker?.steps?.size) {
    report.push(
      ``,
      `🔄 TRANSFORMATION STEPS (${transformationTracker.steps.size}):`,
      ...Array.from(transformationTracker.steps.values())
        .slice(0, 3)
        .map(
          (step) =>
            `  ${step.status === 'COMPLETED' ? '✅' : step.status === 'FAILED' ? '❌' : '⏳'} ${step.name} (${step.phase})`
        ),
      ...(transformationTracker.steps.size > 3
        ? [`  ... ${transformationTracker.steps.size - 3} more steps`]
        : [])
    );
  }

  return report.join('\n');
};

/**
 * Global singleton instance
 */
let globalUnifiedTracker: IUnifiedTracker | null = null;

/**
 * Get or create global unified tracker
 */
export function getUnifiedTracker(): IUnifiedTracker {
  if (!globalUnifiedTracker) {
    globalUnifiedTracker = new (UnifiedTracker as any)();
  }
  return globalUnifiedTracker!;
}

/**
 * Create unified tracker instance
 */
export function createUnifiedTracker(): IUnifiedTracker {
  return new (UnifiedTracker as any)();
}

