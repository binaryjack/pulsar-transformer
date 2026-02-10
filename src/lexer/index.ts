/**
 * Lexer module exports
 * Aggregates all prototype methods and exports lexer
 */

// Import all prototype methods to register them
import './prototypes/add-token';
import './prototypes/advance';
import './prototypes/is-at-end';
import './prototypes/is-keyword';
import './prototypes/match';
import './prototypes/peek';
import './prototypes/scan-comment';
import './prototypes/scan-identifier';
import './prototypes/scan-number';
import './prototypes/scan-string';
import './prototypes/scan-token';
import './prototypes/scan-tokens';
import './prototypes/skip-whitespace';

// Export lexer constructor and types
export { Lexer, createLexer } from './lexer.js';
export { KEYWORDS, TokenTypeEnum } from './lexer.types.js';
export type { ILexer, ISourcePosition, IToken } from './lexer.types.js';
