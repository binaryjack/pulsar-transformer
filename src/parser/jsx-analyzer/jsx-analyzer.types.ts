import * as ts from 'typescript';
import { ITransformationContext } from '../../context/transformation-context.types.js';
import { IEventIR, IExpressionIR, IJSXElementIR, IPropIR, ITextIR } from '../../ir/types/index.js';

export const SJSXAnalyzer = Symbol.for('IJSXAnalyzer');

/**
 * Analyzed child node types - matches the IR type system
 */
export type IAnalyzedChildNode = IJSXElementIR | IExpressionIR | ITextIR;

export interface IJSXAnalyzer {
  // Constructor signature
  new (context: ITransformationContext): IJSXAnalyzer;

  readonly context: ITransformationContext;

  // Prototype methods
  analyze: (node: ts.Node) => IJSXElementIR | null;
  analyzeProps: (attributes: ts.JsxAttributes) => IPropIR[];
  analyzeChildren: (children: ts.NodeArray<ts.JsxChild>) => IAnalyzedChildNode[];
  isStaticElement: (node: ts.Node) => boolean;
  isStaticValue: (expr: ts.Expression) => boolean;
  extractDependencies: (expr: ts.Expression) => string[];
  extractEvents: (attributes: ts.JsxAttributes) => IEventIR[];
}
