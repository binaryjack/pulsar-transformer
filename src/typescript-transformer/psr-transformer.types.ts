/**
 * TypeScript Transformer Types - PSR transformation interface
 * Pattern: Official TypeScript Compiler API integration
 */

import type * as ts from 'typescript'
import type { ITransformationTracker } from './transformation-tracker.types.js'

export interface IPSRTransformerOptions {
  readonly filePath?: string;
  readonly enableTracking?: boolean;
  readonly enableSourceMaps?: boolean;
  readonly strictMode?: boolean;
  readonly registryImportPath?: string;
  readonly frameworkImportPath?: string;
}

export interface IPSRTransformResult {
  readonly transformedSourceFile: ts.SourceFile;
  readonly tracker?: ITransformationTracker;
  readonly diagnostics: ts.Diagnostic[];
  readonly imports: Set<string>;
  readonly components: Set<string>;
}

export interface IPSRTransformerContext {
  readonly options: IPSRTransformerOptions;
  readonly tracker?: ITransformationTracker;
  readonly typeChecker?: ts.TypeChecker;
  readonly sourceFile: ts.SourceFile;
  readonly imports: Set<string>;
  readonly components: Set<string>;
  readonly transformationCount: number;
}

export enum PSRNodeTypeEnum {
  COMPONENT_DECLARATION = 'COMPONENT_DECLARATION',
  JSX_ELEMENT = 'JSX_ELEMENT',
  JSX_SELF_CLOSING_ELEMENT = 'JSX_SELF_CLOSING_ELEMENT',
  JSX_FRAGMENT = 'JSX_FRAGMENT',
  SHOW_COMPONENT = 'SHOW_COMPONENT',
  FOR_COMPONENT = 'FOR_COMPONENT',
  INDEX_COMPONENT = 'INDEX_COMPONENT',
  CONTEXT_PROVIDER = 'CONTEXT_PROVIDER',
  CONTEXT_CONSUMER = 'CONTEXT_CONSUMER',
  RESOURCE_CALL = 'RESOURCE_CALL',
  STYLE_OBJECT = 'STYLE_OBJECT',
  EVENT_HANDLER = 'EVENT_HANDLER',
}

export interface IPSRTransformer {
  new (options?: IPSRTransformerOptions): IPSRTransformer;

  // Properties
  options?: IPSRTransformerOptions;
  tracker?: ITransformationTracker;
  imports?: Set<string>;
  components?: Set<string>;
  transformationCount?: number;

  // Core transformation
  createTransformerFactory(): ts.TransformerFactory<ts.SourceFile>;
  transform(sourceFile: ts.SourceFile, program?: ts.Program): IPSRTransformResult;

  // Node identification
  isComponentDeclaration(node: ts.Node): node is ts.FunctionDeclaration;
  isJSXElement(node: ts.Node): node is ts.JsxElement;
  isControlFlowComponent(node: ts.JsxElement): boolean;
  isContextProvider(node: ts.JsxElement): boolean;
  isStyleObject(node: ts.Node): boolean;

  // Core transformations
  transformComponentDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration;
  transformJSXElement(node: ts.JsxElement): ts.CallExpression;
  transformJSXSelfClosingElement(node: ts.JsxSelfClosingElement): ts.CallExpression;
  transformJSXFragment(node: ts.JsxFragment): ts.CallExpression;

  // Control flow transformations
  transformControlFlowComponent(node: ts.JsxElement): ts.Expression;
  transformShowComponent(node: ts.JsxElement): ts.CallExpression;
  transformForComponent(node: ts.JsxElement): ts.CallExpression;
  transformIndexComponent(node: ts.JsxElement): ts.CallExpression;

  // Context transformations
  transformContextProvider(node: ts.JsxElement): ts.CallExpression;
  transformUseContextCall(node: ts.CallExpression): ts.CallExpression;

  // Style transformations
  transformStyleObject(node: ts.ObjectLiteralExpression): ts.StringLiteral;
  transformStyleProperty(node: ts.PropertyAssignment): string;

  // JSX helper methods
  getJSXTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string;
  transformJSXAttributes(attributes: ts.JsxAttributes): ts.Expression;
  transformJSXChildren(children: ts.NodeArray<ts.JsxChild>): ts.ArrayLiteralExpression;

  // Import management
  addFrameworkImport(importName: string): void;
  injectImports(sourceFile: ts.SourceFile): ts.SourceFile;

  // Utilities
  createRegistryExecuteCall(componentId: string, bodyFunction: ts.ArrowFunction): ts.CallExpression;
  createTElementCall(
    tagName: string,
    attributes: ts.Expression,
    children: ts.Expression
  ): ts.CallExpression;
  getJSXAttributeValue(
    element: ts.JsxElement | ts.JsxSelfClosingElement,
    attributeName: string
  ): ts.Expression | undefined;

  // Tracking
  trackTransformation(nodeType: PSRNodeTypeEnum, inputNode: ts.Node, outputNode: ts.Node): void;
}

