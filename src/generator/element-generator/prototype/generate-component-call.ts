import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { ComponentCallGenerator } from '../../component-call/component-call-generator.js';
import { IElementGeneratorInternal } from '../element-generator.types.js';

// Create singleton instance
const componentCallGenerator = new ComponentCallGenerator();

/**
 * Generates a function call for component elements (e.g., <Counter initialCount={0} />)
 * Transforms into: Counter({ initialCount: 0, children: childrenElement })
 *
 * Delegates to ComponentCallGenerator for actual generation using Strategy pattern
 */
export const generateComponentCall = function (
  this: IElementGeneratorInternal,
  componentIR: IJSXElementIR
): ts.Expression {
  // Delegate to component call generator with strategy pattern
  return componentCallGenerator.generateCall(
    componentIR,
    ts.factory,
    this.context.jsxVisitor,
    this.context.typeChecker,
    this.context.sourceFile
  );
};
