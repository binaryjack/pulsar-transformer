import * as ts from 'typescript';
import { ITransformationContext } from '../../context/transformation-context.types.js';
import { IJSXElementIR } from '../../ir/types/index.js';
import { IAnalyzedChildNode } from '../../parser/jsx-analyzer/jsx-analyzer.types.js';

/**
 * Generates TypeScript AST nodes from JSX IR
 */
export interface IElementGenerator {
  /**
   * Transformation context
   */
  readonly context: ITransformationContext;

  /**
   * Variable counter for unique names
   */
  varCounter: number;

  /**
   * Generate code for a JSX element
   */
  generate: (elementIR: IJSXElementIR) => ts.Expression;

  /**
   * Generate code for a component function call
   */
  generateComponentCall: (componentIR: IJSXElementIR) => ts.Expression;

  /**
   * Generate code for a static element (no reactive updates)
   */
  generateStaticElement: (elementIR: IJSXElementIR) => ts.Expression;

  /**
   * Generate code for a dynamic element (with reactive updates)
   */
  generateDynamicElement: (elementIR: IJSXElementIR) => ts.Expression;

  /**
   * Generate code for JSX fragments (<></>)
   */
  generateFragment: (fragmentIR: IJSXElementIR) => ts.Expression;

  /**
   * Generate code for event listeners
   */
  generateEventListeners: (elementVar: string, elementIR: IJSXElementIR) => ts.Statement[];

  /**
   * Generate code for children
   */
  generateChildren: (children: IAnalyzedChildNode[], parentVar: string) => ts.Statement[];

  /**
   * Generate code for dynamic properties
   */
  generateDynamicProps: (elementVar: string, elementIR: IJSXElementIR) => ts.Statement[];

  /**
   * Generate code for ref assignment
   */
  generateRefAssignment: (elementVar: string, refExpr: ts.Expression) => ts.Statement | null;

  /**
   * Generate code for registry-pattern element (NEW)
   * Uses t_element() and $REGISTRY.wire() instead of createEffect
   */
  generateRegistryElement: (elementIR: IJSXElementIR) => ts.Expression;
}

/**
 * Symbol token for dependency injection
 */
export const SElementGenerator = Symbol.for('IElementGenerator');

/**
 * Internal interface with context access for ElementGenerator
 */
export interface IElementGeneratorInternal extends IElementGenerator {
  context: ITransformationContext;
  varCounter: number;
}
