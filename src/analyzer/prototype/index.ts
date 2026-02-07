/**
 * Prototype method attachment for Analyzer
 */

import { Analyzer } from '../analyzer.js';

// Import analysis methods
import { analyzeComponentReference } from './analyze-component-reference.js';
import { _detectEventHandlers, _isPureComponent, analyzeComponent } from './analyze-component.js';
import { _handlerAccessesSignals, analyzeElement } from './analyze-element.js';
import { analyzeExport } from './analyze-export.js';
import {
  _analyzeArrayExpression,
  _analyzeArrowFunction,
  _analyzeBinaryExpression,
  _analyzeCallExpression,
  _analyzeConditionalExpression,
  _analyzeIdentifier,
  _analyzeLiteral,
  _analyzeMemberExpression,
  _analyzeObjectExpression,
  _analyzeTemplateLiteral,
  _analyzeUnaryExpression,
  _isFunctionPure,
  _isParameter,
  analyzeExpression,
} from './analyze-expression.js';
import { analyzeIfStatement } from './analyze-if-statement.js';
import { analyzeImport } from './analyze-import.js';
import { analyzeReturn } from './analyze-return.js';
import { _isInCurrentScope, analyzeSignalBinding } from './analyze-signal-binding.js';
import { analyzeVariable } from './analyze-variable.js';
import { _analyzeNode, analyze } from './analyze.js';
import { getContext, getErrors, hasErrors } from './context.js';
import { addError, enterScope, exitScope, isSignal, registerSignal } from './helpers.js';

// Attach public methods
Analyzer.prototype.analyze = analyze;
Analyzer.prototype.getContext = getContext;
Analyzer.prototype.hasErrors = hasErrors;
Analyzer.prototype.getErrors = getErrors;

// Attach private analysis methods
Object.defineProperty(Analyzer.prototype, '_analyzeNode', {
  value: _analyzeNode,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeComponent', {
  value: analyzeComponent,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeElement', {
  value: analyzeElement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeComponentReference', {
  value: analyzeComponentReference,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeSignalBinding', {
  value: analyzeSignalBinding,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeExpression', {
  value: analyzeExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeVariable', {
  value: analyzeVariable,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeReturn', {
  value: analyzeReturn,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeIfStatement', {
  value: analyzeIfStatement,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeImport', {
  value: analyzeImport,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeExport', {
  value: analyzeExport,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Attach helper methods
Object.defineProperty(Analyzer.prototype, '_addError', {
  value: addError,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_enterScope', {
  value: enterScope,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_exitScope', {
  value: exitScope,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_registerSignal', {
  value: registerSignal,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_isSignal', {
  value: isSignal,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Attach expression analysis helpers
Object.defineProperty(Analyzer.prototype, '_analyzeLiteral', {
  value: _analyzeLiteral,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeTemplateLiteral', {
  value: _analyzeTemplateLiteral,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeIdentifier', {
  value: _analyzeIdentifier,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeCallExpression', {
  value: _analyzeCallExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeArrowFunction', {
  value: _analyzeArrowFunction,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeBinaryExpression', {
  value: _analyzeBinaryExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeUnaryExpression', {
  value: _analyzeUnaryExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeMemberExpression', {
  value: _analyzeMemberExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeConditionalExpression', {
  value: _analyzeConditionalExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeObjectExpression', {
  value: _analyzeObjectExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_analyzeArrayExpression', {
  value: _analyzeArrayExpression,
  writable: true,
  enumerable: false,
  configurable: false,
});

// Attach other helpers
Object.defineProperty(Analyzer.prototype, '_detectEventHandlers', {
  value: _detectEventHandlers,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_isPureComponent', {
  value: _isPureComponent,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_handlerAccessesSignals', {
  value: _handlerAccessesSignals,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_isInCurrentScope', {
  value: _isInCurrentScope,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_isFunctionPure', {
  value: _isFunctionPure,
  writable: true,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(Analyzer.prototype, '_isParameter', {
  value: _isParameter,
  writable: true,
  enumerable: false,
  configurable: false,
});
