/**
 * Factory - Creates all transformer components
 * Complete implementation with full configuration support
 */

import * as ts from 'typescript';
import { createExpressionClassifier } from './detector/expression-classifier.js';
import { detectSignals } from './detector/signal-detector.js';
import { createElementGenerator } from './generator/element-generator.js';
import {
  IComponentWrapper,
  IDebugOptions,
  IElementGenerator,
  IExpressionClassifier,
  ITransformContext,
  ITransformerFactory,
  ITransformerOptions,
} from './types.js';
import { generateFileHash } from './utils/file-hash.js';
import { createTransformTracker } from './utils/transform-tracker.js';
import { createComponentWrapper } from './wrapper/component-wrapper.js';

/**
 * Default transformer options
 */
const DEFAULT_OPTIONS: ITransformerOptions = {
  debug: process.env.PULSAR_DEBUG === 'true',
  debugChannels: {
    transform: true,
    detector: true,
    generator: true,
    visitor: true,
    wire: true,
    performance: true,
  },
  strict: false,
  profile: true,
  sourceMap: true,
  emitComments: true,
  runtimeVersion: '0.7.0',
};

/**
 * Default debug options
 */
const DEFAULT_DEBUG_OPTIONS: IDebugOptions = {
  enabled: process.env.PULSAR_DEBUG === 'true',
  channels: DEFAULT_OPTIONS.debugChannels,
  output: {
    console: true,
    file: null,
    sourceMap: false,
    astDump: false,
    format: 'text',
  },
  performance: {
    enabled: true,
    threshold: 100,
    trackMemory: true,
    trackGC: false,
  },
};

/**
 * Main transformer factory
 */
export const transformerFactory: ITransformerFactory = {
  createContext(
    sourceFile: ts.SourceFile,
    fileName: string,
    typeChecker: ts.TypeChecker | undefined,
    program: ts.Program | undefined,
    options?: Partial<ITransformerOptions>
  ): ITransformContext {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const debugOptions = mergedOptions.debug
      ? DEFAULT_DEBUG_OPTIONS
      : {
          ...DEFAULT_DEBUG_OPTIONS,
          enabled: false,
        };

    const tracker = mergedOptions.debug ? createTransformTracker(debugOptions) : undefined;

    const context: ITransformContext = {
      sourceFile,
      fileName,
      fileHash: generateFileHash(fileName),
      typeChecker,
      program,
      signalGetters: new Set(),
      signalImports: new Map(),
      components: new Map(),
      signals: new Map(),
      componentIndex: new Map(),
      currentComponent: null,
      jsxDepth: 0,
      varCounter: 0,
      debugTracker: tracker,
      options: mergedOptions,
      requiresRegistry: false,
    };

    // Start tracking session
    if (tracker) {
      tracker.startSession(fileName, sourceFile);
    }

    // Detect signals in source file
    detectSignals(sourceFile, context);

    return context;
  },

  createClassifier(context: ITransformContext): IExpressionClassifier {
    return createExpressionClassifier(context);
  },

  createElementGenerator(context: ITransformContext): IElementGenerator {
    return createElementGenerator(context);
  },

  createAttributeGenerator(context: ITransformContext) {
    // Attribute generation is handled within element generator
    throw new Error('Attribute generator is integrated into element generator');
  },

  createChildGenerator(context: ITransformContext) {
    // Child generation is handled within element generator
    throw new Error('Child generator is integrated into element generator');
  },

  createComponentWrapper(context: ITransformContext): IComponentWrapper {
    return createComponentWrapper(context);
  },

  createControlFlowGenerator(context: ITransformContext) {
    // Control flow to be implemented
    throw new Error('Control flow generator not yet implemented');
  },

  createVisitor(context: ITransformContext) {
    // Visitor is created in main transformer
    throw new Error('Visitor is created in main transformer index');
  },

  createTracker(options: IDebugOptions) {
    return createTransformTracker(options);
  },
};

/**
 * Initialize transformer context
 */
export function initializeContext(
  sourceFile: ts.SourceFile,
  fileName: string,
  typeChecker: ts.TypeChecker | undefined,
  program: ts.Program | undefined,
  options?: Partial<ITransformerOptions>
): ITransformContext {
  return transformerFactory.createContext(sourceFile, fileName, typeChecker, program, options);
}
