/**
 * Parser module exports
 * Aggregates all prototype methods
 */

// Import all prototype methods to register them
import './prototypes/advance.js';
import './prototypes/expect.js';
import './prototypes/is-at-end.js';
import './prototypes/is-keyword-token.js';
import './prototypes/match.js';
import './prototypes/parse-block-statement.js';
import './prototypes/parse-component-declaration.js';
import './prototypes/parse-export-declaration.js';
import './prototypes/parse-expression.js';
import './prototypes/parse-function-declaration.js';
import './prototypes/parse-if-statement.js';
import './prototypes/parse-import-declaration.js';
import './prototypes/parse-interface-declaration.js';
import './prototypes/parse-jsx-element.js';
import './prototypes/parse-program.js';
import './prototypes/parse-return-statement.js';
import './prototypes/parse-statement.js';
import './prototypes/parse-type-annotation.js';
import './prototypes/parse-variable-declaration.js';
import './prototypes/parse.js';
import './prototypes/peek.js';

// Export parser constructor and types
export { Parser, createParser } from './parser.js';
export type { IParser } from './parser.js';
export * from './parser.types.js';
