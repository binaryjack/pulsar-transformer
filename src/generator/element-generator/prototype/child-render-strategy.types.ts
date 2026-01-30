import * as ts from 'typescript';
import { IElementGeneratorInternal } from '../element-generator.types.js';
import { IAnalyzedChild } from './child-render-utils.js';

/**
 * Strategy interface for rendering different types of JSX children
 * Uses prototype pattern as per architecture requirements
 */
export interface IChildRenderStrategy {
  readonly name: string;
  canHandle(child: IAnalyzedChild): boolean;
  render(this: IElementGeneratorInternal, child: IAnalyzedChild, parentVar: string): ts.Statement[];
}

/**
 * Context for strategy execution (currently unused but kept for future extensions)
 */
export interface IChildRenderContext {
  readonly generator: IElementGeneratorInternal;
  readonly parentVar: string;
  varCounter: number;
}
