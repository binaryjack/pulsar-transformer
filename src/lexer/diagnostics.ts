/**
 * Lexer Diagnostic System
 * Pattern: TypeScript Compiler diagnostics for structured error reporting
 */

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Info = 2
}

export enum DiagnosticCode {
  // Errors (LEX0xx)
  UnexpectedCharacter = 'LEX001',
  UnterminatedString = 'LEX002',
  UnterminatedRegex = 'LEX003',
  UnterminatedTemplate = 'LEX004',
  InvalidNumericSeparator = 'LEX005',
  InvalidBigInt = 'LEX006',
  InvalidEscapeSequence = 'LEX007',
  InvalidHexEscape = 'LEX008',
  InvalidUnicodeEscape = 'LEX009',
  MalformedNumber = 'LEX010',
  
  // Warnings (LEX1xx)
  DeprecatedOctalLiteral = 'LEX101',
  AmbiguousRegexDivision = 'LEX102',
  UnusualCharacterSequence = 'LEX103',
  DeepJSXNesting = 'LEX104',
  DeepTemplateNesting = 'LEX105',
  LargeNumericLiteral = 'LEX106',
  SuspiciousRegexPattern = 'LEX107',
  PotentiallyMissingEscape = 'LEX108',
  AmbiguousOperatorSpacing = 'LEX109',
  LegacySyntax = 'LEX110',
  
  // Info (LEX2xx)
  LargeFile = 'LEX201',
  ComplexTemplateExpression = 'LEX202',
  HighTokenCount = 'LEX203',
  UnicodeContent = 'LEX204',
  PerformanceNote = 'LEX205'
}

export interface LexerDiagnostic {
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  line: number;
  column: number;
  length?: number;
  suggestion?: string;
  relatedInformation?: {
    line: number;
    column: number;
    message: string;
  }[];
}

export class DiagnosticCollector {
  private diagnostics: LexerDiagnostic[] = [];
  private maxDiagnostics: number;
  
  constructor(maxDiagnostics: number = 100) {
    this.maxDiagnostics = maxDiagnostics;
  }
  
  addError(
    code: DiagnosticCode,
    message: string,
    line: number,
    column: number,
    length?: number,
    suggestion?: string
  ): void {
    this.add({
      severity: DiagnosticSeverity.Error,
      code,
      message,
      line,
      column,
      length,
      suggestion
    });
  }
  
  addWarning(
    code: DiagnosticCode,
    message: string,
    line: number,
    column: number,
    length?: number,
    suggestion?: string
  ): void {
    this.add({
      severity: DiagnosticSeverity.Warning,
      code,
      message,
      line,
      column,
      length,
      suggestion
    });
  }
  
  addInfo(
    code: DiagnosticCode,
    message: string,
    line: number,
    column: number,
    length?: number
  ): void {
    this.add({
      severity: DiagnosticSeverity.Info,
      code,
      message,
      line,
      column,
      length
    });
  }
  
  private add(diagnostic: LexerDiagnostic): void {
    if (this.diagnostics.length >= this.maxDiagnostics) {
      // Replace with overflow warning
      const overflow = this.diagnostics.find(d => d.code === DiagnosticCode.HighTokenCount);
      if (!overflow) {
        this.diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          code: DiagnosticCode.HighTokenCount,
          message: `Too many diagnostics (>${this.maxDiagnostics}). Some issues may not be reported.`,
          line: diagnostic.line,
          column: diagnostic.column
        });
      }
      return;
    }
    
    this.diagnostics.push(diagnostic);
  }
  
  hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === DiagnosticSeverity.Error);
  }
  
  hasWarnings(): boolean {
    return this.diagnostics.some(d => d.severity === DiagnosticSeverity.Warning);
  }
  
  getErrorCount(): number {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error).length;
  }
  
  getWarningCount(): number {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Warning).length;
  }
  
  getDiagnostics(): LexerDiagnostic[] {
    return [...this.diagnostics];
  }
  
  getErrors(): LexerDiagnostic[] {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
  }
  
  getWarnings(): LexerDiagnostic[] {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Warning);
  }
  
  getInfo(): LexerDiagnostic[] {
    return this.diagnostics.filter(d => d.severity === DiagnosticSeverity.Info);
  }
  
  clear(): void {
    this.diagnostics = [];
  }
  
  /**
   * Format diagnostics for console output
   */
  format(): string {
    if (this.diagnostics.length === 0) {
      return '✅ No diagnostics';
    }
    
    const lines: string[] = [];
    const errorCount = this.getErrorCount();
    const warningCount = this.getWarningCount();
    
    lines.push(`\n📊 Diagnostics: ${errorCount} errors, ${warningCount} warnings\n`);
    
    // Group by severity
    const errors = this.getErrors();
    const warnings = this.getWarnings();
    const infos = this.getInfo();
    
    if (errors.length > 0) {
      lines.push('❌ ERRORS:');
      errors.forEach(d => {
        lines.push(`  ${d.code}: ${d.message} (${d.line}:${d.column})`);
        if (d.suggestion) {
          lines.push(`    💡 ${d.suggestion}`);
        }
      });
    }
    
    if (warnings.length > 0) {
      lines.push('\n⚠️ WARNINGS:');
      warnings.forEach(d => {
        lines.push(`  ${d.code}: ${d.message} (${d.line}:${d.column})`);
        if (d.suggestion) {
          lines.push(`    💡 ${d.suggestion}`);
        }
      });
    }
    
    if (infos.length > 0) {
      lines.push('\nℹ️ INFO:');
      infos.forEach(d => {
        lines.push(`  ${d.code}: ${d.message} (${d.line}:${d.column})`);
      });
    }
    
    return lines.join('\n');
  }
}

/**
 * LSP-compatible diagnostic format
 */
export interface LSPDiagnostic {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  severity: 1 | 2 | 3 | 4; // Error, Warning, Info, Hint
  code: string;
  source: string;
  message: string;
}

/**
 * Convert lexer diagnostics to LSP format for IDE integration
 */
export function toLSPDiagnostics(diagnostics: LexerDiagnostic[]): LSPDiagnostic[] {
  return diagnostics.map(d => ({
    range: {
      start: { line: d.line - 1, character: d.column - 1 }, // LSP is 0-indexed
      end: { 
        line: d.line - 1, 
        character: (d.column - 1) + (d.length || 1)
      }
    },
    severity: d.severity === DiagnosticSeverity.Error ? 1 :
              d.severity === DiagnosticSeverity.Warning ? 2 : 3,
    code: d.code,
    source: 'pulsar-lexer',
    message: d.message + (d.suggestion ? ` (💡 ${d.suggestion})` : '')
  }));
}