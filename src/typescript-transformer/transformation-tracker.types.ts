/**
 * Transformation Tracker Types - Detailed step tracking system
 * Pattern: Interface-based with tracking metadata
 */

export interface ITransformationStep {
  readonly id: string;
  readonly name: string;
  readonly phase: TransformationPhaseEnum;
  readonly startTime: number;
  readonly endTime?: number;
  readonly inputNode: string; // Node type or description
  readonly outputNode?: string;
  readonly status: StepStatusEnum;
  readonly error?: string;
  readonly metadata: Record<string, unknown>;
}

export enum TransformationPhaseEnum {
  SETUP = 'SETUP',
  COMPONENT_TRANSFORM = 'COMPONENT_TRANSFORM',
  JSX_TRANSFORM = 'JSX_TRANSFORM',
  CONTROL_FLOW = 'CONTROL_FLOW',
  CONTEXT_API = 'CONTEXT_API',
  IMPORT_MANAGEMENT = 'IMPORT_MANAGEMENT',
  STYLE_OBJECTS = 'STYLE_OBJECTS',
  RESOURCE_MANAGEMENT = 'RESOURCE_MANAGEMENT',
  VALIDATION = 'VALIDATION',
}

export enum StepStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface ITransformationContext {
  readonly filePath: string;
  readonly sourceText: string;
  readonly steps: Map<string, ITransformationStep>;
  readonly metrics: ITransformationMetrics;
  readonly errors: ITransformationError[];
  readonly imports: Set<string>;
  readonly components: Set<string>;
}

export interface ITransformationMetrics {
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly failedSteps: number;
  readonly totalDuration: number;
  readonly phaseMetrics: Map<TransformationPhaseEnum, IPhaseMetrics>;
}

export interface IPhaseMetrics {
  readonly steps: number;
  readonly duration: number;
  readonly successRate: number;
  readonly avgStepDuration: number;
}

export interface ITransformationError {
  readonly stepId: string;
  readonly phase: TransformationPhaseEnum;
  readonly message: string;
  readonly nodeType?: string;
  readonly line?: number;
  readonly column?: number;
  readonly recoverable: boolean;
}

export interface ITransformationTracker {
  new (filePath: string, sourceText: string): ITransformationTracker;

  // Properties
  filePath?: string;
  sourceText?: string;
  startTime?: number;
  imports?: Set<string>;
  components?: Set<string>;
  steps?: Map<string, ITransformationStep>;
  metrics?: ITransformationMetrics;
  errors?: ITransformationError[];

  // Core tracking
  startStep(
    id: string,
    name: string,
    phase: TransformationPhaseEnum,
    inputNode: string,
    metadata?: Record<string, unknown>
  ): void;
  completeStep(id: string, outputNode: string, metadata?: Record<string, unknown>): void;
  failStep(id: string, error: string): void;
  skipStep(id: string, reason: string): void;

  // Context management
  addImport(importName: string): void;
  addComponent(componentName: string): void;
  addError(
    stepId: string,
    phase: TransformationPhaseEnum,
    message: string,
    recoverable?: boolean
  ): void;

  // Metrics
  getMetrics(): ITransformationMetrics;
  getPhaseMetrics(phase: TransformationPhaseEnum): IPhaseMetrics;
  getSteps(): ITransformationStep[];
  getErrors(): ITransformationError[];

  // Reporting
  generateDetailedReport(): string;
  generateSummaryReport(): string;
  exportTrackingData(): ITransformationContext;
}

