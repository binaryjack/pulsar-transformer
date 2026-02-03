/**
 * Lexer Prototype Methods
 *
 * Attaches all prototype methods to Lexer constructor.
 */

import { Lexer } from '../lexer';
import { getPosition } from './get-position';
import { peek } from './peek';
import { tokenize } from './tokenize';

// Attach public methods to prototype
Lexer.prototype.tokenize = tokenize;
Lexer.prototype.peek = peek;
Lexer.prototype.getPosition = getPosition;
