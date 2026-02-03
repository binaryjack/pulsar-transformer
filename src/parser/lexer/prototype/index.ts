/**
 * Lexer Prototype Methods
 * 
 * Attaches all prototype methods to Lexer constructor.
 */

import { Lexer } from '../lexer';
import { tokenize } from './tokenize';
import { peek } from './peek';
import { getPosition } from './get-position';

// Attach public methods to prototype
Lexer.prototype.tokenize = tokenize;
Lexer.prototype.peek = peek;
Lexer.prototype.getPosition = getPosition;
