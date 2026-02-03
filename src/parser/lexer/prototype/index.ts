/**
 * Lexer Prototype Methods
 *
 * Attaches all prototype methods to Lexer constructor.
 */

import { Lexer } from '../lexer.js';
import { getPosition } from './get-position.js';
import { peek } from './peek.js';
import { tokenize } from './tokenize.js';

// Attach public methods to prototype
Lexer.prototype.tokenize = tokenize;
Lexer.prototype.peek = peek;
Lexer.prototype.getPosition = getPosition;
