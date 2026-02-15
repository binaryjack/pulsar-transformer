/**
 * Lexer.prototype.scanTokens
 * Main entry point - scans all tokens from source with full diagnostic support
 */

import { Lexer } from '../lexer.js';
import type { ILexer, IToken } from '../lexer.types.js';
import { DiagnosticCode, DiagnosticSeverity } from '../diagnostics.js';
import { RecoveryMode } from '../warning-recovery.js';

Lexer.prototype.scanTokens = function (this: ILexer): IToken[] {
  this.tokens = [];

  // Start performance tracking
  if (this.debugger) {
    this.debugger.startTiming();
  }

  // Check for large files
  if (this.source.length > 1000000 && this.diagnostics) {
    // 1MB
    this.diagnostics.addInfo(
      DiagnosticCode.LargeFile,
      `Large file detected (${Math.round(this.source.length / 1024)}KB). Lexing may take longer`,
      1,
      1
    );
  }

  // CRITICAL: Infinite loop protection with enhanced diagnostics
  const MAX_ITERATIONS = 50000; // Reasonable limit
  let iterations = 0;
  let lastPosition = -1;
  let positionNotAdvancingCount = 0;

  while (!this.isAtEnd()) {
    // Check iteration limit
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      const message = `Lexer infinite loop detected - breaking after ${MAX_ITERATIONS} iterations`;

      if (this.diagnostics) {
        this.diagnostics.addError(
          DiagnosticCode.UnexpectedCharacter,
          message,
          this.line,
          this.column,
          undefined,
          'Check for malformed input or report this as a bug'
        );
      }

      console.error(`🚨 ${message}`);
      console.error(`Current position: ${this.pos}, Source length: ${this.source.length}`);
      console.error(
        `Last 10 chars: "${this.source.slice(Math.max(0, this.pos - 5), this.pos + 5)}"`
      );
      break;
    }

    // Check if position is advancing
    const currentPosition = this.pos;
    if (currentPosition === lastPosition) {
      positionNotAdvancingCount++;
      if (positionNotAdvancingCount > 5) {
        const message = `Lexer stuck - position ${this.pos} not advancing for 5+ iterations`;
        const char = this.source[this.pos];
        const charCode = char ? char.charCodeAt(0) : -1;

        if (this.diagnostics) {
          this.diagnostics.addError(
            DiagnosticCode.UnexpectedCharacter,
            `${message}. Character: "${char}" (code: ${charCode})`,
            this.line,
            this.column,
            undefined,
            'This may indicate a lexer bug or malformed input'
          );
        }

        console.error(`🚨 ${message}`);
        console.error(`Character at position: "${char}" (code: ${charCode})`);

        // Force advance to break the loop only in recovery mode
        if (this.options.recoveryMode !== RecoveryMode.Strict) {
          this.pos++;
        }
        positionNotAdvancingCount = 0;
      }
    } else {
      positionNotAdvancingCount = 0;
      lastPosition = currentPosition;
    }

    try {
      const tokenStart = performance.now();
      this.scanToken();

      // Record token timing for performance analysis
      if (this.debugger) {
        this.debugger.recordTokenTiming(this.tokens.length - 1, tokenStart);

        // Track peak depths
        this.debugger.updatePeakDepths(this.jsxDepth, this.templateDepth, this.expressionDepth);

        // Record slow tokens (>1ms)
        const tokenTime = performance.now() - tokenStart;
        if (tokenTime > 1) {
          const lastToken = this.tokens[this.tokens.length - 1];
          if (lastToken) {
            this.debugger.recordSlowToken(
              lastToken.type,
              lastToken.value,
              tokenTime,
              currentPosition
            );
          }
        }
      }

      // Check for warnings on the new token
      if (this.warningSystem && this.tokens.length > 0) {
        const lastToken = this.tokens[this.tokens.length - 1];
        this.warningSystem.checkPerformanceConcerns(this, lastToken.type, lastToken.value);
        this.warningSystem.checkDepthWarnings(this);
      }
    } catch (error) {
      const errorMessage = `Lexer error at position ${this.pos}: ${(error as Error).message}`;

      if (this.diagnostics) {
        // Error already added to diagnostics in scanToken, just update performance data
        if (this.debugger) {
          (this.debugger as any).performanceData.errorCount++;
        }
      } else {
        console.error(`🚨 ${errorMessage}`, error);
      }

      // Try recovery
      if (this.recoveryController?.shouldContinueOnError(error as Error)) {
        const recovered = this.recoveryController.recoverFromError(this, error as Error);
        if (!recovered) {
          break; // Recovery failed, stop tokenization
        }
      } else {
        // Re-throw in strict mode or skip character in development
        if (this.options.recoveryMode === RecoveryMode.Strict) {
          throw error;
        } else {
          // Skip problematic character and continue
          this.pos++;
          continue;
        }
      }
    }

    // Safety check to prevent infinite loops
    if (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type === 'EOF') {
      break;
    }

    // Additional safety: if we have too many tokens, something is wrong
    if (this.tokens.length > MAX_ITERATIONS) {
      console.error(`🚨 TOO MANY TOKENS - Breaking at ${this.tokens.length} tokens`);
      break;
    }
  }

  // Ensure EOF token at end
  if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== 'EOF') {
    this.addToken('EOF' as any);
  }

  // Performance and diagnostic reporting
  if (this.debugger) {
    this.debugger.endTiming();
    (this.debugger as any).performanceData.totalTokens = this.tokens.length;

    if (this.options.performanceWarnings && this.diagnostics) {
      const report = this.debugger.getPerformanceReport();
      if (report.includes('tokens/second')) {
        console.log(report);
      }
    }
  }

  // Final diagnostic summary
  if (this.diagnostics && this.diagnostics.getDiagnostics().length > 0) {
    const errorCount = this.diagnostics.getErrorCount();
    const warningCount = this.diagnostics.getWarningCount();

    if (errorCount > 0 || warningCount > 0) {
      console.log(this.diagnostics.format());
    }
  }

  // Success message
  const message = `✅ Lexer completed: ${this.tokens.length} tokens in ${iterations} iterations`;

  if (this.diagnostics && this.diagnostics.hasErrors()) {
    console.log(`⚠️ ${message} (with errors)`);
  } else if (this.diagnostics && this.diagnostics.hasWarnings()) {
    console.log(`🟡 ${message} (with warnings)`);
  } else {
    console.log(message);
  }
  return this.tokens;
};

/**
 * Enhanced tokenization with full diagnostic output
 */
Lexer.prototype.scanTokensWithDiagnostics = function (this: ILexer) {
  const tokens = this.scanTokens();

  return {
    tokens,
    diagnostics: this.diagnostics ? this.diagnostics.getDiagnostics() : [],
    hasErrors: this.diagnostics ? this.diagnostics.hasErrors() : false,
    hasWarnings: this.diagnostics ? this.diagnostics.hasWarnings() : false,
    performance: this.debugger ? this.debugger.getPerformanceReport() : null,
    stateTransitions: this.stateTracker ? this.stateTracker.getTransitions() : [],
  };
};
