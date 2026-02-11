/**
 * Lexer module exports
 * Aggregates all prototype methods and exports lexer
 */

// Import all prototype methods to register them
import './prototypes/add-token.js';
import './prototypes/advance.js';
import './prototypes/get-state.js';
import './prototypes/is-at-end.js';
import './prototypes/is-in-jsx.js';
import './prototypes/is-keyword.js';
import './prototypes/match.js';
import './prototypes/peek.js';
import './prototypes/pop-state.js';
import './prototypes/push-state.js';
import './prototypes/scan-comment.js';
import './prototypes/scan-identifier.js';
import './prototypes/scan-jsx-text.js';
import './prototypes/scan-number.js';
import './prototypes/scan-string.js';
import './prototypes/scan-token.js';
import './prototypes/scan-tokens.js';
import './prototypes/skip-whitespace.js';

// Export lexer constructor and types
export { Lexer, createLexer } from './lexer.js';
export { KEYWORDS, LexerStateEnum, TokenTypeEnum } from './lexer.types.js';
export type { ILexer, ISourcePosition, IToken } from './lexer.types.js';
