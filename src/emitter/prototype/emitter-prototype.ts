/**
 * Emitter Prototype Methods
 *
 * Attaches Emitter methods to prototype.
 */

import { Emitter } from '../emitter.js';

// Emitter methods
import { _addLine } from './add-line.js';
import { _emitArrowFunction } from './emit-arrow-function.js';
import { _emitCallExpression } from './emit-call-expression.js';
import { _emitComponent } from './emit-component.js';
import { _emitElement } from './emit-element.js';
import { _emitEventHandler } from './emit-event-handler.js';
import { _emitExpression } from './emit-expression.js';
import { _emitIdentifier } from './emit-identifier.js';
import { _emitImport } from './emit-import.js';
import { _emitLiteral } from './emit-literal.js';
import { _emitSignalBinding } from './emit-signal-binding.js';
import { _emitStatement } from './emit-statement.js';
import { _emitVariableDeclaration } from './emit-variable-declaration.js';
import { emit } from './emit.js';
import { _formatCode } from './format-code.js';
import { _generateUniqueName } from './generate-unique-name.js';
import { getContext } from './get-context.js';
import { _indent } from './indent.js';

// Attach Emitter public methods
Emitter.prototype.emit = emit;
Emitter.prototype.getContext = getContext;

// Attach Emitter private methods (non-enumerable)
const emitterPrivateMethods = {
  _emitComponent,
  _emitElement,
  _emitSignalBinding,
  _emitEventHandler,
  _emitImport,
  _emitVariableDeclaration,
  _emitLiteral,
  _emitIdentifier,
  _emitCallExpression,
  _emitArrowFunction,
  _emitExpression,
  _emitStatement,
  _indent,
  _addLine,
  _generateUniqueName,
  _formatCode,
};

for (const [name, method] of Object.entries(emitterPrivateMethods)) {
  Object.defineProperty(Emitter.prototype, name, {
    value: method,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
