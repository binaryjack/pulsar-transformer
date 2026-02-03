/**
 * Component Transform Strategy Prototype Methods
 *
 * Implements IComponentTransformStrategy interface
 */

import ts from 'typescript';
import type { IComponentIR, IRNode } from '../../../analyzer/ir/ir-node-types';
import type { ITransformContext } from '../transform-strategy.types';
import { ComponentTransformStrategy } from './component-transform-strategy';
import type { IComponentTransformStrategyInternal } from './component-transform-strategy.types';

/**
 * Can this strategy transform the given node?
 */
export function canTransform(
  this: IComponentTransformStrategyInternal,
  node: IRNode
): node is IComponentIR {
  return node.type === 'ComponentIR';
}

/**
 * Transform ComponentIR to TypeScript AST
 *
 * Returns array: [FunctionDeclaration, RegistryRegistration]
 */
export function transform(
  this: IComponentTransformStrategyInternal,
  node: IComponentIR,
  context: ITransformContext
): ts.Node[] {
  // Generate function declaration
  const functionDecl = this.transformToFunction(node, context);

  // Generate registry registration
  const registration = this.generateRegistration(node, context);

  return [functionDecl, ...registration];
}

/**
 * Get required imports
 */
export function getImports(
  this: IComponentTransformStrategyInternal,
  node: IComponentIR
): Map<string, Set<string>> {
  const imports = new Map<string, Set<string>>();

  // Always need registry
  imports.set('@pulsar/core', new Set(['registry']));

  // If component uses signals
  if (node.usesSignals) {
    const pulsarImports = imports.get('@pulsar/core') || new Set();
    pulsarImports.add('createEffect');
    imports.set('@pulsar/core', pulsarImports);
  }

  return imports;
}

/**
 * Transform component to function declaration
 */
export function transformToFunction(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.FunctionDeclaration {
  // Add imports
  this._addImports(component, context);

  // Generate parameters
  const parameters = this.generateParameters(component);

  // Generate body
  const body = this._generateFunctionBody(component, context);

  // Create function declaration
  return ts.factory.createFunctionDeclaration(
    undefined, // modifiers
    undefined, // asterisk
    ts.factory.createIdentifier(component.name),
    undefined, // type parameters
    parameters,
    undefined, // return type
    ts.factory.createBlock(body, true)
  );
}

/**
 * Generate registry registration code
 *
 * Creates: registry.register('component:Counter', () => Counter);
 */
export function generateRegistration(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.Statement[] {
  const registryKey = component.registryKey || `component:${component.name}`;

  // registry.register('component:Counter', () => Counter)
  const registration = ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('registry'),
        ts.factory.createIdentifier('register')
      ),
      undefined,
      [
        // First arg: key
        ts.factory.createStringLiteral(registryKey),
        // Second arg: factory function
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createIdentifier(component.name)
        ),
      ]
    )
  );

  return [registration];
}

/**
 * Generate component parameter bindings
 */
export function generateParameters(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR
): ts.ParameterDeclaration[] {
  return component.parameters.map((param) =>
    ts.factory.createParameterDeclaration(
      undefined, // modifiers
      undefined, // dotDotDotToken
      ts.factory.createIdentifier(param.name),
      undefined, // questionToken
      undefined, // type (inferred)
      undefined // initializer
    )
  );
}

/**
 * Private: Generate function body
 */
export function _generateFunctionBody(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.Statement[] {
  const statements: ts.Statement[] = [];

  // Generate signal declarations
  const signalDeclarations = this._generateSignalDeclarations(component, context);
  statements.push(...signalDeclarations);

  // Generate effects
  const effects = this._generateEffects(component, context);
  statements.push(...effects);

  // Generate return statement
  const returnStmt = this._generateReturnStatement(component, context);
  statements.push(returnStmt);

  return statements;
}

/**
 * Private: Generate return statement
 */
export function _generateReturnStatement(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.ReturnStatement {
  // For now, return placeholder (will be filled by element transform)
  return ts.factory.createReturnStatement(
    ts.factory.createIdentifier('undefined') // Placeholder
  );
}

/**
 * Private: Generate signal declarations
 */
export function _generateSignalDeclarations(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.VariableStatement[] {
  const declarations: ts.VariableStatement[] = [];

  // Process body statements that are signal declarations
  for (const stmt of component.body) {
    if (stmt.type === 'VariableDeclarationIR' && stmt.isSignal) {
      // const [count, setCount] = createSignal(0);
      const declaration = ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createArrayBindingPattern([
                ts.factory.createBindingElement(
                  undefined,
                  undefined,
                  ts.factory.createIdentifier(stmt.name)
                ),
                ts.factory.createBindingElement(
                  undefined,
                  undefined,
                  ts.factory.createIdentifier(
                    `set${stmt.name.charAt(0).toUpperCase()}${stmt.name.slice(1)}`
                  )
                ),
              ]),
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createIdentifier('createSignal'),
                undefined,
                [ts.factory.createNumericLiteral(0)] // Default value
              )
            ),
          ],
          ts.NodeFlags.Const
        )
      );

      declarations.push(declaration);
    }
  }

  return declarations;
}

/**
 * Private: Generate effect subscriptions
 */
export function _generateEffects(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): ts.ExpressionStatement[] {
  const effects: ts.ExpressionStatement[] = [];

  // Effects will be generated later by signal transform strategy
  // This is a placeholder

  return effects;
}

/**
 * Private: Add required imports
 */
export function _addImports(
  this: IComponentTransformStrategyInternal,
  component: IComponentIR,
  context: ITransformContext
): void {
  const imports = this.getImports(component);

  imports.forEach((namedImports, moduleName) => {
    if (!context.imports.has(moduleName)) {
      context.imports.set(moduleName, new Set());
    }

    const existing = context.imports.get(moduleName)!;
    namedImports.forEach((name) => existing.add(name));
  });
}

// Attach methods to prototype
ComponentTransformStrategy.prototype.canTransform = canTransform;
ComponentTransformStrategy.prototype.transform = transform;
ComponentTransformStrategy.prototype.getImports = getImports;
ComponentTransformStrategy.prototype.transformToFunction = transformToFunction;
ComponentTransformStrategy.prototype.generateRegistration = generateRegistration;
ComponentTransformStrategy.prototype.generateParameters = generateParameters;
ComponentTransformStrategy.prototype._generateFunctionBody = _generateFunctionBody;
ComponentTransformStrategy.prototype._generateReturnStatement = _generateReturnStatement;
ComponentTransformStrategy.prototype._generateSignalDeclarations = _generateSignalDeclarations;
ComponentTransformStrategy.prototype._generateEffects = _generateEffects;
ComponentTransformStrategy.prototype._addImports = _addImports;

// Set methods as non-enumerable
Object.defineProperties(ComponentTransformStrategy.prototype, {
  canTransform: { enumerable: false },
  transform: { enumerable: false },
  getImports: { enumerable: false },
  transformToFunction: { enumerable: false },
  generateRegistration: { enumerable: false },
  generateParameters: { enumerable: false },
  _generateFunctionBody: { enumerable: false },
  _generateReturnStatement: { enumerable: false },
  _generateSignalDeclarations: { enumerable: false },
  _generateEffects: { enumerable: false },
  _addImports: { enumerable: false },
});
