import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Main entry point for generating code from JSX element IR
 * Uses registry pattern for all elements
 */
export const generate = function (
  this: IElementGenerator,
  elementIR: IJSXElementIR
): ts.Expression {
  // Handle fragments (<></>)
  if (elementIR.type === 'fragment') {
    return this.generateFragment(elementIR);
  }

  // Handle component calls (e.g., <Counter />)
  if (elementIR.type === 'component') {
    return this.generateComponentCall(elementIR);
  }

  // Use registry pattern for ALL elements
  return this.generateRegistryElement(elementIR);
};
