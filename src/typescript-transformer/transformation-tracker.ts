/**
 * Transformation Tracker Implementation - Prototype-based class
 * Pattern: Detailed step tracking with metrics and reporting
 */

import type {
  IPhaseMetrics,
  ITransformationContext,
  ITransformationError,
  ITransformationMetrics,
  ITransformationStep,
  ITransformationTracker,
} from './transformation-tracker.types.js';
import { StepStatusEnum, TransformationPhaseEnum } from './transformation-tracker.types.js';

/**
 * TransformationTracker constructor (prototype-based)
 */
export const TransformationTracker: ITransformationTracker = function (
  this: ITransformationTracker,
  filePath: string,
  sourceText: string
) {
  this.filePath = filePath;
  this.sourceText = sourceText;
  this.steps = new Map<string, ITransformationStep>();
  this.errors = [];
  this.imports = new Set<string>();
  this.components = new Set<string>();
  this.startTime = performance.now();
} as any;

/**
 * Start transformation step
 */
function startStep(
  this: ITransformationTracker,
  id: string,
  name: string,
  phase: TransformationPhaseEnum,
  inputNode: string,
  metadata: Record<string, unknown> = {}
): void {
  const step: ITransformationStep = {
    id,
    name,
    phase,
    startTime: performance.now(),
    inputNode,
    status: StepStatusEnum.IN_PROGRESS,
    metadata: { ...metadata },
  };

  this.steps!.set(id, step);
}

/**
 * Complete transformation step
 */
function completeStep(
  this: ITransformationTracker,
  id: string,
  outputNode: string,
  metadata: Record<string, unknown> = {}
): void {
  const step = this.steps!.get(id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }

  const updatedStep: ITransformationStep = {
    ...step,
    endTime: performance.now(),
    outputNode,
    status: StepStatusEnum.COMPLETED,
    metadata: { ...step.metadata, ...metadata },
  };

  this.steps!.set(id, updatedStep);
}

/**
 * Fail transformation step
 */
function failStep(this: ITransformationTracker, id: string, error: string): void {
  const step = this.steps!.get(id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }

  const updatedStep: ITransformationStep = {
    ...step,
    endTime: performance.now(),
    status: StepStatusEnum.FAILED,
    error,
  };

  this.steps!.set(id, updatedStep);

  this.addError(id, step.phase, error, false);
}

/**
 * Skip transformation step
 */
function skipStep(this: ITransformationTracker, id: string, reason: string): void {
  const step = this.steps!.get(id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }

  const updatedStep: ITransformationStep = {
    ...step,
    endTime: performance.now(),
    status: StepStatusEnum.SKIPPED,
    metadata: { ...step.metadata, skipReason: reason },
  };

  this.steps!!.set(id, updatedStep);
}

/**
 * Add import tracking
 */
function addImport(this: ITransformationTracker, importName: string): void {
  this.imports!.add(importName);
}

/**
 * Add component tracking
 */
function addComponent(this: ITransformationTracker, componentName: string): void {
  this.components!.add(componentName);
}

/**
 * Add error
 */
function addError(
  this: ITransformationTracker,
  stepId: string,
  phase: TransformationPhaseEnum,
  message: string,
  recoverable: boolean = true
): void {
  const error: ITransformationError = {
    stepId,
    phase,
    message,
    recoverable,
  };

  this.errors!.push(error);
}

/**
 * Get transformation metrics
 */
function getMetrics(this: ITransformationTracker): ITransformationMetrics {
  const steps = Array.from(this.steps!.values());
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === 'COMPLETED').length;
  const failedSteps = steps.filter((s) => s.status === 'FAILED').length;

  const totalDuration = performance.now() - this.startTime!;

  // Calculate phase metrics
  const phaseMetrics = new Map<TransformationPhaseEnum, IPhaseMetrics>();
  const phaseGroups = new Map<TransformationPhaseEnum, ITransformationStep[]>();

  for (const step of steps) {
    if (!phaseGroups.has(step.phase)) {
      phaseGroups.set(step.phase, []);
    }
    phaseGroups.get(step.phase)!.push(step);
  }

  for (const [phase, phaseSteps] of phaseGroups) {
    const completed = phaseSteps.filter((s) => s.status === 'COMPLETED');
    const duration = phaseSteps
      .filter((s) => s.endTime)
      .reduce((sum, s) => sum + (s.endTime! - s.startTime), 0);

    phaseMetrics.set(phase, {
      steps: phaseSteps.length,
      duration,
      successRate: completed.length / phaseSteps.length,
      avgStepDuration: duration / phaseSteps.length,
    });
  }

  return {
    totalSteps,
    completedSteps,
    failedSteps,
    totalDuration,
    phaseMetrics,
  };
}

/**
 * Generate detailed report
 */
function generateDetailedReport(this: ITransformationTracker): string {
  const metrics = this.getMetrics();
  const steps = Array.from(this.steps!.values());

  let report = `\n=== TRANSFORMATION DETAILED REPORT ===\n`;
  report += `File: ${this.filePath}\n`;
  report += `Total Duration: ${metrics.totalDuration.toFixed(2)}ms\n`;
  report += `Steps: ${metrics.completedSteps}/${metrics.totalSteps} completed (${metrics.failedSteps} failed)\n`;
  report += `Imports: [${Array.from(this.imports!).join(', ')}]\n`;
  report += `Components: [${Array.from(this.components!).join(', ')}]\n\n`;

  // Phase summaries
  for (const [phase, phaseMetric] of metrics.phaseMetrics) {
    report += `--- ${phase} ---\n`;
    report += `  Steps: ${phaseMetric.steps} | Duration: ${phaseMetric.duration.toFixed(2)}ms | Success Rate: ${(phaseMetric.successRate * 100).toFixed(1)}%\n`;
  }

  report += `\n--- STEP DETAILS ---\n`;
  for (const step of steps) {
    const duration = step.endTime ? (step.endTime - step.startTime).toFixed(2) + 'ms' : 'ongoing';
    report += `[${step.status}] ${step.name} (${duration})\n`;
    report += `  Input: ${step.inputNode} | Output: ${step.outputNode || 'pending'}\n`;
    if (step.error) {
      report += `  ERROR: ${step.error}\n`;
    }
  }

  if (this.errors!.length > 0) {
    report += `\n--- ERRORS ---\n`;
    for (const error of this.errors!) {
      report += `[${error.phase}] ${error.message} (Step: ${error.stepId})\n`;
    }
  }

  return report;
}

/**
 * Generate summary report
 */
function generateSummaryReport(this: ITransformationTracker): string {
  const metrics = this.getMetrics();
  const successRate = ((metrics.completedSteps / metrics.totalSteps) * 100).toFixed(1);

  return `TRANSFORMATION SUMMARY: ${metrics.completedSteps}/${metrics.totalSteps} (${successRate}%) in ${metrics.totalDuration.toFixed(2)}ms`;
}

/**
 * Get transformation steps
 */
function getSteps(this: ITransformationTracker): ITransformationStep[] {
  return Array.from(this.steps!.values());
}

/**
 * Get transformation errors
 */
function getErrors(this: ITransformationTracker): ITransformationError[] {
  return this.errors!;
}

/**
 * Get phase metrics
 */
function getPhaseMetrics(
  this: ITransformationTracker,
  phase: TransformationPhaseEnum
): IPhaseMetrics {
  const steps = Array.from(this.steps!.values()).filter((s) => s.phase === phase);
  const completed = steps.filter((s) => s.status === 'COMPLETED');
  const duration = steps
    .filter((s) => s.endTime)
    .reduce((sum, s) => sum + (s.endTime! - s.startTime), 0);

  return {
    steps: steps.length,
    duration,
    successRate: completed.length / steps.length,
    avgStepDuration: duration / steps.length,
  };
}

/**
 * Export tracking data
 */
function exportTrackingData(this: ITransformationTracker): ITransformationContext {
  const metrics = this.getMetrics();

  return {
    filePath: this.filePath!,
    sourceText: this.sourceText!,
    steps: new Map(this.steps),
    metrics,
    errors: [...this.errors!],
    imports: new Set(this.imports),
    components: new Set(this.components),
  };
}

// Assign prototype methods
Object.assign(TransformationTracker.prototype, {
  startStep,
  completeStep,
  failStep,
  skipStep,
  addImport,
  addComponent,
  addError,
  getMetrics,
  getSteps,
  getErrors,
  getPhaseMetrics,
  exportTrackingData,
  generateDetailedReport,
  generateSummaryReport,
});

/**
 * Create transformation tracker
 */
export function createTransformationTracker(
  filePath: string,
  sourceText: string
): ITransformationTracker {
  return new (TransformationTracker as any)(filePath, sourceText);
}
