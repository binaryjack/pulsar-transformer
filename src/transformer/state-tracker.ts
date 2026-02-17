/**
 * Transformer State Tracker - Tracks transformation state and progress
 * Similar to lexer state tracker but for AST transformation phases
 * Converted to prototype-based pattern
 */

export type TransformationPhase =
  | 'INITIALIZATION'
  | 'COMPONENT_ANALYSIS'
  | 'COMPONENT_TRANSFORM'
  | 'JSX_TRANSFORM'
  | 'IMPORT_COLLECTION'
  | 'IMPORT_INJECTION'
  | 'FINALIZATION';

export interface ITransformationStep {
  id: string;
  phase: TransformationPhase;
  nodeType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  inputData?: any;
  outputData?: any;
  metadata?: Record<string, any>;
}

export interface ITransformationSession {
  sessionId: string;
  sourceFile: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  phases: Map<TransformationPhase, ITransformationStep[]>;
  currentStep?: ITransformationStep;
  metadata: {
    totalNodes: number;
    transformedNodes: number;
    componentCount: number;
    jsxElementCount: number;
    importCount: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Transformation state tracker with detailed progress monitoring (prototype-based)
 */
export const TransformationStateTracker = function (this: TransformationStateTracker) {
  // Define private sessions property
  Object.defineProperty(this, 'sessions', {
    value: new Map<string, ITransformationSession>(),
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Define private activeSession property
  Object.defineProperty(this, 'activeSession', {
    value: null,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Define private stepCounter property
  Object.defineProperty(this, 'stepCounter', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as any as { new (): TransformationStateTracker };

// Type alias for TransformationStateTracker instance
interface TransformationStateTracker {
  sessions: Map<string, ITransformationSession>;
  activeSession: ITransformationSession | null;
  stepCounter: number;
  startSession(sourceFile: string, options?: { astNodeCount?: number; timestamp?: number }): string;
  endSession(): ITransformationSession | null;
  startStep(
    stepId: string,
    description: string,
    phase: TransformationPhase,
    nodeType: string,
    inputData?: any
  ): void;
  completeStep(stepId: string, outputData?: any, metadata?: Record<string, any>): void;
  failStep(stepId: string, error?: string): void;
  updateMetadata(updates: Partial<ITransformationSession['metadata']>): void;
  getCurrentSession(): ITransformationSession | null;
  recordStep(options: {
    stepId: string;
    phase: TransformationPhase;
    nodeType: string;
    description: string;
    inputData?: any;
  }): void;
  completeCurrentStep(options: {
    success?: boolean;
    error?: Error;
    endTime?: number;
    outputData?: any;
    metadata?: Record<string, any>;
  }): void;
  getSession(sessionId: string): ITransformationSession | null;
  getSessionStats(sessionId?: string): any;
  clearSessions(): void;
  endCurrentStep(success: boolean, outputData?: any, metadata?: Record<string, any>): void;
}

// Attach prototype methods
TransformationStateTracker.prototype.startSession = function (
  this: TransformationStateTracker,
  sourceFile: string,
  options?: { astNodeCount?: number; timestamp?: number }
): string {
  const sessionId = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const session: ITransformationSession = {
    sessionId,
    sourceFile,
    startTime: performance.now(),
    phases: new Map(),
    metadata: {
      totalNodes: options?.astNodeCount || 0,
      transformedNodes: 0,
      componentCount: 0,
      jsxElementCount: 0,
      importCount: 0,
      errorCount: 0,
      warningCount: 0,
    },
  };

  this.sessions.set(sessionId, session);
  this.activeSession = session;

  console.log(`[TRANSFORMER-TRACKER] Session started: ${sessionId} for ${sourceFile}`);
  return sessionId;
};

TransformationStateTracker.prototype.endSession = function (
  this: TransformationStateTracker
): ITransformationSession | null {
  if (!this.activeSession) return null;

  const endTime = performance.now();
  this.activeSession.endTime = endTime;
  this.activeSession.totalDuration = endTime - this.activeSession.startTime;

  // End current step if any
  if (this.activeSession.currentStep) {
    this.endCurrentStep(true);
  }

  console.log(
    `[TRANSFORMER-TRACKER] Session ended: ${this.activeSession.sessionId} (${this.activeSession.totalDuration?.toFixed(2)}ms)`
  );

  const session = this.activeSession;
  this.activeSession = null;
  return session;
};

TransformationStateTracker.prototype.startStep = function (
  this: TransformationStateTracker,
  stepId: string,
  description: string,
  phase: TransformationPhase,
  nodeType: string,
  inputData?: any
): void {
  if (!this.activeSession) return;

  // End previous step if any
  if (this.activeSession.currentStep) {
    this.endCurrentStep(true);
  }

  const step: ITransformationStep = {
    id: stepId || `step_${++(this as any).stepCounter}`,
    phase,
    nodeType,
    startTime: performance.now(),
    inputData,
    metadata: {
      description,
      index: (this as any).stepCounter,
    },
  };

  this.activeSession.currentStep = step;

  // Add to phase tracking
  if (!this.activeSession.phases.has(phase)) {
    this.activeSession.phases.set(phase, []);
  }
  this.activeSession.phases.get(phase)!.push(step);

  console.log(`[TRANSFORMER-STEP] ${description} (${nodeType})`);
};

TransformationStateTracker.prototype.completeStep = function (
  this: TransformationStateTracker,
  stepId: string,
  outputData?: any,
  metadata?: Record<string, any>
): void {
  if (!this.activeSession?.currentStep) return;
  if (this.activeSession.currentStep.id !== stepId) {
    console.warn(
      `[TRANSFORMER-TRACKER] Step ID mismatch: expected ${stepId}, got ${this.activeSession.currentStep.id}`
    );
  }

  this.endCurrentStep(true, outputData, metadata);
};

TransformationStateTracker.prototype.failStep = function (
  this: TransformationStateTracker,
  stepId: string,
  error?: string
): void {
  if (!this.activeSession?.currentStep) return;
  if (this.activeSession.currentStep.id !== stepId) {
    console.warn(
      `[TRANSFORMER-TRACKER] Step ID mismatch: expected ${stepId}, got ${this.activeSession.currentStep.id}`
    );
  }

  this.endCurrentStep(false, undefined, { error });
  this.activeSession.metadata.errorCount++;
};

TransformationStateTracker.prototype.updateMetadata = function (
  this: TransformationStateTracker,
  updates: Partial<ITransformationSession['metadata']>
): void {
  if (!this.activeSession) return;

  Object.assign(this.activeSession.metadata, updates);
};

TransformationStateTracker.prototype.getCurrentSession = function (
  this: TransformationStateTracker
): ITransformationSession | null {
  return this.activeSession;
};

TransformationStateTracker.prototype.recordStep = function (
  this: TransformationStateTracker,
  options: {
    stepId: string;
    phase: TransformationPhase;
    nodeType: string;
    description: string;
    inputData?: any;
  }
): void {
  this.startStep(
    options.stepId,
    options.description,
    options.phase,
    options.nodeType,
    options.inputData
  );
};

TransformationStateTracker.prototype.completeCurrentStep = function (
  this: TransformationStateTracker,
  options: {
    success?: boolean;
    error?: Error;
    endTime?: number;
    outputData?: any;
    metadata?: Record<string, any>;
  }
): void {
  if (!this.activeSession?.currentStep) return;

  const stepId = this.activeSession.currentStep.id;
  if (options.error || options.success === false) {
    this.failStep(stepId, options.error?.message);
  } else {
    this.completeStep(stepId, options.outputData, options.metadata);
  }
};

TransformationStateTracker.prototype.getSession = function (
  this: TransformationStateTracker,
  sessionId: string
): ITransformationSession | null {
  return this.sessions.get(sessionId) || null;
};

TransformationStateTracker.prototype.getSessionStats = function (
  this: TransformationStateTracker,
  sessionId?: string
): any {
  const session = sessionId ? this.getSession(sessionId) : this.activeSession;
  if (!session) return null;

  const phaseStats = Array.from(session.phases.entries()).map(([phase, steps]) => ({
    phase,
    stepCount: steps.length,
    totalDuration: steps.reduce((sum, step) => sum + (step.duration || 0), 0),
    successRate: (steps.filter((step) => step.success).length / steps.length) * 100,
    averageDuration: steps.reduce((sum, step) => sum + (step.duration || 0), 0) / steps.length,
  }));

  return {
    sessionId: session.sessionId,
    sourceFile: session.sourceFile,
    totalDuration: session.totalDuration,
    metadata: session.metadata,
    phaseStats,
    totalSteps: Array.from(session.phases.values()).flat().length,
  };
};

TransformationStateTracker.prototype.clearSessions = function (
  this: TransformationStateTracker
): void {
  this.sessions.clear();
  this.activeSession = null;
  (this as any).stepCounter = 0;
};

TransformationStateTracker.prototype.endCurrentStep = function (
  this: TransformationStateTracker,
  success: boolean,
  outputData?: any,
  metadata?: Record<string, any>
): void {
  if (!this.activeSession?.currentStep) return;

  const step = this.activeSession.currentStep;
  step.endTime = performance.now();
  step.duration = step.endTime - step.startTime;
  step.success = success;
  step.outputData = outputData;

  if (metadata) {
    step.metadata = { ...step.metadata, ...metadata };
  }

  console.log(
    `[TRANSFORMER-STEP] ${success ? 'COMPLETED' : 'FAILED'} ${step.metadata?.description} (${step.duration.toFixed(2)}ms)`
  );

  if (success) {
    this.activeSession.metadata.transformedNodes++;
  }

  this.activeSession.currentStep = undefined;
};

/**
 * Global transformation state tracker instance
 */
let globalTransformationTracker: TransformationStateTracker | null = null;

export function getTransformationTracker(): TransformationStateTracker {
  if (!globalTransformationTracker) {
    globalTransformationTracker = new (TransformationStateTracker as any)();
  }
  return globalTransformationTracker!;
}

export function clearTransformationTracker(): void {
  globalTransformationTracker = null;
}
