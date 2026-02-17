import * as ts from 'typescript';
import { createPSRPreprocessor } from './typescript-transformer/psr-preprocessor.js';
import { createPSRTransformer } from './typescript-transformer/psr-transformer.js';
import type {
  IPSRTransformerOptions,
  IPSRTransformResult,
} from './typescript-transformer/psr-transformer.types.js';
import type { ITransformationTracker } from './typescript-transformer/transformation-tracker.types.js';

/**
 * Pipeline options (updated for TypeScript transformer)
 */
export interface IPipelineOptions {
  filePath?: string;
  debug?: boolean;
  enableSourceMaps?: boolean;
  strictMode?: boolean;
  registryImportPath?: string;
  frameworkImportPath?: string;
}

/**
 * Pipeline result with detailed tracking
 */
export interface IPipelineResult {
  code: string;
  diagnostics: IDiagnostic[];
  tracker?: ITransformationTracker;
  imports: string[];
  components: string[];
  metrics?: IPipelineMetrics;
}

export interface IDiagnostic {
  type: 'error' | 'warning' | 'info';
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

export interface IPipelineMetrics {
  totalDuration: number;
  transformationSteps: number;
  successRate: number;
  imports: number;
  components: number;
}

/**
 * Transform PSR source code using TypeScript transformer
 */
export async function transformPSR(
  source: string,
  options: IPipelineOptions = {}
): Promise<IPipelineResult> {
  const startTime = performance.now();

  console.log(`🚀 Starting TypeScript Transformer pipeline for ${options.filePath || 'unknown'}`);

  try {
    // Step 1: Preprocess PSR to valid TypeScript
    const preprocessor = createPSRPreprocessor();
    const preprocessedSource = preprocessor.preprocess(source);

    if (options.debug) {
      console.log('\n=== PREPROCESSED SOURCE ===');
      console.log(preprocessedSource);
    }
    // Step 2: Create TypeScript source file from preprocessed source
    const sourceFile = ts.createSourceFile(
      options.filePath || 'input.psr',
      preprocessedSource, // Use preprocessed source
      ts.ScriptTarget.ES2020,
      true, // setParentNodes
      ts.ScriptKind.TSX // Treat as TSX for JSX support
    );

    // Create PSR transformer with options
    const transformerOptions: IPSRTransformerOptions = {
      filePath: options.filePath,
      enableTracking: options.debug ?? true,
      enableSourceMaps: options.enableSourceMaps ?? false,
      strictMode: options.strictMode ?? true,
      registryImportPath: options.registryImportPath ?? '@pulsar-framework/pulsar.dev',
      frameworkImportPath: options.frameworkImportPath ?? '@pulsar-framework/pulsar.dev',
    };

    const transformer = createPSRTransformer(transformerOptions);

    // Transform the source file
    const result: IPSRTransformResult = transformer.transform(sourceFile);

    // Generate final JavaScript code
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });

    const outputCode = printer.printFile(result.transformedSourceFile);

    // Calculate metrics
    const totalDuration = performance.now() - startTime;
    const tracker = result.tracker;

    const metrics: IPipelineMetrics = {
      totalDuration,
      transformationSteps: tracker?.getMetrics().totalSteps ?? 0,
      successRate: tracker
        ? tracker.getMetrics().completedSteps / tracker.getMetrics().totalSteps
        : 1,
      imports: result.imports.size,
      components: result.components.size,
    };

    // Convert diagnostics
    const diagnostics: IDiagnostic[] = result.diagnostics.map((d) => ({
      type:
        d.category === ts.DiagnosticCategory.Error
          ? 'error'
          : d.category === ts.DiagnosticCategory.Warning
            ? 'warning'
            : 'info',
      phase: 'typescript-transformer',
      message: typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText,
      line: d.file && d.start ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : undefined,
      column:
        d.file && d.start ? d.file.getLineAndCharacterOfPosition(d.start).character + 1 : undefined,
    }));

    // Add tracker errors as diagnostics
    if (tracker) {
      for (const error of tracker.getErrors()) {
        diagnostics.push({
          type: error.recoverable ? 'warning' : 'error',
          phase: error.phase,
          message: error.message,
          line: error.line,
          column: error.column,
        });
      }
    }

    const pipelineResult: IPipelineResult = {
      code: outputCode,
      diagnostics,
      tracker,
      imports: Array.from(result.imports),
      components: Array.from(result.components),
      metrics,
    };

    // Log detailed report if debug enabled
    if (options.debug && tracker) {
      console.log(tracker.generateDetailedReport());
    } else if (tracker) {
      console.log(tracker.generateSummaryReport());
    }

    console.log(`✅ TypeScript transformation completed in ${totalDuration.toFixed(2)}ms`);

    return pipelineResult;
  } catch (error) {
    const totalDuration = performance.now() - startTime;

    console.error(
      `❌ TypeScript transformation failed after ${totalDuration.toFixed(2)}ms:`,
      error
    );

    return {
      code: `// Transformation failed: ${(error as Error).message}`,
      diagnostics: [
        {
          type: 'error',
          phase: 'typescript-transformer',
          message: (error as Error).message,
        },
      ],
      imports: [],
      components: [],
      metrics: {
        totalDuration,
        transformationSteps: 0,
        successRate: 0,
        imports: 0,
        components: 0,
      },
    };
  }
}

/**
 * Legacy pipeline compatibility function (for gradual migration)
 */
export function createPipeline(options: IPipelineOptions = {}) {
  return {
    transform: async (source: string): Promise<IPipelineResult> => {
      return transformPSR(source, options);
    },
  };
}

// Export TypeScript transformer components for direct usage
export { createPSRTransformer } from './typescript-transformer/psr-transformer.js';
export type {
  IPSRTransformer,
  IPSRTransformerOptions,
  IPSRTransformResult,
} from './typescript-transformer/psr-transformer.types.js';
export type {
  ITransformationMetrics,
  ITransformationStep,
  ITransformationTracker,
} from './typescript-transformer/transformation-tracker.types.js';

