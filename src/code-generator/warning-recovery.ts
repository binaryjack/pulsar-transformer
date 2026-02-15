/**
 * Code Generator Warning Recovery - Enterprise error recovery and fallback mechanisms
 * Provides robust error recovery and fallback strategies for code generation failures
 */

import { DiagnosticCode, DiagnosticSeverity, CodeGeneratorDiagnostic } from './diagnostics.js';
import { ICodeGenerationState } from './state-tracker.js';

export interface IRecoveryStrategy {
  code: DiagnosticCode;
  description: string;
  canRecover: (error: Error, context: IRecoveryContext) => boolean;
  recover: (error: Error, context: IRecoveryContext) => IRecoveryResult;
  fallbackGeneration?: (node: any, context: IRecoveryContext) => string;
}

export interface IRecoveryContext {
  node?: any;
  generationState: ICodeGenerationState;
  originalError: Error;
  attemptNumber: number;
  maxRetries: number;
  previousOutput: string;
  diagnostics: CodeGeneratorDiagnostic[];
}

export interface IRecoveryResult {
  success: boolean;
  output: string;
  warningsGenerated: CodeGeneratorDiagnostic[];
  fallbackUsed: boolean;
  strategyApplied: string;
  shouldRetry: boolean;
  modifiedNode?: any;
}

export interface ICodeGeneratorWarningRecovery {
  registerStrategy(strategy: IRecoveryStrategy): void;
  attemptRecovery(error: Error, context: IRecoveryContext): IRecoveryResult;
  getAvailableStrategies(error: Error, context: IRecoveryContext): IRecoveryStrategy[];
  createFallbackOutput(node: any, phase: string): string;
  canGenerateWithFallback(node: any): boolean;
  generateWarningForRecovery(strategy: string, node: any): CodeGeneratorDiagnostic;
  setMaxRetries(count: number): void;
  getRecoveryStatistics(): RecoveryStatistics;
  clearRecoveryStatistics(): void;
  createFallbackInterface(node: any): string;
  createFallbackComponent(node: any): string;
  createFallbackJSX(node: any): string;
  createFallbackExpression(node: any): string;
  createFallbackStatement(node: any): string;
  createFallbackImport(node: any): string;
  initializeDefaultStrategies(): void;
}

export interface RecoveryStatistics {
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  strategiesUsed: Map<string, number>;
  fallbacksGenerated: number;
  mostCommonFailures: Array<{ code: DiagnosticCode; count: number }>;
}

/**
 * Code Generator Warning Recovery Implementation
 */
export const CodeGeneratorWarningRecovery = function (
  this: ICodeGeneratorWarningRecovery & {
    strategies: Map<DiagnosticCode, IRecoveryStrategy[]>;
    maxRetries: number;
    statistics: RecoveryStatistics;
  }
) {
  this.strategies = new Map<DiagnosticCode, IRecoveryStrategy[]>();
  this.maxRetries = 3;
  this.statistics = {
    totalRecoveryAttempts: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    strategiesUsed: new Map(),
    fallbacksGenerated: 0,
    mostCommonFailures: [],
  };
  (this as any).initializeDefaultStrategies();
} as unknown as { new (): ICodeGeneratorWarningRecovery };

CodeGeneratorWarningRecovery.prototype.registerStrategy = function (
  this: ICodeGeneratorWarningRecovery & { strategies: Map<DiagnosticCode, IRecoveryStrategy[]> },
  strategy: IRecoveryStrategy
) {
  if (!this.strategies.has(strategy.code)) {
    this.strategies.set(strategy.code, []);
  }
  this.strategies.get(strategy.code)!.push(strategy);
};

CodeGeneratorWarningRecovery.prototype.attemptRecovery = function (
  this: ICodeGeneratorWarningRecovery & {
    strategies: Map<DiagnosticCode, IRecoveryStrategy[]>;
    statistics: RecoveryStatistics;
    maxRetries: number;
  },
  error: Error,
  context: IRecoveryContext
): IRecoveryResult {
  this.statistics.totalRecoveryAttempts++;

  const availableStrategies = this.getAvailableStrategies(error, context);

  for (const strategy of availableStrategies) {
    if (strategy.canRecover(error, context)) {
      try {
        const result = strategy.recover(error, context);

        if (result.success) {
          this.statistics.successfulRecoveries++;
          const count = this.statistics.strategiesUsed.get(strategy.description) || 0;
          this.statistics.strategiesUsed.set(strategy.description, count + 1);

          return {
            ...result,
            strategyApplied: strategy.description,
          };
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy '${strategy.description}' failed:`, recoveryError);
      }
    }
  }

  // All strategies failed, attempt fallback generation
  const fallbackOutput = this.createFallbackOutput(context.node, context.generationState.phase);

  if (fallbackOutput) {
    this.statistics.fallbacksGenerated++;
    return {
      success: true,
      output: fallbackOutput,
      warningsGenerated: [this.generateWarningForRecovery('fallback-generation', context.node)],
      fallbackUsed: true,
      strategyApplied: 'fallback-generation',
      shouldRetry: false,
    };
  }

  this.statistics.failedRecoveries++;
  return {
    success: false,
    output: '',
    warningsGenerated: [
      {
        severity: DiagnosticSeverity.Error,
        code: DiagnosticCode.ComponentGenerationFailed,
        message: `Recovery failed: ${error.message}`,
        line: context.generationState.lineNumber,
        column: context.generationState.columnNumber,
        length: 0,
        phase: (context.generationState.phase === 'idle'
          ? 'program'
          : context.generationState.phase) as any,
      },
    ],
    fallbackUsed: false,
    strategyApplied: 'none',
    shouldRetry: context.attemptNumber < this.maxRetries,
  };
};

CodeGeneratorWarningRecovery.prototype.getAvailableStrategies = function (
  this: ICodeGeneratorWarningRecovery & { strategies: Map<DiagnosticCode, IRecoveryStrategy[]> },
  error: Error,
  context: IRecoveryContext
): IRecoveryStrategy[] {
  const allStrategies: IRecoveryStrategy[] = [];

  // Get strategies for all relevant diagnostic codes
  this.strategies.forEach((strategies) => {
    allStrategies.push(...strategies);
  });

  // Filter strategies that can handle this specific case
  return allStrategies.filter((strategy) => strategy.canRecover(error, context));
};

CodeGeneratorWarningRecovery.prototype.createFallbackOutput = function (
  this: ICodeGeneratorWarningRecovery,
  node: any,
  phase: string
): string {
  if (!node) return '';

  switch (phase) {
    case 'interface':
      return this.createFallbackInterface(node);
    case 'component':
      return this.createFallbackComponent(node);
    case 'jsx':
      return this.createFallbackJSX(node);
    case 'expression':
      return this.createFallbackExpression(node);
    case 'statement':
      return this.createFallbackStatement(node);
    case 'import':
      return this.createFallbackImport(node);
    default:
      return `/* Fallback generation for ${node.type || 'unknown'} */`;
  }
};

CodeGeneratorWarningRecovery.prototype.canGenerateWithFallback = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): boolean {
  if (!node) return false;

  // Check if we can generate minimal fallback for this node type
  const supportedTypes = [
    'InterfaceDeclaration',
    'FunctionDeclaration',
    'JSXElement',
    'JSXFragment',
    'Identifier',
    'Literal',
    'CallExpression',
    'MemberExpression',
  ];

  return supportedTypes.includes(node.type);
};

CodeGeneratorWarningRecovery.prototype.generateWarningForRecovery = function (
  this: ICodeGeneratorWarningRecovery,
  strategy: string,
  node: any
): CodeGeneratorDiagnostic {
  return {
    severity: DiagnosticSeverity.Warning,
    code: DiagnosticCode.ComponentGenerationFailed, // Generic recovery warning
    message: `Code generation recovered using strategy: ${strategy}`,
    line: node?.loc?.start?.line || 1,
    column: node?.loc?.start?.column || 1,
    length: 0,
    phase: 'program',
    suggestion: 'Review generated code for correctness',
    documentation: 'Generated code may not be optimal due to recovery from generation error',
  };
};

CodeGeneratorWarningRecovery.prototype.setMaxRetries = function (
  this: ICodeGeneratorWarningRecovery & { maxRetries: number },
  count: number
) {
  this.maxRetries = Math.max(0, Math.min(10, count)); // Clamp between 0-10
};

CodeGeneratorWarningRecovery.prototype.getRecoveryStatistics = function (
  this: ICodeGeneratorWarningRecovery & { statistics: RecoveryStatistics }
): RecoveryStatistics {
  return { ...this.statistics };
};

CodeGeneratorWarningRecovery.prototype.clearRecoveryStatistics = function (
  this: ICodeGeneratorWarningRecovery & { statistics: RecoveryStatistics }
) {
  this.statistics = {
    totalRecoveryAttempts: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    strategiesUsed: new Map(),
    fallbacksGenerated: 0,
    mostCommonFailures: [],
  };
};

// Fallback generation methods
CodeGeneratorWarningRecovery.prototype.createFallbackInterface = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  const name = node.name?.name || 'UnknownInterface';
  return `interface ${name} {\n  // Fallback interface - properties missing\n  [key: string]: any;\n}`;
};

CodeGeneratorWarningRecovery.prototype.createFallbackComponent = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  const name = node.name?.name || 'UnknownComponent';
  return `function ${name}(props: any): HTMLElement {\n  // Fallback component implementation\n  const element = document.createElement('div');\n  element.textContent = 'Component generation failed - fallback used';\n  return element;\n}`;
};

CodeGeneratorWarningRecovery.prototype.createFallbackJSX = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  const tagName = node.openingElement?.name?.name || 'div';
  return `<${tagName}>/* JSX generation failed - fallback */</${tagName}>`;
};

CodeGeneratorWarningRecovery.prototype.createFallbackExpression = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  switch (node.type) {
    case 'Identifier':
      return node.name || 'unknownIdentifier';
    case 'Literal':
      return JSON.stringify(node.value);
    case 'CallExpression':
      return 'unknownFunction()';
    case 'MemberExpression':
      return 'unknown.property';
    default:
      return 'null';
  }
};

CodeGeneratorWarningRecovery.prototype.createFallbackStatement = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  switch (node.type) {
    case 'VariableDeclaration':
      const kind = node.kind || 'let';
      const name = node.declarations?.[0]?.id?.name || 'unknown';
      return `${kind} ${name} = null; // Fallback variable declaration`;
    case 'ReturnStatement':
      return 'return null; // Fallback return';
    case 'ExpressionStatement':
      return 'null; // Fallback expression statement';
    default:
      return '/* Fallback statement */';
  }
};

CodeGeneratorWarningRecovery.prototype.createFallbackImport = function (
  this: ICodeGeneratorWarningRecovery,
  node: any
): string {
  return '// Fallback import - generation failed';
};

// Initialize default recovery strategies
CodeGeneratorWarningRecovery.prototype.initializeDefaultStrategies = function (
  this: ICodeGeneratorWarningRecovery & { registerStrategy: (strategy: IRecoveryStrategy) => void }
) {
  // Interface JSDoc Recovery Strategy
  this.registerStrategy({
    code: DiagnosticCode.InterfaceJSDocGeneration,
    description: 'interface-jsdoc-to-typescript',
    canRecover: (error, context) => {
      return context.node?.type === 'InterfaceDeclaration' && error.message.includes('JSDoc');
    },
    recover: (error, context) => {
      const node = context.node;
      if (!node || !node.name) {
        return {
          success: false,
          output: '',
          warningsGenerated: [],
          fallbackUsed: false,
          strategyApplied: '',
          shouldRetry: false,
        };
      }

      // Generate proper TypeScript interface
      const name = node.name.name;
      const parts = [`interface ${name} {`];

      if (node.body && node.body.properties) {
        for (const prop of node.body.properties) {
          const propName = prop.key?.name || 'unknown';
          const optional = prop.optional ? '?' : '';
          const typeStr = prop.typeAnnotation ? 'string' : 'any'; // Simplified type
          parts.push(`  ${propName}${optional}: ${typeStr};`);
        }
      }

      parts.push('}');

      return {
        success: true,
        output: parts.join('\n'),
        warningsGenerated: [
          {
            severity: DiagnosticSeverity.Warning,
            code: DiagnosticCode.InterfaceJSDocGeneration,
            message: 'Interface generation recovered from JSDoc to TypeScript syntax',
            line: context.generationState.lineNumber,
            column: context.generationState.columnNumber,
            length: 0,
            phase: 'interface',
          },
        ],
        fallbackUsed: false,
        strategyApplied: 'interface-jsdoc-to-typescript',
        shouldRetry: false,
      };
    },
  });

  // Component Return Type Recovery Strategy
  this.registerStrategy({
    code: DiagnosticCode.ComponentReturnTypeMissing,
    description: 'component-add-return-type',
    canRecover: (error, context) => {
      return context.node?.type === 'FunctionDeclaration' && error.message.includes('return type');
    },
    recover: (error, context) => {
      // This would modify the generation to add return type
      // For now, just indicate successful recovery
      return {
        success: true,
        output: context.previousOutput.replace(
          /function\s+(\w+)\s*\(/,
          'function $1(): HTMLElement ('
        ),
        warningsGenerated: [
          {
            severity: DiagnosticSeverity.Info,
            code: DiagnosticCode.ComponentReturnTypeMissing,
            message: 'Added missing return type annotation to component',
            line: context.generationState.lineNumber,
            column: context.generationState.columnNumber,
            length: 0,
            phase: 'component',
          },
        ],
        fallbackUsed: false,
        strategyApplied: 'component-add-return-type',
        shouldRetry: false,
      };
    },
  });

  // Memory Recovery Strategy
  this.registerStrategy({
    code: DiagnosticCode.MemoryUsageHigh,
    description: 'memory-cleanup-recovery',
    canRecover: (error, context) => {
      return (
        error.message.includes('memory') ||
        error.message.includes('heap') ||
        context.generationState.performanceMetrics.memoryUsage > 50 * 1024 * 1024
      );
    },
    recover: (error, context) => {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }

      return {
        success: true,
        output: context.previousOutput,
        warningsGenerated: [
          {
            severity: DiagnosticSeverity.Info,
            code: DiagnosticCode.MemoryUsageHigh,
            message: 'Memory cleanup performed during code generation',
            line: context.generationState.lineNumber,
            column: context.generationState.columnNumber,
            length: 0,
            phase: (context.generationState.phase === 'idle'
              ? 'program'
              : context.generationState.phase) as any,
          },
        ],
        fallbackUsed: false,
        strategyApplied: 'memory-cleanup-recovery',
        shouldRetry: true,
      };
    },
  });
};

/**
 * Create warning recovery instance
 */
export function createCodeGeneratorWarningRecovery(): ICodeGeneratorWarningRecovery {
  return new CodeGeneratorWarningRecovery();
}

/**
 * Recovery utilities
 */
export const RecoveryUtils = {
  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /type.*missing/i,
      /interface.*generation/i,
      /component.*return/i,
      /memory/i,
      /timeout/i,
      /syntax.*error/i,
    ];

    return recoverablePatterns.some((pattern) => pattern.test(error.message));
  },

  /**
   * Extract diagnostic code from error
   */
  extractDiagnosticCode(error: Error): DiagnosticCode | null {
    if (error.message.includes('interface')) return DiagnosticCode.InterfaceJSDocGeneration;
    if (error.message.includes('return type')) return DiagnosticCode.ComponentReturnTypeMissing;
    if (error.message.includes('memory')) return DiagnosticCode.MemoryUsageHigh;
    return null;
  },

  /**
   * Format recovery statistics
   */
  formatStatistics(stats: RecoveryStatistics): string {
    const successRate =
      stats.totalRecoveryAttempts > 0
        ? ((stats.successfulRecoveries / stats.totalRecoveryAttempts) * 100).toFixed(1)
        : '0';

    return `Recovery Statistics:
Total Attempts: ${stats.totalRecoveryAttempts}
Successful Recoveries: ${stats.successfulRecoveries}
Failed Recoveries: ${stats.failedRecoveries}  
Success Rate: ${successRate}%
Fallbacks Generated: ${stats.fallbacksGenerated}`;
  },
};
