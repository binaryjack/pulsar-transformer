/**
 * Emitter Type Definitions
 *
 * Defines interfaces for code generation from optimized IR.
 */

import type { IIRNode } from '../analyzer/ir/ir-node-types.js'

/**
 * Emitter configuration options
 */
export interface IEmitterConfig {
  /**
   * Target output format
   */
  format?: 'esm' | 'cjs';

  /**
   * Indentation style
   */
  indent?: '  ' | '    ' | '\t';

  /**
   * Whether to include source maps
   */
  sourceMaps?: boolean;

  /**
   * Whether to minify output
   */
  minify?: boolean;

  /**
   * Custom import paths for runtime
   */
  runtimePaths?: {
    core?: string;
    jsxRuntime?: string;
    registry?: string;
  };
}

/**
 * Code generation context
 */
export interface IEmitContext {
  /**
   * Configuration options
   */
  config: Required<IEmitterConfig>;

  /**
   * Import tracker for managing imports
   */
  imports: IImportTracker;

  /**
   * Current indentation level
   */
  indentLevel: number;

  /**
   * Generated code buffer
   */
  code: string[];

  /**
   * Generated variable names (for uniqueness)
   */
  usedNames: Set<string>;

  /**
   * Counter for generating unique element variable names
   */
  elementCounter: number;

  /**
   * Debug iteration counter for detecting infinite loops
   */
  _debugIterationCount?: number;

  /**
   * Max iterations before throwing error (safety check)
   */
  _maxIterations?: number;
}

/**
 * Import tracker interface
 */
export interface IImportTracker {
  /**
   * Add an import
   */
  addImport(source: string, specifier: string): void;

  /**
   * Get all imports
   */
  getImports(): Map<string, Set<string | null>>;

  /**
   * Generate import statements
   */
  generateImports(): string;

  /**
   * Check if import exists
   */
  hasImport(source: string, specifier: string): boolean;
}

/**
 * Internal import tracker interface (with prototype methods)
 */
export interface IImportTrackerInternal extends IImportTracker {
  imports: Map<string, Set<string | null>>;
  _formatImport(source: string, specifiers: Set<string | null>): string;
}

/**
 * Main emitter interface
 */
export interface IEmitter {
  /**
   * Emit code from IR
   */
  emit(ir: IIRNode): string;

  /**
   * Get current context
   */
  getContext(): IEmitContext;
}

/**
 * Internal emitter interface (with prototype methods)
 */
export interface IEmitterInternal extends IEmitter {
  context: IEmitContext;

  // Code generation methods
  _emitComponent(ir: IIRNode): void;
  _emitElement(ir: IIRNode): void;
  _emitSignalBinding(ir: IIRNode): void;
  _emitEventHandler(ir: IIRNode): void;
  _emitImport(ir: IIRNode): void;
  _emitExport(ir: IIRNode): void;
  _emitVariableDeclaration(ir: IIRNode): void;
  _emitLiteral(ir: IIRNode): void;
  _emitIdentifier(ir: IIRNode): void;
  _emitCallExpression(ir: IIRNode): void;
  _emitArrowFunction(ir: IIRNode): void;

  // Expression generation (returns string without side effects)
  _emitExpression(ir: IIRNode): string;

  // Statement generation (emits without resetting state)
  _emitStatement(ir: IIRNode): void;

  // Helper methods
  _indent(): string;
  _addLine(line: string): void;
  _generateUniqueName(base: string): string;
  _formatCode(): string;
}

/**
 * Code generator interface
 */
export interface ICodeGenerator {
  /**
   * Generate code for a specific IR node type
   */
  generate(ir: IIRNode, context: IEmitContext): string;
}

/**
 * Element generator interface
 */
export interface IElementGenerator extends ICodeGenerator {
  /**
   * Generate t_element() call
   */
  generateElementCall(tag: string, attributes: Record<string, unknown>): string;

  /**
   * Generate attribute object
   */
  generateAttributes(attributes: Record<string, unknown>): string;
}

/**
 * Registry generator interface
 */
export interface IRegistryGenerator extends ICodeGenerator {
  /**
   * Generate $REGISTRY.execute() wrapper
   */
  generateExecuteWrapper(id: string, body: string): string;

  /**
   * Generate $REGISTRY.wire() call
   */
  generateWireCall(element: string, property: string, getter: string): string;
}

/**
 * Event generator interface
 */
export interface IEventGenerator extends ICodeGenerator {
  /**
   * Generate addEventListener() call
   */
  generateEventListener(element: string, event: string, handler: string): string;

  /**
   * Normalize event name (onClick → click)
   */
  normalizeEventName(name: string): string;
}
