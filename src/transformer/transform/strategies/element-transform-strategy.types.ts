/**
 * Element Transform Strategy Type Definitions
 *
 * Strategy 2: Element-to-DOM transformation
 * Converts ElementIR → DOM creation code
 */

import type ts from 'typescript';
import type { IElementIR } from '../../../analyzer/ir/ir-node-types.js';
import type { IElementTransformStrategy, ITransformContext } from '../transform-strategy.types.js';

/**
 * Element transform strategy internal interface
 */
export interface IElementTransformStrategyInternal extends IElementTransformStrategy {
  /** Private: Create element factory call */
  _createElementFactory(element: IElementIR, context: ITransformContext): ts.CallExpression;

  /** Private: Generate attribute setters */
  _generateAttributeSetters(element: IElementIR, context: ITransformContext): ts.Statement[];

  /** Private: Generate event listeners */
  _generateEventListeners(element: IElementIR, context: ITransformContext): ts.Statement[];

  /** Private: Generate signal bindings */
  _generateSignalBindings(element: IElementIR, context: ITransformContext): ts.Statement[];
}

/**
 * Element transform config
 */
export interface IElementTransformConfig {
  /** Use document.createElement vs custom factory */
  useNativeDOM?: boolean;

  /** Optimize static elements */
  optimizeStatic?: boolean;
}
