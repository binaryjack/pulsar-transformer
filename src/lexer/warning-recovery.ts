/**
 * Warning System and Recovery Mode
 * Intelligent warnings and graceful error recovery capabilities
 */

import type { ILexer } from './lexer.types.js';
import { DiagnosticCode, DiagnosticCollector } from './diagnostics.js';
import { checkEdgeCase, isKnownUnsupported, suggestAlternative } from './edge-cases.js';

export enum RecoveryMode {
  Strict = 'strict',      // Throw on first error (current behavior)
  Collect = 'collect',    // Collect errors but continue
  Resilient = 'resilient' // Skip problematic tokens and continue
}

export interface LexerOptions {
  recoveryMode: RecoveryMode;
  maxErrors: number;
  enableWarnings: boolean;
  warningFilters: Set<DiagnosticCode>;
  performanceWarnings: boolean;
  enableStateTracking?: boolean;  // For development/debugging
  enableDebugger?: boolean;       // For advanced debugging
}

export const DEFAULT_LEXER_OPTIONS: LexerOptions = {
  recoveryMode: RecoveryMode.Strict,
  maxErrors: 100,
  enableWarnings: true,
  warningFilters: new Set(),
  performanceWarnings: false
};

export class WarningSystem {
  private diagnostics: DiagnosticCollector;
  private options: LexerOptions;
  private warningCounts: Map<DiagnosticCode, number> = new Map();
  
  constructor(diagnostics: DiagnosticCollector, options: LexerOptions) {
    this.diagnostics = diagnostics;
    this.options = options;
  }
  
  checkDeprecatedSyntax(lexer: ILexer, pattern: string, value: string): void {
    if (!this.options.enableWarnings) return;
    
    // Octal literal check
    if (/^0[0-7]+$/.test(value) && !value.startsWith('0o')) {
      this.addWarning(
        DiagnosticCode.DeprecatedOctalLiteral,
        `Deprecated octal literal "${value}". Use "0o${value.slice(1)}" instead`,
        lexer.line,
        lexer.column,
        value.length,
        `Replace with 0o${value.slice(1)}`
      );
    }
    
    // Legacy function declarations in blocks (simplified check)
    if (pattern.includes('if') && pattern.includes('function')) {
      this.addWarning(
        DiagnosticCode.LegacySyntax,
        'Function declaration inside block. Consider using const fn = () => {}',
        lexer.line,
        lexer.column
      );
    }
  }
  
  checkAmbiguousPatterns(lexer: ILexer, context: string, char: string): void {
    if (!this.options.enableWarnings) return;
    
    // Regex vs division ambiguity
    if (char === '/' && context.includes('/')) {
      const beforeSlash = context.slice(context.lastIndexOf('/') - 10, context.lastIndexOf('/'));
      if (/\w$/.test(beforeSlash.trim())) {
        this.addWarning(
          DiagnosticCode.AmbiguousRegexDivision,
          'Potentially ambiguous regex/division pattern. Consider parentheses for clarity',
          lexer.line,
          lexer.column
        );
      }
    }
    
    // Unusual spacing in comments
    if (context.includes('/*') && context.includes('*/')) {
      const comment = context.slice(context.indexOf('/*'), context.indexOf('*/') + 2);
      if (comment === '/**/' || comment.includes('/**/')) {
        this.addWarning(
          DiagnosticCode.AmbiguousOperatorSpacing,
          'Empty or minimal comment spacing may be confusing. Consider /* comment */',
          lexer.line,
          lexer.column
        );
      }
    }
  }
  
  checkPerformanceConcerns(lexer: ILexer, type: string, value: string): void {
    if (!this.options.performanceWarnings) return;
    
    // Large string literals
    if (type === 'STRING' && value.length > 10000) {
      this.addWarning(
        DiagnosticCode.LargeNumericLiteral,
        `Large string literal (${value.length} chars). Consider external file or chunking`,
        lexer.line,
        lexer.column,
        undefined,
        'Move large content to external files'
      );
    }
    
    // Very large numbers
    if (type === 'NUMBER') {
      const num = parseFloat(value.replace(/_/g, ''));
      if (num > Number.MAX_SAFE_INTEGER) {
        this.addWarning(
          DiagnosticCode.LargeNumericLiteral,
          `Number exceeds MAX_SAFE_INTEGER. Consider using BigInt (${value}n)`,
          lexer.line,
          lexer.column,
          value.length,
          `Use ${value}n for BigInt`
        );
      }
    }
  }
  
  checkDepthWarnings(lexer: ILexer): void {
    if (!this.options.enableWarnings) return;
    
    // Deep JSX nesting
    if (lexer.jsxDepth > 20) {
      // Only warn every 10 levels to avoid spam
      if (lexer.jsxDepth % 10 === 0) {
        this.addWarning(
          DiagnosticCode.DeepJSXNesting,
          `Deep JSX nesting (depth ${lexer.jsxDepth}). Consider component extraction`,
          lexer.line,
          lexer.column,
          undefined,
          'Extract nested components into separate functions'
        );
      }
    }
    
    // Deep template nesting
    if (lexer.templateDepth > 10) {
      if (lexer.templateDepth % 5 === 0) {
        this.addWarning(
          DiagnosticCode.DeepTemplateNesting,
          `Deep template literal nesting (depth ${lexer.templateDepth}). Consider variable extraction`,
          lexer.line,
          lexer.column,
          undefined,
          'Extract complex expressions to variables'
        );
      }
    }
  }
  
  checkUnsupportedFeatures(lexer: ILexer, char: string, context: string): boolean {
    const edgeCase = isKnownUnsupported(char, context);
    
    if (edgeCase) {
      // Add error with detailed explanation
      this.diagnostics.addError(
        DiagnosticCode.UnexpectedCharacter,
        `${edgeCase.description}: "${char}" is not supported`,
        lexer.line,
        lexer.column,
        1,
        edgeCase.workaround
      );
      return true; // Indicates unsupported
    }
    
    // Check for patterns
    const pattern = context + char;
    const edgeCases = checkEdgeCase(pattern);
    
    for (const ec of edgeCases) {
      if (ec.type === 'unsupported') {
        this.diagnostics.addError(
          DiagnosticCode.UnexpectedCharacter,
          `${ec.description} is not supported`,
          lexer.line,
          lexer.column,
          pattern.length,
          ec.workaround
        );
        return true;
      }
    }
    
    return false;
  }
  
  private addWarning(
    code: DiagnosticCode,
    message: string,
    line: number,
    column: number,
    length?: number,
    suggestion?: string
  ): void {
    // Check if this warning type is filtered out
    if (this.options.warningFilters.has(code)) {
      return;
    }
    
    // Throttle repeated warnings
    const count = this.warningCounts.get(code) || 0;
    if (count > 10) {
      return; // Stop spamming after 10 occurrences
    }
    
    this.warningCounts.set(code, count + 1);
    
    // Add throttling notice for repeated warnings
    if (count === 10) {
      this.diagnostics.addInfo(
        DiagnosticCode.PerformanceNote,
        `Warning ${code} occurred ${count} times. Further occurrences will be suppressed`,
        line,
        column
      );
      return;
    }
    
    this.diagnostics.addWarning(
      code,
      message,
      line,
      column,
      length,
      suggestion
    );
  }
}

export class RecoveryController {
  private options: LexerOptions;
  private diagnostics: DiagnosticCollector;
  private recoveryAttempts: number = 0;
  
  constructor(options: LexerOptions, diagnostics: DiagnosticCollector) {
    this.options = options;
    this.diagnostics = diagnostics;
  }
  
  shouldContinueOnError(error: Error): boolean {
    // In strict mode, always throw
    if (this.options.recoveryMode === RecoveryMode.Strict) {
      return false;
    }
    
    // Check error limits
    if (this.diagnostics.getErrorCount() >= this.options.maxErrors) {
      this.diagnostics.addError(
        DiagnosticCode.UnexpectedCharacter,
        `Maximum error limit (${this.options.maxErrors}) reached. Stopping tokenization`,
        0,
        0,
        undefined,
        'Fix existing errors and retry'
      );
      return false;
    }
    
    this.recoveryAttempts++;
    
    // Prevent infinite recovery loops
    if (this.recoveryAttempts > 50) {
      this.diagnostics.addError(
        DiagnosticCode.UnexpectedCharacter,
        'Too many recovery attempts. Possible infinite loop detected',
        0,
        0
      );
      return false;
    }
    
    return true;
  }
  
  recoverFromError(lexer: ILexer, error: Error): boolean {
    try {
      if (this.options.recoveryMode === RecoveryMode.Collect) {
        // Just record error and skip the problematic character
        return this.skipCharacterRecovery(lexer, error);
      } else if (this.options.recoveryMode === RecoveryMode.Resilient) {
        // Try more sophisticated recovery
        return this.smartRecovery(lexer, error);
      }
      
      return false;
    } catch (recoveryError) {
      // Recovery itself failed
      this.diagnostics.addError(
        DiagnosticCode.UnexpectedCharacter,
        `Recovery failed: ${(recoveryError as Error).message}`,
        lexer.line,
        lexer.column
      );
      return false;
    }
  }
  
  private skipCharacterRecovery(lexer: ILexer, error: Error): boolean {
    // Add error token and skip the problematic character
    lexer.addToken('ERROR' as any, lexer.source[lexer.pos] || '');
    
    if (lexer.pos < lexer.source.length) {
      lexer.advance(); // Skip the problematic character
      return true;
    }
    
    return false;
  }
  
  private smartRecovery(lexer: ILexer, error: Error): boolean {
    const char = lexer.source[lexer.pos];
    
    // Try to identify what kind of error this is and recover appropriately
    if (error.message.includes('Unterminated string')) {
      return this.recoverFromUnterminatedString(lexer);
    } else if (error.message.includes('Unterminated regex')) {
      return this.recoverFromUnterminatedRegex(lexer);
    } else if (error.message.includes('Unterminated template')) {
      return this.recoverFromUnterminatedTemplate(lexer);
    } else if (error.message.includes('Unexpected character')) {
      return this.recoverFromUnexpectedCharacter(lexer, char);
    }
    
    // Fallback to simple character skip
    return this.skipCharacterRecovery(lexer, error);
  }
  
  private recoverFromUnterminatedString(lexer: ILexer): boolean {
    // Look for the next quote or end of line
    const quote = lexer.source[lexer.pos - 1]; // The opening quote we failed to close
    let pos = lexer.pos;
    
    while (pos < lexer.source.length) {
      const char = lexer.source[pos];
      if (char === quote || char === '\n') {
        // Found potential end
        lexer.pos = pos + (char === quote ? 1 : 0);
        return true;
      }
      pos++;
    }
    
    // Couldn't find end, skip to end of line
    while (lexer.pos < lexer.source.length && lexer.source[lexer.pos] !== '\n') {
      lexer.advance();
    }
    
    return lexer.pos < lexer.source.length;
  }
  
  private recoverFromUnterminatedRegex(lexer: ILexer): boolean {
    // Look for the next / that could close the regex
    let pos = lexer.pos;
    
    while (pos < lexer.source.length) {
      const char = lexer.source[pos];
      if (char === '/' && lexer.source[pos - 1] !== '\\') {
        lexer.pos = pos + 1;
        return true;
      }
      if (char === '\n') {
        // Regex can't span lines, give up
        lexer.pos = pos;
        return true;
      }
      pos++;
    }
    
    return false;
  }
  
  private recoverFromUnterminatedTemplate(lexer: ILexer): boolean {
    // Look for the next backtick
    let pos = lexer.pos;
    
    while (pos < lexer.source.length) {
      const char = lexer.source[pos];
      if (char === '`') {
        lexer.pos = pos + 1;
        lexer.templateDepth = Math.max(0, lexer.templateDepth - 1);
        return true;
      }
      pos++;
    }
    
    return false;
  }
  
  private recoverFromUnexpectedCharacter(lexer: ILexer, char: string): boolean {
    // Check if this might be part of a known unsupported feature
    const suggestion = suggestAlternative(lexer.source.slice(lexer.pos - 5, lexer.pos + 5));
    
    if (suggestion) {
      this.diagnostics.addInfo(
        DiagnosticCode.PerformanceNote,
        `Recovery suggestion: ${suggestion}`,
        lexer.line,
        lexer.column
      );
    }
    
    // Skip the unexpected character
    return this.skipCharacterRecovery(lexer, new Error(`Unexpected character: ${char}`));
  }
  
  getRecoveryStats(): { attempts: number; errors: number } {
    return {
      attempts: this.recoveryAttempts,
      errors: this.diagnostics.getErrorCount()
    };
  }
}