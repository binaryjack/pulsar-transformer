/**
 * Analyze Component Declaration
 *
 * Converts component AST to ComponentIR with optimization metadata.
 */

import type { IComponentDeclarationNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IComponentIR, IIdentifierIR, IIRNode } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze component declaration
 */
export function analyzeComponent(
  this: IAnalyzerInternal,
  node: IComponentDeclarationNode
): IComponentIR {
  const componentName = node.name.name;

  // Enter component scope
  this._enterScope(componentName);
  this._context.currentComponent = componentName;

  // Analyze parameters
  const params: IIdentifierIR[] = node.params.map((param) => ({
    type: IRNodeType.IDENTIFIER_IR,
    name: param.name,
    scope: 'parameter',
    isSignal: false,
    metadata: {
      sourceLocation: param.location?.start,
    },
  }));

  // Register parameters in scope
  for (const param of params) {
    this._context.scopes[0].variables.set(param.name, {
      name: param.name,
      kind: 'parameter',
      isSignal: false,
      declarationNode: node,
    });
  }

  // Analyze body statements
  const body: IIRNode[] = [];
  const reactiveDependencies: string[] = [];

  for (const statement of node.body) {
    const irNode = this._analyzeNode(statement);
    if (irNode) {
      body.push(irNode);
    }
  }

  // If the LAST statement is an ElementIR (no explicit return), wrap it in ReturnStatementIR
  // This handles both cases:
  // 1. component Foo() { <div/> } - single ElementIR
  // 2. component Foo() { const x = 1; <div/> } - multiple statements with trailing ElementIR
  if (
    body.length > 0 &&
    body[body.length - 1].type === IRNodeType.ELEMENT_IR &&
    !node.returnStatement
  ) {
    const element = body[body.length - 1];
    body[body.length - 1] = {
      type: IRNodeType.RETURN_STATEMENT_IR,
      argument: element,
    } as any;
  }

  // Analyze return expression
  let returnExpression: IIRNode | null = null;
  if (node.returnStatement) {
    returnExpression = this._analyzeNode(node.returnStatement);
  }

  // Collect reactive dependencies (signals used)
  for (const signal of this._context.signals) {
    reactiveDependencies.push(signal);
  }

  // Generate registry key
  const registryKey = `component:${componentName}`;
  this._context.registryKeys.set(componentName, registryKey);

  // Exit component scope
  this._exitScope();
  this._context.currentComponent = null;

  // Build ComponentIR
  const componentIR: IComponentIR = {
    type: IRNodeType.COMPONENT_IR,
    name: componentName,
    params,
    body,
    returnExpression,
    reactiveDependencies,
    registryKey,
    usesSignals: reactiveDependencies.length > 0,
    hasEventHandlers: this._detectEventHandlers(body).length > 0,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        canInline: params.length === 0 && !this._detectEventHandlers(body),
        isStatic: reactiveDependencies.length === 0,
        isPure: this._isPureComponent(body),
      },
      dependencies: reactiveDependencies,
    },
  };

  return componentIR;
}

/**
 * Detect if body has event handlers
 */
function _detectEventHandlers(this: IAnalyzerInternal, body: IIRNode[]): boolean {
  // Recursively search for EventHandlerIR nodes
  for (const node of body) {
    if (node.type === IRNodeType.EVENT_HANDLER_IR) {
      return true;
    }
    if ('children' in node && Array.isArray((node as any).children)) {
      if (this._detectEventHandlers((node as any).children)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Determine if component is pure (no side effects)
 */
function _isPureComponent(this: IAnalyzerInternal, body: IIRNode[]): boolean {
  // Simple heuristic: component is pure if it only has return statement
  return body.length === 1 && body[0].type === IRNodeType.RETURN_STATEMENT_IR;
}

// Export helpers
export { _detectEventHandlers, _isPureComponent };
