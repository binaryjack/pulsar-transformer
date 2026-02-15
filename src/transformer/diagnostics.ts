/**
 * Transformer Diagnostics - Enterprise-grade diagnostic collection
 * Similar to lexer diagnostics but focused on AST transformation issues
 */

export interface ITransformerDiagnostic {
  code: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  phase: 'component' | 'jsx' | 'import' | 'expression' | 'statement';
  message: string;
  node?: any;
  location?: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
  suggestion?: string;
  documentation?: string;
}

/**
 * Diagnostic codes for transformer issues
 */
export const TRANSFORMER_DIAGNOSTIC_CODES = {
  // Component transformation
  TRF001: 'Component declaration transformation failed',
  TRF002: 'Component parameter preservation failed',
  TRF003: 'Component export status lost',
  TRF004: 'Registry wrapper generation failed',
  TRF005: 'Component return type missing',

  // JSX transformation
  TRF101: 'JSX element transformation failed',
  TRF102: 'JSX attribute processing failed',
  TRF103: 'JSX children processing failed',
  TRF104: 'JSX expression extraction failed',
  TRF105: 'JSX text node processing failed',

  // Import management
  TRF201: 'Framework import injection failed',
  TRF202: 'Import dependency tracking failed',
  TRF203: 'Duplicate import detected',
  TRF204: 'Missing required import',
  TRF205: 'Import ordering violation',

  // Expression transformation
  TRF301: 'Expression transformation failed',
  TRF302: 'Call expression transformation failed',
  TRF303: 'Member expression transformation failed',
  TRF304: 'Arrow function transformation failed',
  TRF305: 'Binary expression transformation failed',

  // Statement transformation
  TRF401: 'Statement transformation failed',
  TRF402: 'Block statement transformation failed',
  TRF403: 'Return statement transformation failed',
  TRF404: 'Variable declaration transformation failed',
  TRF405: 'Export declaration transformation failed',

  // AST structural issues
  TRF501: 'AST node structure invalid',
  TRF502: 'AST traversal failed',
  TRF503: 'AST modification failed',
  TRF504: 'AST validation failed',
  TRF505: 'AST serialization failed',
} as const;

/**
 * Transformer diagnostic collector with structured error reporting
 */
export class TransformerDiagnosticCollector {
  private diagnostics: ITransformerDiagnostic[] = [];
  private context: {
    sourceFile: string;
    phase: string;
    componentName?: string;
  };

  constructor(context: { sourceFile: string; phase?: string; componentName?: string }) {
    this.context = {
      sourceFile: context.sourceFile,
      phase: context.phase || 'unknown',
      componentName: context.componentName,
    };
  }

  /**
   * Add error diagnostic
   */
  addError(
    code: keyof typeof TRANSFORMER_DIAGNOSTIC_CODES,
    message: string,
    node?: any,
    suggestion?: string
  ): void {
    this.diagnostics.push({
      code,
      type: 'error',
      severity: this.getSeverity(code),
      phase: this.getPhase(code),
      message,
      node,
      location: node ? this.extractLocation(node) : undefined,
      suggestion,
      documentation: `https://docs.pulsar.dev/diagnostics/${code}`,
    });
  }

  /**
   * Add warning diagnostic
   */
  addWarning(
    code: keyof typeof TRANSFORMER_DIAGNOSTIC_CODES,
    message: string,
    node?: any,
    suggestion?: string
  ): void {
    this.diagnostics.push({
      code,
      type: 'warning',
      severity: this.getSeverity(code),
      phase: this.getPhase(code),
      message,
      node,
      location: node ? this.extractLocation(node) : undefined,
      suggestion,
      documentation: `https://docs.pulsar.dev/diagnostics/${code}`,
    });
  }

  /**
   * Add info diagnostic
   */
  addInfo(code: keyof typeof TRANSFORMER_DIAGNOSTIC_CODES, message: string, node?: any): void {
    this.diagnostics.push({
      code,
      type: 'info',
      severity: 'low',
      phase: this.getPhase(code),
      message,
      node,
      location: node ? this.extractLocation(node) : undefined,
    });
  }

  /**
   * Get all diagnostics
   */
  getDiagnostics(): ITransformerDiagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Get diagnostics by type
   */
  getDiagnosticsByType(type: 'error' | 'warning' | 'info'): ITransformerDiagnostic[] {
    return this.diagnostics.filter((d) => d.type === type);
  }

  /**
   * Get diagnostics by phase
   */
  getDiagnosticsByPhase(phase: ITransformerDiagnostic['phase']): ITransformerDiagnostic[] {
    return this.diagnostics.filter((d) => d.phase === phase);
  }

  /**
   * Has any errors
   */
  hasErrors(): boolean {
    return this.diagnostics.some((d) => d.type === 'error');
  }

  /**
   * Get diagnostic summary
   */
  getSummary(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    byPhase: Record<string, number>;
  } {
    const summary = {
      total: this.diagnostics.length,
      errors: 0,
      warnings: 0,
      info: 0,
      byPhase: {} as Record<string, number>,
    };

    this.diagnostics.forEach((d) => {
      if (d.type === 'error') summary.errors++;
      else if (d.type === 'warning') summary.warnings++;
      else if (d.type === 'info') summary.info++;

      summary.byPhase[d.phase] = (summary.byPhase[d.phase] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnostics = [];
  }

  /**
   * Get severity for diagnostic code
   */
  private getSeverity(code: string): ITransformerDiagnostic['severity'] {
    if (code.startsWith('TRF5') || code.endsWith('01')) return 'critical';
    if (code.startsWith('TRF1') || code.startsWith('TRF2')) return 'high';
    if (code.startsWith('TRF3')) return 'medium';
    return 'low';
  }

  /**
   * Get phase for diagnostic code
   */
  private getPhase(code: string): ITransformerDiagnostic['phase'] {
    if (code.startsWith('TRF0') || code.startsWith('TRF00')) return 'component';
    if (code.startsWith('TRF1')) return 'jsx';
    if (code.startsWith('TRF2')) return 'import';
    if (code.startsWith('TRF3')) return 'expression';
    if (code.startsWith('TRF4')) return 'statement';
    return 'component';
  }

  /**
   * Extract location information from AST node
   */
  private extractLocation(node: any): ITransformerDiagnostic['location'] | undefined {
    if (!node) return undefined;

    return {
      start: node.start || 0,
      end: node.end || 0,
      line: node.loc?.start?.line,
      column: node.loc?.start?.column,
    };
  }
}

/**
 * Global transformer diagnostic collector
 */
let globalDiagnosticCollector: TransformerDiagnosticCollector | null = null;

export function getTransformerDiagnostics(): TransformerDiagnosticCollector | null {
  return globalDiagnosticCollector;
}

export function initializeTransformerDiagnostics(context: {
  sourceFile: string;
  phase?: string;
  componentName?: string;
}): TransformerDiagnosticCollector {
  globalDiagnosticCollector = new TransformerDiagnosticCollector(context);
  return globalDiagnosticCollector;
}

export function clearTransformerDiagnostics(): void {
  globalDiagnosticCollector = null;
}
