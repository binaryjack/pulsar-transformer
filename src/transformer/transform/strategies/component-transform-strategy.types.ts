/**
 * Component Transform Strategy Type Definitions
 * 
 * Strategy 1: Component-to-Function transformation
 * Converts ComponentIR → Registry-registered TypeScript function
 */

import type ts from 'typescript';
import type { IComponentIR } from '../../../analyzer/ir/ir-node-types';
import type { ITransformContext, IComponentTransformStrategy } from '../transform-strategy.types';

/**
 * Component transform strategy internal interface
 */
export interface IComponentTransformStrategyInternal extends IComponentTransformStrategy {
  /** Private: Generate function body */
  _generateFunctionBody(component: IComponentIR, context: ITransformContext): ts.Statement[];

  /** Private: Generate return statement */
  _generateReturnStatement(component: IComponentIR, context: ITransformContext): ts.ReturnStatement;

  /** Private: Generate signal declarations */
  _generateSignalDeclarations(component: IComponentIR, context: ITransformContext): ts.VariableStatement[];

  /** Private: Generate effect subscriptions */
  _generateEffects(component: IComponentIR, context: ITransformContext): ts.ExpressionStatement[];

  /** Private: Add required imports */
  _addImports(component: IComponentIR, context: ITransformContext): void;
}

/**
 * Component transform config
 */
export interface IComponentTransformConfig {
  /** Generate JSDoc comments */
  generateDocs?: boolean;

  /** Inline static children */
  inlineStaticChildren?: boolean;

  /** Optimize pure components */
  optimizePureComponents?: boolean;
}
