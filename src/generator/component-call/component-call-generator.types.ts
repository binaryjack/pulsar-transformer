import * as ts from 'typescript';
import { IJSXElementIR } from '../../ir/types/index.js';

/**
 * Context passed to component call strategies
 */
export interface IComponentCallContext {
  componentIR: IJSXElementIR;
  factory: ts.NodeFactory;
  jsxVisitor?: ts.Visitor;
  varCounter: number;
  typeChecker?: ts.TypeChecker;
  sourceFile?: ts.SourceFile;
}

/**
 * Strategy interface for component call generation
 */
export interface IComponentCallStrategy {
  canHandle(context: IComponentCallContext): boolean;
  generateCall(
    context: IComponentCallContext,
    generateElement: (ir: IJSXElementIR, context: IComponentCallContext) => ts.Expression
  ): ts.Expression;
}
