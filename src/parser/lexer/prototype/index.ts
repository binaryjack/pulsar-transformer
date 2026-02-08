/**
 * Lexer Prototype Methods
 *
 * Attaches all prototype methods to Lexer constructor.
 */

import { Lexer } from '../lexer.js';
import { enterJSXElement } from './enter-jsx-element.js';
import { enterJSXExpression } from './enter-jsx-expression.js';
import { enterTypeContext } from './enter-type-context.js';
import { exitJSXElement } from './exit-jsx-element.js';
import { exitJSXExpression } from './exit-jsx-expression.js';
import { exitTypeContext } from './exit-type-context.js';
import { _getCurrentColumn } from './get-current-column.js';
import { getPosition } from './get-position.js';
import { _isGenericAngleBracket } from './is-generic-angle-bracket.js';
import { isInTypeContext } from './is-in-type-context.js';
import { peek } from './peek.js';
import { canFollowTypeArguments, reScanGreaterThanToken } from './rescan-greater-than.js';
import { reScanLessThanToken } from './rescan-less-than.js';
import { _scanJSXText } from './scan-jsx-text.js';
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
  reScanTemplateToken,
  tokenize,
} from './tokenize.js';

// Attach public methods to prototype
Lexer.prototype.tokenize = tokenize;
Lexer.prototype.peek = peek;
Lexer.prototype.getPosition = getPosition;
Lexer.prototype.enterJSXElement = enterJSXElement;
Lexer.prototype.exitJSXElement = exitJSXElement;
Lexer.prototype.enterJSXExpression = enterJSXExpression;
Lexer.prototype.exitJSXExpression = exitJSXExpression;
Lexer.prototype.enterTypeContext = enterTypeContext;
Lexer.prototype.exitTypeContext = exitTypeContext;
Lexer.prototype.isInTypeContext = isInTypeContext;
Lexer.prototype.reScanLessThanToken = reScanLessThanToken;
Lexer.prototype.reScanGreaterThanToken = reScanGreaterThanToken;
Lexer.prototype.reScanTemplateToken = reScanTemplateToken;
Lexer.prototype.canFollowTypeArguments = canFollowTypeArguments;

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

Object.defineProperty(Lexer.prototype, '_scanJSXText', {
  value: _scanJSXText,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_getCurrentColumn', {
  value: _getCurrentColumn,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Lexer.prototype, '_isGenericAngleBracket', {
  value: _isGenericAngleBracket,
  writable: true,
  enumerable: false,
  configurable: false,
});
