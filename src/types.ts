/**
 * Core type definitions for Pulsar JSX Transformer
 * Complete implementation - no shortcuts, no stubs
 */

import * as ts from 'typescript';

// ============================================================================
// Transform Context - Complete State Management
// ============================================================================

export interface ITransformContext {
  /** Source file being transformed */
  readonly sourceFile: ts.SourceFile;

  /** File path for stable ID generation */
  readonly fileName: string;

  /** File hash for component IDs (8 chars SHA-256) */
  readonly fileHash: string;

  /** TypeScript type checker for symbol resolution (may be undefined in transpileModule) */
  readonly typeChecker: ts.TypeChecker | undefined;

  /** Program reference for full type information (may be undefined in transpileModule) */
  readonly program: ts.Program | undefined;

  /** Signal getter symbols detected in this file */
  readonly signalGetters: Set<ts.Symbol>;

  /** Signal-creating imports tracked (useState, createSignal, etc.) */
  readonly signalImports: Map<string, ImportInfo>;

  /** Scope-based signal getter tracking: scope name -> Set of getter names */
  readonly scopeMap: Map<string, Set<string>>;

  /** Known signal creator function names (useState, createSignal, etc.) */
  readonly signalCreators: Set<string>;

  /** Flag indicating if any signal imports exist in this file */
  hasSignalImports: boolean;

  /** Component registry */
  readonly components: Map<string, IComponentInfo>;

  /** Signal registry */
  readonly signals: Map<string, ISignalInfo>;

  /** Component instance counters for unique IDs */
  readonly componentIndex: Map<string, number>;

  /** Current component being transformed (for scoping) */
  currentComponent: string | null;

  /** Current JSX depth (for nested elements) */
  jsxDepth: number;

  /** Variable counter for generated names */
  varCounter: number;

  /** Debug tracker (optional) */
  readonly debugTracker?: ITransformTracker;

  /** Transformation options */
  readonly options: ITransformerOptions;

  /** Tracks if $REGISTRY is used (for auto-import) */
  requiresRegistry: boolean;
}

export interface ImportInfo {
  /** Module being imported from */
  moduleName: string;

  /** Imported symbol name */
  symbolName: string;

  /** Import type (default, named, namespace) */
  importType: 'default' | 'named' | 'namespace';

  /** Aliased import name (for 'as' imports) */
  importedAs?: string;

  /** Module path (same as moduleName, for compatibility) */
  module?: string;

  /** Original AST node */
  node: ts.ImportDeclaration;
}

/**
 * Component information
 */
export interface IComponentInfo {
  name: string;
  componentId: string;
  node: ts.Node;
  parameters: ts.ParameterDeclaration[];
  hasSignals: boolean;
}

/**
 * Signal information
 */
export interface ISignalInfo {
  name: string;
  type: 'signal' | 'memo' | 'effect' | 'computed';
  isReactive: boolean;
  isMemoized: boolean;
  sourceNode?: ts.Node;
  dependencies?: string[];
}

export interface ITransformerOptions {
  /** Enable debug tracking */
  debug: boolean;

  /** Debug channel configuration */
  debugChannels: IDebugChannels;

  /** Strict mode (fail on warnings) */
  strict: boolean;

  /** Enable performance profiling */
  profile: boolean;

  /** Output source maps */
  sourceMap: boolean;

  /** Generate comments in output */
  emitComments: boolean;

  /** Target runtime version */
  runtimeVersion: string;
}

export interface IDebugChannels {
  transform: boolean;
  detector: boolean;
  generator: boolean;
  visitor: boolean;
  wire: boolean;
  performance: boolean;
}

// ============================================================================
// Debug & Tracking Infrastructure
// ============================================================================

export interface IDebugOptions {
  enabled: boolean;
  channels: IDebugChannels;
  output: IDebugOutput;
  performance: IPerformanceOptions;
}

export interface IDebugOutput {
  console: boolean;
  file: string | null;
  sourceMap: boolean;
  astDump: boolean;
  format: 'text' | 'json' | 'html';
}

export interface IPerformanceOptions {
  enabled: boolean;
  threshold: number; // ms
  trackMemory: boolean;
  trackGC: boolean;
}

export interface ITransformStep {
  readonly id: string;
  readonly phase: TransformPhase;
  readonly timestamp: number;
  duration: number;

  readonly input: IStepInput;
  readonly output: IStepOutput;
  readonly context: IStepContext;

  classification?: IExpressionClassification;
  error?: IStepError;
  performance?: IStepPerformance;
}

export type TransformPhase = 'detect' | 'generate' | 'wrap' | 'visit' | 'wire' | 'validate';

export interface IStepInput {
  nodeType: string;
  nodeKind: ts.SyntaxKind;
  nodeText: string;
  position: IPosition;
  sourceSnippet: string;
}

export interface IStepOutput {
  code: string;
  astNodes: ts.Node[];
  generatedLines: number;
}

export interface IStepContext {
  fileName: string;
  componentId?: string;
  parentStep?: string;
  depth: number;
  metadata: Record<string, unknown>;
}

export interface IStepError {
  message: string;
  code: string;
  stack: string;
  context: ITransformerErrorContext;
}

export interface IStepPerformance {
  duration: number;
  memoryDelta: number;
  gcTime: number;
  nodeCount: number;
}

export interface IPosition {
  line: number;
  column: number;
  offset: number;
}

export interface ITransformSession {
  readonly sessionId: string;
  readonly fileName: string;
  readonly startTime: number;
  endTime?: number;

  readonly steps: ITransformStep[];
  readonly summary: ISessionSummary;
  readonly ast: IASTSnapshot;
}

export interface ISessionSummary {
  totalSteps: number;
  totalDuration: number;
  errorsCount: number;
  warningsCount: number;
  componentsTransformed: number;
  wiresGenerated: number;
  eventsAttached: number;
  averageStepTime: number;
  peakMemory: number;
}

export interface IASTSnapshot {
  before: string; // Serialized AST
  after: string; // Serialized AST
  diff: string; // Diff representation
}

/**
 * Error context interface
 */
export interface IErrorContext {
  sourceFile: string;
  line: number;
  column: number;
  offset: number;
  sourceSnippet?: string;
  phase: string;
  nodeType?: string;
  nodeKind?: number;
  astPath?: string[];
  originalCode?: string;
  transformedCode?: string;
  signalInfo?: ISignalInfo;
  componentInfo?: {
    name: string;
    componentId: string;
    depth: number;
  };
  parentContext?: any;
  sessionId?: string;
  stackTrace?: string;
}

export interface ITransformTracker {
  currentSession?: string;
  options: {
    enabled: boolean;
    verbose: boolean;
    output: {
      console: boolean;
      file?: string;
      format: 'json' | 'markdown';
    };
  };
  startSession(fileName: string, sourceFile: ts.SourceFile): string;
  trackStep(step: Omit<ITransformStep, 'id' | 'timestamp' | 'duration'>): ITransformStep;
  endSession(): ITransformSession;
  getSession(sessionId: string): ITransformSession | undefined;
  getAllSessions(): ITransformSession[];
  exportSession(sessionId: string, format: 'json' | 'html' | 'text'): string;
}

// ============================================================================
// Expression Classification - Complete Strategy Pattern
// ============================================================================

export type ExpressionType =
  | 'static'
  | 'dynamic'
  | 'event'
  | 'child'
  | 'fragment'
  | 'conditional'
  | 'loop';

export interface IExpressionClassification {
  readonly type: ExpressionType;
  readonly strategy: string;
  readonly reason: string;
  readonly requiresWire: boolean;
  readonly requiresAnchor: boolean;
  readonly metadata: IClassificationMetadata;
  // Convenience properties for tests
  readonly isStatic?: boolean;
  readonly hasSignals?: boolean;
}

export interface IClassificationMetadata {
  signalCount: number;
  hasNestedSignals: boolean;
  isNullable: boolean;
  isConditional: boolean;
  isArray: boolean;
  dependencies: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  eventName?: string; // For event handler classifications
  isInline?: boolean; // Whether event handler is inline function
}

export interface IExpressionClassifier {
  classify(expression: ts.Expression): IExpressionClassification;
  classifyAttribute(propName: string, value: ts.Expression): IExpressionClassification;
  isSignalCall(expression: ts.Expression): boolean;
  isEventHandler(propName: string): boolean;
  isStaticValue(expression: ts.Expression): boolean;
  hasSignalDependencies(expression: ts.Expression): boolean;
  getSignalDependencies(expression: ts.Expression): ts.Symbol[];
}

// ============================================================================
// Code Generation - Complete Builder Pattern
// ============================================================================

export interface IElementGenerator {
  generateElement(element: ts.JsxElement | ts.JsxSelfClosingElement): IGeneratedElement;
  generateFragment(fragment: ts.JsxFragment): IGeneratedElement;
  generateComponent(component: ts.JsxElement | ts.JsxSelfClosingElement): IGeneratedElement;
}

export interface IGeneratedElement {
  statements: ts.Statement[];
  variableName: string;
  tagName?: string; // Element tag name (div, span, etc.) - optional for fragments/components
  requiredImports: Set<string>;
  wires: IWireCall[];
  events: IEventCall[];
  children: IGeneratedElement[];
}

export interface IWireCall {
  element: string;
  property: string;
  getter: ts.ArrowFunction | ts.Expression; // Support both arrow functions and signal getter references
  dependencies: ts.Symbol[];
  comment?: string;
}

export interface IEventCall {
  element: string;
  eventName: string;
  handler: ts.Expression;
  options?: IEventOptions;
}

export interface IEventOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

export interface IAttributeGenerator {
  generateStaticAttribute(name: string, value: ts.Expression): ts.Statement;
  generateDynamicAttribute(name: string, value: ts.Expression): IWireCall;
  generateStyleAttribute(value: ts.Expression): ts.Statement | IWireCall;
  generateClassAttribute(value: ts.Expression): ts.Statement | IWireCall;
}

export interface IChildGenerator {
  generateTextChild(text: ts.JsxText): ts.Statement[];
  generateExpressionChild(expr: ts.JsxExpression): ts.Statement[] | IWireCall;
  generateElementChild(element: ts.JsxElement | ts.JsxSelfClosingElement): IGeneratedElement;
  generateFragmentChild(fragment: ts.JsxFragment): IGeneratedElement;
}

// ============================================================================
// Component Wrapping - Complete Registry Integration
// ============================================================================

export interface IComponentWrapper {
  wrapComponent(declaration: IComponentDeclaration): ts.Statement;
  wrapComponentBody(body: ts.Statement[], componentId: string): ts.Block;
  generateComponentId(componentName: string): string;
  generateRegistryCall(componentId: string, factory: ts.ArrowFunction): ts.CallExpression;
}

export interface IComponentDeclaration {
  name: string;
  node: ts.FunctionDeclaration | ts.VariableDeclaration | ts.ArrowFunction;
  parameters: ts.ParameterDeclaration[];
  returnType?: ts.TypeNode;
  body: ts.Statement[] | ts.Expression;
}

// ============================================================================
// Control Flow - Show and For Components
// ============================================================================

export interface IControlFlowGenerator {
  generateShow(
    condition: ts.Expression,
    trueBranch: ts.JsxChild,
    falseBranch?: ts.JsxChild
  ): IGeneratedElement;
  generateFor(
    collection: ts.Expression,
    itemFn: ts.ArrowFunction,
    keyFn?: ts.Expression
  ): IGeneratedElement;
  generateSwitch(discriminant: ts.Expression, cases: ISwitchCase[]): IGeneratedElement;
}

export interface ISwitchCase {
  match: ts.Expression;
  render: ts.JsxChild;
}

export interface IAnchorGenerator {
  generateAnchor(type: 'show' | 'for' | 'portal'): ts.Statement;
  generateAnchorVariable(name: string, type: string): ts.VariableStatement;
}

// ============================================================================
// AST Visitor - Complete Traversal Pattern
// ============================================================================

export interface IJsxVisitor {
  visitNode(node: ts.Node): ts.VisitResult<ts.Node>;
  visitElement(node: ts.JsxElement): ts.Expression;
  visitSelfClosingElement(node: ts.JsxSelfClosingElement): ts.Expression;
  visitFragment(node: ts.JsxFragment): ts.Expression;
  visitExpression(node: ts.JsxExpression): ts.Expression;
  visitAttribute(node: ts.JsxAttribute): void;
  visitSpreadAttribute(node: ts.JsxSpreadAttribute): void;
}

// ============================================================================
// Factory Pattern - Complete Object Creation
// ============================================================================

export interface ITransformerFactory {
  createContext(
    sourceFile: ts.SourceFile,
    fileName: string,
    typeChecker: ts.TypeChecker | undefined,
    program: ts.Program | undefined,
    options?: Partial<ITransformerOptions>
  ): ITransformContext;

  createClassifier(context: ITransformContext): IExpressionClassifier;
  createElementGenerator(context: ITransformContext): IElementGenerator;
  createAttributeGenerator(context: ITransformContext): IAttributeGenerator;
  createChildGenerator(context: ITransformContext): IChildGenerator;
  createComponentWrapper(context: ITransformContext): IComponentWrapper;
  createControlFlowGenerator(context: ITransformContext): IControlFlowGenerator;
  createVisitor(context: ITransformContext): IJsxVisitor;
  createTracker(options: IDebugOptions): ITransformTracker;
}

// ============================================================================
// Error Handling - Complete Context Preservation
// ============================================================================

export interface ITransformerErrorContext {
  sourceFile: string;
  line: number;
  column: number;
  offset: number;
  sourceSnippet: string;

  phase: TransformPhase;
  componentId?: string;
  componentName?: string;
  parentNode?: string;

  attemptedStrategy?: string;
  rejectionReason?: string;

  originalCode: string;
  partialOutput?: string;

  nodeType: string;
  nodeKind: ts.SyntaxKind;
  astPath: string[];

  sessionId?: string;
  stepIndex?: number;
  previousSteps?: ITransformStep[];

  typeInfo?: ITypeInfo;
  symbolInfo?: ISymbolInfo;
}

export interface ITypeInfo {
  typeName: string;
  typeFlags: ts.TypeFlags;
  isNullable: boolean;
  isUnion: boolean;
  isIntersection: boolean;
  members?: string[];
}

export interface ISymbolInfo {
  symbolName: string;
  symbolFlags: ts.SymbolFlags;
  declarations: string[];
  isExported: boolean;
  isFromExternalModule: boolean;
}

export class TransformerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: ITransformerErrorContext
  ) {
    super(`[${code}] ${message}`);
    this.name = 'TransformerError';
    Error.captureStackTrace(this, TransformerError);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

// ============================================================================
// Validation & Analysis
// ============================================================================

export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}

export interface IValidationError {
  code: string;
  message: string;
  node: ts.Node;
  severity: 'error' | 'fatal';
  fix?: IQuickFix;
}

export interface IValidationWarning {
  code: string;
  message: string;
  node: ts.Node;
  suggestion?: string;
}

export interface IQuickFix {
  description: string;
  changes: ITextChange[];
}

export interface ITextChange {
  span: ts.TextSpan;
  newText: string;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export interface IPerformanceMetrics {
  transformTime: number;
  parseTime: number;
  generateTime: number;
  validateTime: number;

  nodesProcessed: number;
  componentsTransformed: number;
  wiresGenerated: number;
  eventsAttached: number;

  memoryUsed: number;
  peakMemory: number;
  gcCount: number;
  gcTime: number;
}
