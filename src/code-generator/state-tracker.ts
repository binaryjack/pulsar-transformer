/**
 * Code Generator State Tracker - Enterprise state monitoring
 * Tracks code generation state, context, and performance metrics
 */

import { DiagnosticCode, DiagnosticSeverity } from './diagnostics';

export interface ICodeGenerationState {
  phase:
    | 'idle'
    | 'interface'
    | 'component'
    | 'jsx'
    | 'expression'
    | 'statement'
    | 'program'
    | 'import';
  currentNode?: any;
  indentLevel: number;
  lineNumber: number;
  columnNumber: number;
  generationStartTime: number;
  performanceMetrics: {
    interfacesGenerated: number;
    componentsGenerated: number;
    jsxElementsGenerated: number;
    statementsGenerated: number;
    expressionsGenerated: number;
    importsGenerated: number;
    totalNodes: number;
    memoryUsage: number;
    duration: number;
  };
  context: {
    fileName?: string;
    sourceLength?: number;
    outputLength?: number;
    depth: number;
    parentNodes: any[];
    generatedImports: Set<string>;
    componentNames: Set<string>;
    interfaceNames: Set<string>;
  };
}

export interface ICodeGeneratorStateTracker {
  getState(): ICodeGenerationState;
  startGeneration(fileName?: string): void;
  finishGeneration(): void;
  setPhase(phase: ICodeGenerationState['phase']): void;
  enterNode(node: any): void;
  exitNode(): void;
  incrementIndent(): void;
  decrementIndent(): void;
  updatePosition(line: number, column: number): void;
  recordInterfaceGenerated(name: string): void;
  recordComponentGenerated(name: string): void;
  recordJSXElementGenerated(): void;
  recordStatementGenerated(): void;
  recordExpressionGenerated(): void;
  recordImportGenerated(importName: string): void;
  getPerformanceReport(): string;
  checkPerformanceThresholds(): Array<{
    code: DiagnosticCode;
    message: string;
    line: number;
    column: number;
  }>;
  reset(): void;
  hasMemoryLeak(): boolean;
  getImportCollisions(): string[];
  getComponentNameCollisions(): string[];
  getInterfaceNameCollisions(): string[];
}

/**
 * Code Generator State Tracker Implementation
 */
export const CodeGeneratorStateTracker = function (this: ICodeGeneratorStateTracker) {
  this.state = {
    phase: 'idle',
    currentNode: null,
    indentLevel: 0,
    lineNumber: 1,
    columnNumber: 1,
    generationStartTime: 0,
    performanceMetrics: {
      interfacesGenerated: 0,
      componentsGenerated: 0,
      jsxElementsGenerated: 0,
      statementsGenerated: 0,
      expressionsGenerated: 0,
      importsGenerated: 0,
      totalNodes: 0,
      memoryUsage: 0,
      duration: 0,
    },
    context: {
      fileName: undefined,
      sourceLength: 0,
      outputLength: 0,
      depth: 0,
      parentNodes: [],
      generatedImports: new Set(),
      componentNames: new Set(),
      interfaceNames: new Set(),
    },
  };
} as unknown as { new (): ICodeGeneratorStateTracker };

CodeGeneratorStateTracker.prototype.getState = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  return { ...this.state };
};

CodeGeneratorStateTracker.prototype.startGeneration = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  fileName?: string
) {
  this.state.generationStartTime = Date.now();
  this.state.context.fileName = fileName;
  this.state.phase = 'program';
  this.state.performanceMetrics = {
    interfacesGenerated: 0,
    componentsGenerated: 0,
    jsxElementsGenerated: 0,
    statementsGenerated: 0,
    expressionsGenerated: 0,
    importsGenerated: 0,
    totalNodes: 0,
    memoryUsage: process.memoryUsage().heapUsed,
    duration: 0,
  };
};

CodeGeneratorStateTracker.prototype.finishGeneration = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.performanceMetrics.duration = Date.now() - this.state.generationStartTime;
  this.state.phase = 'idle';
  this.state.performanceMetrics.memoryUsage =
    process.memoryUsage().heapUsed - this.state.performanceMetrics.memoryUsage;
};

CodeGeneratorStateTracker.prototype.setPhase = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  phase: ICodeGenerationState['phase']
) {
  this.state.phase = phase;
};

CodeGeneratorStateTracker.prototype.enterNode = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  node: any
) {
  this.state.context.parentNodes.push(this.state.currentNode);
  this.state.currentNode = node;
  this.state.context.depth++;
  this.state.performanceMetrics.totalNodes++;
};

CodeGeneratorStateTracker.prototype.exitNode = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.currentNode = this.state.context.parentNodes.pop() || null;
  this.state.context.depth = Math.max(0, this.state.context.depth - 1);
};

CodeGeneratorStateTracker.prototype.incrementIndent = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.indentLevel++;
};

CodeGeneratorStateTracker.prototype.decrementIndent = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.indentLevel = Math.max(0, this.state.indentLevel - 1);
};

CodeGeneratorStateTracker.prototype.updatePosition = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  line: number,
  column: number
) {
  this.state.lineNumber = line;
  this.state.columnNumber = column;
};

CodeGeneratorStateTracker.prototype.recordInterfaceGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  name: string
) {
  this.state.performanceMetrics.interfacesGenerated++;
  this.state.context.interfaceNames.add(name);
};

CodeGeneratorStateTracker.prototype.recordComponentGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  name: string
) {
  this.state.performanceMetrics.componentsGenerated++;
  this.state.context.componentNames.add(name);
};

CodeGeneratorStateTracker.prototype.recordJSXElementGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.performanceMetrics.jsxElementsGenerated++;
};

CodeGeneratorStateTracker.prototype.recordStatementGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.performanceMetrics.statementsGenerated++;
};

CodeGeneratorStateTracker.prototype.recordExpressionGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.performanceMetrics.expressionsGenerated++;
};

CodeGeneratorStateTracker.prototype.recordImportGenerated = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState },
  importName: string
) {
  this.state.performanceMetrics.importsGenerated++;
  this.state.context.generatedImports.add(importName);
};

CodeGeneratorStateTracker.prototype.getPerformanceReport = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  const metrics = this.state.performanceMetrics;
  return `Code Generation Performance Report:
  - Duration: ${metrics.duration}ms
  - Interfaces: ${metrics.interfacesGenerated}
  - Components: ${metrics.componentsGenerated}
  - JSX Elements: ${metrics.jsxElementsGenerated}
  - Statements: ${metrics.statementsGenerated}
  - Expressions: ${metrics.expressionsGenerated}
  - Imports: ${metrics.importsGenerated}
  - Total Nodes: ${metrics.totalNodes}
  - Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
  - Depth: ${this.state.context.depth}
  `;
};

CodeGeneratorStateTracker.prototype.checkPerformanceThresholds = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  const issues = [];
  const { duration, memoryUsage, totalNodes } = this.state.performanceMetrics;
  const { depth } = this.state.context;

  // Performance threshold checks
  if (duration > 100) {
    issues.push({
      code: DiagnosticCode.SlowGenerationPerformance,
      message: `Generation took ${duration}ms (threshold: 100ms)`,
      line: this.state.lineNumber,
      column: this.state.columnNumber,
    });
  }

  if (memoryUsage > 50 * 1024 * 1024) {
    // 50MB
    issues.push({
      code: DiagnosticCode.MemoryUsageHigh,
      message: `Memory usage ${(memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: 50MB)`,
      line: this.state.lineNumber,
      column: this.state.columnNumber,
    });
  }

  if (totalNodes > 10000) {
    issues.push({
      code: DiagnosticCode.LargeASTGeneration,
      message: `Large AST with ${totalNodes} nodes (threshold: 10000)`,
      line: this.state.lineNumber,
      column: this.state.columnNumber,
    });
  }

  if (depth > 20) {
    issues.push({
      code: DiagnosticCode.DeepNestingDetected,
      message: `Deep nesting at depth ${depth} (threshold: 20)`,
      line: this.state.lineNumber,
      column: this.state.columnNumber,
    });
  }

  if (this.state.indentLevel > 10) {
    issues.push({
      code: DiagnosticCode.ExcessiveIndentationLevels,
      message: `Excessive indentation level ${this.state.indentLevel} (threshold: 10)`,
      line: this.state.lineNumber,
      column: this.state.columnNumber,
    });
  }

  return issues;
};

CodeGeneratorStateTracker.prototype.reset = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  this.state.phase = 'idle';
  this.state.currentNode = null;
  this.state.indentLevel = 0;
  this.state.lineNumber = 1;
  this.state.columnNumber = 1;
  this.state.generationStartTime = 0;
  this.state.context.depth = 0;
  this.state.context.parentNodes = [];
  this.state.context.generatedImports.clear();
  this.state.context.componentNames.clear();
  this.state.context.interfaceNames.clear();
};

CodeGeneratorStateTracker.prototype.hasMemoryLeak = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  return this.state.performanceMetrics.memoryUsage > 100 * 1024 * 1024; // 100MB threshold
};

CodeGeneratorStateTracker.prototype.getImportCollisions = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  const imports = Array.from(this.state.context.generatedImports);
  const duplicates = imports.filter((item, index) => imports.indexOf(item) !== index);
  return [...new Set(duplicates)];
};

CodeGeneratorStateTracker.prototype.getComponentNameCollisions = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  // Check for conflicts with interface names
  const componentNames = Array.from(this.state.context.componentNames);
  const interfaceNames = Array.from(this.state.context.interfaceNames);
  return componentNames.filter((name) => interfaceNames.includes(name));
};

CodeGeneratorStateTracker.prototype.getInterfaceNameCollisions = function (
  this: ICodeGeneratorStateTracker & { state: ICodeGenerationState }
) {
  const interfaceNames = Array.from(this.state.context.interfaceNames);
  const duplicates = interfaceNames.filter((item, index) => interfaceNames.indexOf(item) !== index);
  return [...new Set(duplicates)];
};

/**
 * Global state tracker instance
 */
export function createCodeGeneratorStateTracker(): ICodeGeneratorStateTracker {
  return new CodeGeneratorStateTracker();
}

/**
 * State tracking utilities
 */
export const StateTrackingUtils = {
  /**
   * Format memory usage for human reading
   */
  formatMemoryUsage(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  },

  /**
   * Check if generation is taking too long
   */
  isSlowGeneration(duration: number): boolean {
    return duration > 100; // 100ms threshold
  },

  /**
   * Check if AST is too large
   */
  isLargeAST(nodeCount: number): boolean {
    return nodeCount > 10000;
  },

  /**
   * Check if nesting is too deep
   */
  isDeepNesting(depth: number): boolean {
    return depth > 20;
  },
};
