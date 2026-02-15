/**
 * Code Generator Diagnostic System
 * Pattern: TypeScript Compiler diagnostics for structured error reporting
 */

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Info = 2,
}

export enum DiagnosticCode {
  // Code Generation Errors (CG0xx)
  InterfaceGenerationFailed = 'CG001',
  ComponentGenerationFailed = 'CG002',
  TypeAnnotationGenerationFailed = 'CG003',
  ImportGenerationFailed = 'CG004',
  ExpressionGenerationFailed = 'CG005',
  StatementGenerationFailed = 'CG006',
  ProgramGenerationFailed = 'CG007',
  JSXElementGenerationFailed = 'CG008',
  ReturnTypeAnnotationMissing = 'CG009',
  IndentationCorrupted = 'CG010',

  // Interface Generation Issues (CG1xx)
  InterfaceNameMissing = 'CG101',
  InterfacePropertyMissing = 'CG102',
  InterfaceTypeAnnotationInvalid = 'CG103',
  InterfaceOptionalMarkerInvalid = 'CG104',
  InterfaceJSDocGeneration = 'CG105', // Critical: generating JSDoc instead of TS interface
  InterfaceBodyCorrupted = 'CG106',
  InterfaceExportMissing = 'CG107',

  // Component Generation Issues (CG2xx)
  ComponentParameterInvalid = 'CG201',
  ComponentReturnTypeMissing = 'CG202',
  ComponentRegistryWrapperFailed = 'CG203',
  ComponentBodyGenerationFailed = 'CG204',
  ComponentExportStatementMissing = 'CG205',
  ComponentNameConflict = 'CG206',
  ComponentTypeAnnotationMissing = 'CG207',

  // JSX Generation Issues (CG3xx)
  JSXElementNameInvalid = 'CG301',
  JSXAttributeGenerationFailed = 'CG302',
  JSXChildrenProcessingFailed = 'CG303',
  JSXExpressionEmbeddingFailed = 'CG304',
  JSXFragmentGenerationFailed = 'CG305',
  JSXSelfClosingTagInvalid = 'CG306',

  // Performance Warnings (CG4xx)
  LargeASTGeneration = 'CG401',
  DeepNestingDetected = 'CG402',
  ExcessiveIndentationLevels = 'CG403',
  MemoryUsageHigh = 'CG404',
  SlowGenerationPerformance = 'CG405',

  // Info/Debug (CG5xx)
  GenerationStarted = 'CG501',
  GenerationCompleted = 'CG502',
  PhaseTransition = 'CG503',
  TracingEnabled = 'CG504',
  DiagnosticCollectionActive = 'CG505',
}

export interface CodeGeneratorDiagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  line: number;
  column: number;
  length: number;
  node?: any;
  phase: 'interface' | 'component' | 'jsx' | 'expression' | 'statement' | 'program' | 'import';
  suggestion?: string;
  documentation?: string;
  context?: {
    nodeType?: string;
    parentNode?: any;
    depth?: number;
    generationPhase?: string;
  };
}

export interface ICodeGeneratorDiagnosticCollection {
  add(diagnostic: CodeGeneratorDiagnostic): void;
  addError(code: DiagnosticCode, message: string, line: number, column: number, node?: any): void;
  addWarning(code: DiagnosticCode, message: string, line: number, column: number, node?: any): void;
  addInfo(code: DiagnosticCode, message: string, line: number, column: number, node?: any): void;
  getAll(): CodeGeneratorDiagnostic[];
  getByCode(code: DiagnosticCode): CodeGeneratorDiagnostic[];
  getBySeverity(severity: DiagnosticSeverity): CodeGeneratorDiagnostic[];
  getByPhase(phase: string): CodeGeneratorDiagnostic[];
  clear(): void;
  hasErrors(): boolean;
  hasWarnings(): boolean;
  getErrorCount(): number;
  getWarningCount(): number;
  summarize(): string;
}

/**
 * Code Generator diagnostic collection implementation
 */
export const CodeGeneratorDiagnosticCollection = function (
  this: ICodeGeneratorDiagnosticCollection
) {
  this.diagnostics = [];
} as unknown as { new (): ICodeGeneratorDiagnosticCollection };

CodeGeneratorDiagnosticCollection.prototype.add = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  diagnostic: CodeGeneratorDiagnostic
) {
  this.diagnostics.push(diagnostic);
};

CodeGeneratorDiagnosticCollection.prototype.addError = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  code: DiagnosticCode,
  message: string,
  line: number,
  column: number,
  node?: any
) {
  this.add({
    severity: DiagnosticSeverity.Error,
    code,
    message,
    line,
    column,
    length: 0,
    node,
    phase: 'program', // default phase
  });
};

CodeGeneratorDiagnosticCollection.prototype.addWarning = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  code: DiagnosticCode,
  message: string,
  line: number,
  column: number,
  node?: any
) {
  this.add({
    severity: DiagnosticSeverity.Warning,
    code,
    message,
    line,
    column,
    length: 0,
    node,
    phase: 'program', // default phase
  });
};

CodeGeneratorDiagnosticCollection.prototype.addInfo = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  code: DiagnosticCode,
  message: string,
  line: number,
  column: number,
  node?: any
) {
  this.add({
    severity: DiagnosticSeverity.Info,
    code,
    message,
    line,
    column,
    length: 0,
    node,
    phase: 'program', // default phase
  });
};

CodeGeneratorDiagnosticCollection.prototype.getAll = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  return this.diagnostics;
};

CodeGeneratorDiagnosticCollection.prototype.getByCode = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  code: DiagnosticCode
) {
  return this.diagnostics.filter((d) => d.code === code);
};

CodeGeneratorDiagnosticCollection.prototype.getBySeverity = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  severity: DiagnosticSeverity
) {
  return this.diagnostics.filter((d) => d.severity === severity);
};

CodeGeneratorDiagnosticCollection.prototype.getByPhase = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] },
  phase: string
) {
  return this.diagnostics.filter((d) => d.phase === phase);
};

CodeGeneratorDiagnosticCollection.prototype.clear = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  this.diagnostics = [];
};

CodeGeneratorDiagnosticCollection.prototype.hasErrors = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
};

CodeGeneratorDiagnosticCollection.prototype.hasWarnings = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.Warning);
};

CodeGeneratorDiagnosticCollection.prototype.getErrorCount = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  return this.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error).length;
};

CodeGeneratorDiagnosticCollection.prototype.getWarningCount = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  return this.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning).length;
};

CodeGeneratorDiagnosticCollection.prototype.summarize = function (
  this: ICodeGeneratorDiagnosticCollection & { diagnostics: CodeGeneratorDiagnostic[] }
) {
  const errors = this.getErrorCount();
  const warnings = this.getWarningCount();
  const total = this.diagnostics.length;
  return `Code Generation: ${total} diagnostics (${errors} errors, ${warnings} warnings)`;
};

/**
 * Global diagnostic collection instance
 */
export function createCodeGeneratorDiagnosticCollection(): ICodeGeneratorDiagnosticCollection {
  return new CodeGeneratorDiagnosticCollection();
}

/**
 * Helper functions for common diagnostic scenarios
 */
export const CodeGeneratorDiagnostics = {
  /**
   * Report interface generation producing JSDoc instead of TypeScript
   */
  reportInterfaceJSDocGeneration(
    line: number,
    column: number,
    interfaceName: string
  ): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Error,
      code: DiagnosticCode.InterfaceJSDocGeneration,
      message: `Interface '${interfaceName}' generated as JSDoc comment instead of TypeScript interface declaration`,
      line,
      column,
      length: 0,
      phase: 'interface',
      suggestion: 'Generate proper TypeScript interface syntax: interface Name { ... }',
      documentation:
        'CG105: Interface declarations must generate valid TypeScript syntax, not JSDoc comments',
    };
  },

  /**
   * Report missing return type annotation in component
   */
  reportMissingReturnType(
    line: number,
    column: number,
    componentName: string
  ): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Error,
      code: DiagnosticCode.ComponentReturnTypeMissing,
      message: `Component '${componentName}' missing return type annotation`,
      line,
      column,
      length: 0,
      phase: 'component',
      suggestion: 'Add :HTMLElement return type annotation to component function',
      documentation: 'CG202: All components must have explicit return type annotations',
    };
  },

  /**
   * Report generation performance issue
   */
  reportSlowGeneration(line: number, column: number, duration: number): CodeGeneratorDiagnostic {
    return {
      severity: DiagnosticSeverity.Warning,
      code: DiagnosticCode.SlowGenerationPerformance,
      message: `Code generation took ${duration}ms (threshold: 100ms)`,
      line,
      column,
      length: 0,
      phase: 'program',
      suggestion: 'Consider optimizing AST traversal or reducing complexity',
      documentation: 'CG405: Generation performance should be under 100ms for most files',
    };
  },
};
