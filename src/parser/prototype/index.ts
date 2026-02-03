/**
 * Prototype method attachment for Parser
 *
 * Attaches all parsing methods to Parser.prototype
 */

import { Parser } from '../parser';

// Import all parsing methods
import { getErrors } from './get-errors';
import { getPosition } from './get-position';
import { hasErrors } from './has-errors';
import {
  _addError,
  _advance,
  _check,
  _expect,
  _getCurrentToken,
  _isAtEnd,
  _match,
  _parseStatement,
  parse,
} from './parse';
import { parseComponentDeclaration } from './parse-component-declaration';
import {
  _parseArrowFunctionOrGrouping,
  _parseCallOrIdentifier,
  _parseExportDeclaration,
  _parseExpressionStatement,
  _parseImportDeclaration,
  _parseLiteral,
  parseExpression,
} from './parse-expression';
import {
  _isClosingTag,
  _parsePSRAttribute,
  _parsePSRChild,
  parsePSRElement,
} from './parse-psr-element';
import { parsePSRSignalBinding } from './parse-psr-signal-binding';
import { parseReturnStatement } from './parse-return-statement';
import { parseVariableDeclaration } from './parse-variable-declaration';

// Attach public methods to Parser.prototype
Parser.prototype.parse = parse;
Parser.prototype.getPosition = getPosition;
Parser.prototype.hasErrors = hasErrors;
Parser.prototype.getErrors = getErrors;

// Attach private helper methods (non-enumerable)
Object.defineProperty(Parser.prototype, '_parseStatement', {
  value: _parseStatement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_isAtEnd', {
  value: _isAtEnd,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_getCurrentToken', {
  value: _getCurrentToken,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_advance', {
  value: _advance,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_check', {
  value: _check,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_match', {
  value: _match,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_expect', {
  value: _expect,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_addError', {
  value: _addError,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Attach private methods (used internally by parse methods)
// These are attached as non-enumerable properties
Object.defineProperty(Parser.prototype, '_parseComponentDeclaration', {
  value: parseComponentDeclaration,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parsePSRElement', {
  value: parsePSRElement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parsePSRSignalBinding', {
  value: parsePSRSignalBinding,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseReturnStatement', {
  value: parseReturnStatement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseVariableDeclaration', {
  value: parseVariableDeclaration,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseExpression', {
  value: parseExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Attach all other helper methods
Object.defineProperty(Parser.prototype, '_parseLiteral', {
  value: _parseLiteral,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseCallOrIdentifier', {
  value: _parseCallOrIdentifier,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseArrowFunctionOrGrouping', {
  value: _parseArrowFunctionOrGrouping,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseExpressionStatement', {
  value: _parseExpressionStatement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseImportDeclaration', {
  value: _parseImportDeclaration,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parseExportDeclaration', {
  value: _parseExportDeclaration,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parsePSRAttribute', {
  value: _parsePSRAttribute,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_parsePSRChild', {
  value: _parsePSRChild,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Parser.prototype, '_isClosingTag', {
  value: _isClosingTag,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Import helper methods from parse.ts and attach them
// Note: These are defined in parse.ts but need to be exported for attachment
