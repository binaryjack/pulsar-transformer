/**
 * Lexer Prototype Methods
 *
 * Attaches all prototype methods to Lexer constructor.
 */

import { Lexer } from '../lexer.js';
import { getPosition } from './get-position.js';
import { peek } from './peek.js';
import {
  _isAlpha,
  _isAlphaNumeric,
  _isDigit,
  _readIdentifierOrKeyword,
  _readNumber,
  _readSignalBinding,
  _readSingleChar,
  _readString,
  _recognizeToken,
  tokenize,
} from './tokenize.js';

// Attach public methods to prototype
Lexer.prototype.tokenize = tokenize;
Lexer.prototype.peek = peek;
Lexer.prototype.getPosition = getPosition;

// Attach private helper methods (non-enumerable)
Object.defineProperty(Lexer.prototype, '_recognizeToken', {
  value: _recognizeToken,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_isAlpha', {
  value: _isAlpha,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_isDigit', {
  value: _isDigit,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_isAlphaNumeric', {
  value: _isAlphaNumeric,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_readIdentifierOrKeyword', {
  value: _readIdentifierOrKeyword,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_readNumber', {
  value: _readNumber,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_readString', {
  value: _readString,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_readSignalBinding', {
  value: _readSignalBinding,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_readSingleChar', {
  value: _readSingleChar,
  writable: true,
  enumerable: false,
  configurable: false,
});
