/**
 * Lexer - PSR source code tokenizer
 * Pattern: Prototype-based class following TypeScript compiler architecture
 */

import type { ILexer } from './lexer.types.js';
import { LexerStateEnum } from './lexer.types.js';
import { initializeTokenHandlers } from './handlers/index.js';
import { DiagnosticCollector } from './diagnostics.js';
import { StateTransitionTracker } from './state-tracker.js';
import { LexerDebugger } from './debug-tools.js';
import { WarningSystem, RecoveryController, LexerOptions, DEFAULT_LEXER_OPTIONS } from './warning-recovery.js';

// Initialize token handlers once (module-level initialization)
let handlersInitialized = false;
if (!handlersInitialized) {
  initializeTokenHandlers();
  handlersInitialized = true;
}

/**
 * Lexer constructor with complete diagnostic and tracking systems
 * Converts PSR source code into token stream
 */
export function Lexer(this: ILexer, source: string, filePath: string = '<input>', options: Partial<LexerOptions> = {}): void {
  // Basic properties
  this.source = source;
  this.filePath = filePath;
  this.pos = 0;
  this.line = 1;
  this.column = 1;
  this.tokens = [];

  // Merge options with defaults
  this.options = { ...DEFAULT_LEXER_OPTIONS, ...options };

  // Initialize state machine
  this.state = LexerStateEnum.Normal;
  this.stateStack = [];
  this.jsxDepth = 0;
  this.expressionDepth = 0;
  this.parenthesesDepth = 0;
  this.justExitedJSXTextForBrace = false;
  this.templateDepth = 0;

  // Initialize diagnostic and tracking systems
  this.diagnostics = new DiagnosticCollector(this.options.maxErrors);
  
  // Optional systems (enabled based on options or debug mode)
  if (options.enableStateTracking || process.env.NODE_ENV === 'development') {
    this.stateTracker = new StateTransitionTracker();
  }
  
  if (options.enableDebugger || process.env.LEXER_DEBUG === 'true') {
    this.debugger = new LexerDebugger();
  }
  
  if (this.options.enableWarnings) {
    this.warningSystem = new WarningSystem(this.diagnostics, this.options);
  }
  
  if (this.options.recoveryMode !== 'strict') {
    this.recoveryController = new RecoveryController(this.options, this.diagnostics);
  }
}

// Assign prototype methods (defined in separate files)
Object.assign(Lexer.prototype, {
  // Core scanning (implemented in separate files)
  scanTokens: undefined,
  scanToken: undefined,

  // Character navigation
  advance: undefined,
  peek: undefined,
  match: undefined,
  isAtEnd: undefined,

  // Token creation
  addToken: undefined,

  // Specific scanners
  scanIdentifier: undefined,
  scanString: undefined,
  scanNumber: undefined,
  scanComment: undefined,
  scanJSXText: undefined,
  scanTemplate: undefined,
  scanRegex: undefined,

  // Helpers
  isKeyword: undefined,
  skipWhitespace: undefined,

  // State management
  pushState: undefined,
  popState: undefined,
  getState: undefined,
  isInJSX: undefined,

  // Diagnostic methods
  addDiagnostic: function(this: ILexer, code: string, message: string, line: number, column: number, suggestion?: string) {
    if ((this as any).diagnostics) {
      // Type conversion for compatibility
      (this as any).diagnostics.addError(code as any, message, line, column, undefined, suggestion);
    }
  },
  
  getDiagnostics: function(this: ILexer): any[] {
    return (this as any).diagnostics ? (this as any).diagnostics.getDiagnostics() : [];
  },
  
  hasErrors: function(this: ILexer): boolean {
    return (this as any).diagnostics ? (this as any).diagnostics.hasErrors() : false;
  },

  // Debug methods
  captureSnapshot: function(this: ILexer, label?: string) {
    return (this as any).debugger ? (this as any).debugger.captureSnapshot(this, label || 'default') : null;
  },
  
  getDebugInfo: function(this: ILexer) {
    return {
      position: this.pos,
      line: this.line,
      column: this.column,
      state: this.state,
      depths: {
        jsx: this.jsxDepth,
        template: this.templateDepth,
        expression: this.expressionDepth
      },
      diagnostics: this.getDiagnostics(),
      performance: (this as any).debugger ? (this as any).debugger.getPerformanceReport() : null
    };
  }
});

// Export type-safe constructor with options
export const createLexer = (source: string, filePath: string = '<input>', options: Partial<LexerOptions> = {}): ILexer => {
  return new (Lexer as any)(source, filePath, options) as ILexer;
};
