/**
 * Lexer.prototype.scanToken
 * Main token scanning dispatcher - delegates to specific handlers
 *
 * REFACTORED: From 400-line monolithic switch to handler registry pattern
 * ENHANCED: With diagnostic system and edge case detection
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum, isAlpha, isDigit } from '../lexer.types.js';
import { getHandler } from '../handlers/handler-registry.js';
import { DiagnosticCode } from '../diagnostics.js';
import { isKnownUnsupported, suggestAlternative } from '../edge-cases.js';

Lexer.prototype.scanToken = function (this: ILexer): void {
  // Check state BEFORE skipping whitespace (JSX needs to preserve it)
  const currentState = this.getState();

  // Handle JSX text content (including whitespace)
  if (currentState === LexerStateEnum.InsideJSXText) {
    this.scanJSXText();
    return;
  }

  // InsideJSXExpression behaves like Normal - parse regular JS
  // The difference is we're tracking when to return to JSX context

  // Skip whitespace for normal code (but not JSX)
  this.skipWhitespace();

  if (this.isAtEnd()) {
    this.addToken(TokenTypeEnum.EOF);
    return;
  }

  const char = this.peek();

  // Identifiers and keywords
  if (isAlpha(char)) {
    this.scanIdentifier();
    return;
  }

  // Numbers
  if (isDigit(char)) {
    this.scanNumber();
    return;
  }

  // Advance for single-char tokens
  this.advance();

  // SAFETY CHECK: Quotes in JSX content
  // If we have jsxDepth > 0 but state is NOT InsideJSXText,
  // we're in a JSX attribute or expression where quotes ARE string delimiters
  // Only protect quotes that appear in JSX TEXT content
  if (
    (char === '"' || char === "'") &&
    this.jsxDepth > 0 &&
    currentState === LexerStateEnum.Normal
  ) {
    // Edge case: Quote appeared between JSX tags but state wasn't properly set
    // This should rarely happen with correct state management
    this.pos--;
    this.column--;
    this.pushState(LexerStateEnum.InsideJSXText);
    this.scanJSXText();
    return;
  }

  // Look up handler for this character
  const handler = getHandler(char);
  if (handler) {
    handler(this, char);
    return;
  }

  // No handler found - enhanced error handling with diagnostic system
  const charCode = char.charCodeAt(0);
  const isHighUnicode = charCode > 127;

  // Check for known unsupported features first
  if (this.warningSystem) {
    const isUnsupported = this.warningSystem.checkUnsupportedFeatures(
      this,
      char,
      this.source.slice(Math.max(0, this.pos - 10), this.pos)
    );
    if (
      isUnsupported &&
      this.recoveryController?.shouldContinueOnError(new Error('Unsupported feature'))
    ) {
      this.recoveryController.recoverFromError(this, new Error('Unsupported feature'));
      return;
    }
  }

  if (isHighUnicode) {
    // Unicode can appear in multiple contexts:
    // 1. JSX text content: <div>Hello 世界</div>
    // 2. String literals: handled by string scanners
    // 3. Comments: handled by comment scanners
    // 4. Identifiers: const café = 1; (ES6+ allows Unicode in identifiers)

    // JSX text context
    if (this.jsxDepth > 0 && currentState !== LexerStateEnum.InsideJSX) {
      this.pos--;
      this.column--;
      this.pushState(LexerStateEnum.InsideJSXText);
      this.scanJSXText();
      return;
    }

    // Unicode identifier context - check if Unicode letter/mark
    const isUnicodeIdStart = /[\p{L}\p{Nl}]/u.test(char);
    const isUnicodeIdContinue = /[\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}]/u.test(char);

    if (isUnicodeIdStart || (this.pos > 0 && isUnicodeIdContinue)) {
      // Valid Unicode identifier - scan as identifier
      this.pos--;
      this.column--;
      this.scanIdentifier();
      return;
    }

    // For other Unicode in JSX contexts (even outside text), treat as JSX text
    if (this.jsxDepth > 0) {
      this.pos--;
      this.column--;
      this.pushState(LexerStateEnum.InsideJSXText);
      this.scanJSXText();
      return;
    }

    // Check if this is a known Unicode limitation ONLY after valid contexts checked
    const edgeCase = isKnownUnsupported(char, 'identifier');
    if (edgeCase) {
      const error = new Error(
        `${edgeCase.description} at line ${this.line}, column ${this.column}`
      );

      if (this.diagnostics) {
        this.diagnostics.addError(
          DiagnosticCode.UnexpectedCharacter,
          `${edgeCase.description}: character '${char}' (U+${charCode.toString(16).toUpperCase().padStart(4, '0')})`,
          this.line,
          this.column,
          1,
          edgeCase.workaround
        );
      }

      // Try recovery if enabled
      if (this.recoveryController?.shouldContinueOnError(error)) {
        this.recoveryController.recoverFromError(this, error);
        return;
      }

      throw error;
    }
  }

  // Enhanced error message with diagnostic system
  const hexCode = charCode.toString(16).toUpperCase().padStart(4, '0');
  const suggestion = suggestAlternative(this.source.slice(Math.max(0, this.pos - 5), this.pos + 5));

  const errorMessage = `Unexpected character '${char}' (U+${hexCode}) at line ${this.line}, column ${this.column}`;
  const error = new Error(errorMessage);

  // Add to diagnostics
  if (this.diagnostics) {
    this.diagnostics.addError(
      DiagnosticCode.UnexpectedCharacter,
      errorMessage,
      this.line,
      this.column,
      1,
      suggestion
    );
  }

  // Try recovery if enabled
  if (this.recoveryController?.shouldContinueOnError(error)) {
    this.recoveryController.recoverFromError(this, error);
    return;
  }

  throw error;
};
