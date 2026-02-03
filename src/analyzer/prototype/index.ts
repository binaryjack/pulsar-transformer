/**
 * Prototype method attachment for Analyzer
 */

import { Analyzer } from '../analyzer';

// Import analysis methods
import { analyze, _analyzeNode } from './analyze';
import { analyzeComponent, _detectEventHandlers, _isPureComponent } from './analyze-component';
import { analyzeElement, _handlerAccessesSignals } from './analyze-element';
import { analyzeSignalBinding, _isInCurrentScope } from './analyze-signal-binding';
import {
  analyzeExpression,
  _analyzeLiteral,
  _analyzeIdentifier,
  _analyzeCallExpression,
  _analyzeArrowFunction,
  _isFunctionPure,
  _isParameter,
} from './analyze-expression';
import { analyzeVariable } from './analyze-variable';
import { analyzeReturn } from './analyze-return';
import { addError, enterScope, exitScope, registerSignal, isSignal } from './helpers';
import { getContext, hasErrors, getErrors } from './context';

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
