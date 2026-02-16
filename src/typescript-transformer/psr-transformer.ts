/**
 * PSR TypeScript Transformer Implementation - Prototype-based class
 * Pattern: Official TypeScript Compiler API with detailed tracking
 */

import * as ts from 'typescript'
import type {
  IPSRTransformer,
  IPSRTransformerOptions,
  IPSRTransformResult,
} from './psr-transformer.types.js'
import { createTransformationTracker } from './transformation-tracker.js'
import { TransformationPhaseEnum } from './transformation-tracker.types.js'

/**
 * PSRTransformer constructor (prototype-based)
 */
export const PSRTransformer: IPSRTransformer = function (
  this: IPSRTransformer,
  options: IPSRTransformerOptions = {}
) {
  this.options = {
    enableTracking: true,
    enableSourceMaps: false,
    strictMode: true,
    registryImportPath: '@pulsar-framework/pulsar.dev',
    frameworkImportPath: '@pulsar-framework/pulsar.dev',
    ...options,
  };
  this.imports = new Set<string>();
  this.components = new Set<string>();
  this.transformationCount = 0;

  // Tracker will be initialized externally if needed
  this.tracker = undefined;
} as any;

/**
 * Create TypeScript transformer factory
 */
function createTransformerFactory(this: IPSRTransformer): ts.TransformerFactory<ts.SourceFile> {
  const transformer = this;

  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      // Initialize tracking
      if (transformer.options!.enableTracking) {
        transformer.tracker = createTransformationTracker(
          sourceFile.fileName || 'unknown',
          sourceFile.getFullText()
        );
        transformer.tracker.startStep(
          'transform-setup',
          'Initialize TypeScript Transformer',
          TransformationPhaseEnum.SETUP,
          'SourceFile'
        );
      }

      // Initialize transformer state - casting to any to bypass interface restrictions
      (transformer as any).sourceFile = sourceFile;
      transformer.imports!.clear();
      transformer.components!.clear();
      transformer.transformationCount = 0;

      // Main visitor function
      const visitor = (node: ts.Node): ts.Node => {
        // Component declarations (function declarations starting with uppercase)
        if (transformer.isComponentDeclaration(node)) {
          return transformer.transformComponentDeclaration(node);
        }

        // JSX elements
        if (ts.isJsxElement(node)) {
          if (transformer.isControlFlowComponent(node)) {
            return transformer.transformControlFlowComponent(node);
          }
          if (transformer.isContextProvider(node)) {
            return transformer.transformContextProvider(node);
          }
          return transformer.transformJSXElement(node);
        }

        // JSX self-closing elements
        if (ts.isJsxSelfClosingElement(node)) {
          return transformer.transformJSXSelfClosingElement(node);
        }

        // JSX fragments
        if (ts.isJsxFragment(node)) {
          return transformer.transformJSXFragment(node);
        }

        // useContext calls
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'useContext'
        ) {
          return transformer.transformUseContextCall(node);
        }

        // Style object literals in JSX attributes
        if (transformer.isStyleObject(node)) {
          return transformer.transformStyleObject(node as ts.ObjectLiteralExpression);
        }

        // Default: visit children
        return ts.visitEachChild(node, visitor, context);
      };

      // Transform the source file
      const transformedSourceFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

      // Inject framework imports
      const finalSourceFile = transformer.injectImports(transformedSourceFile);

      if (transformer.tracker) {
        transformer.tracker.completeStep('transform-setup', 'SourceFile (transformed)', {
          transformationCount: transformer.transformationCount,
        });
      }

      return finalSourceFile;
    };
  };
}

/**
 * Transform source file with full result
 */
function transform(
  this: IPSRTransformer,
  sourceFile: ts.SourceFile,
  program?: ts.Program
): IPSRTransformResult {
  const transformerFactory = this.createTransformerFactory();
  const result = ts.transform(sourceFile, [transformerFactory]);

  return {
    transformedSourceFile: result.transformed[0] as ts.SourceFile,
    tracker: this.tracker,
    diagnostics: [],
    imports: new Set(this.imports),
    components: new Set(this.components),
  };
}

/**
 * Check if node is component declaration
 */
function isComponentDeclaration(
  this: IPSRTransformer,
  node: ts.Node
): node is ts.FunctionDeclaration {
  if (!ts.isFunctionDeclaration(node) || !node.name) {
    return false;
  }

  // Check if function name starts with uppercase (component convention)
  const name = node.name.text;
  return /^[A-Z]/.test(name);
}

/**
 * Check if JSX element is control flow component
 */
function isControlFlowComponent(this: IPSRTransformer, node: ts.JsxElement): boolean {
  const tagName = this.getJSXTagName(node);
  return ['ShowRegistry', 'ForRegistry', 'Index', 'Tryer', 'Catcher'].includes(tagName);
}

/**
 * Check if JSX element is context provider
 */
function isContextProvider(this: IPSRTransformer, node: ts.JsxElement): boolean {
  const tagName = this.getJSXTagName(node);
  return tagName.endsWith('.Provider') || tagName.includes('Provider');
}

/**
 * Check if node is style object
 */
function isStyleObject(this: IPSRTransformer, node: ts.Node): boolean {
  // Check if this is object literal in style attribute
  if (!ts.isObjectLiteralExpression(node)) {
    return false;
  }

  // Walk up to see if parent is JSX attribute named 'style'
  let parent = node.parent;
  while (parent) {
    if (ts.isJsxAttribute(parent) && ts.isIdentifier(parent.name) && parent.name.text === 'style') {
      return true;
    }
    parent = parent.parent;
  }

  return false;
}

/**
 * Transform component declaration
 */
function transformComponentDeclaration(
  this: IPSRTransformer,
  node: ts.FunctionDeclaration
): ts.FunctionDeclaration {
  const componentName = node.name!.text;
  const stepId = `component-${componentName}-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      `Transform component: ${componentName}`,
      TransformationPhaseEnum.COMPONENT_TRANSFORM,
      'FunctionDeclaration'
    );
  }

  // Add component to tracking
  this.components!.add(componentName);
  this.addFrameworkImport('$REGISTRY');

  // Extract original body
  const originalBody = node.body!;

  // Create $REGISTRY.execute call
  const bodyFunction = ts.factory.createArrowFunction(
    undefined, // modifiers
    undefined, // type parameters
    [], // parameters
    undefined, // return type
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    originalBody // body
  );

  const registryCall = this.createRegistryExecuteCall(`component:${componentName}`, bodyFunction);

  // Create return statement wrapping registry call
  const returnStatement = ts.factory.createReturnStatement(registryCall);
  const newBody = ts.factory.createBlock([returnStatement], true);

  // Add HTMLElement return type
  const htmlElementType = ts.factory.createTypeReferenceNode('HTMLElement');

  // Create updated function declaration
  const transformedFunction = ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers, // modifiers (export, etc.)
    node.asteriskToken, // asterisk token
    node.name, // name
    node.typeParameters, // type parameters
    node.parameters, // parameters
    htmlElementType, // return type
    newBody // body
  );

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'FunctionDeclaration (with $REGISTRY.execute)', {
      componentName,
      registryWrapped: true,
    });
    this.tracker.addComponent(componentName);
  }

  return transformedFunction;
}

/**
 * Transform JSX element to t_element call
 */
function transformJSXElement(this: IPSRTransformer, node: ts.JsxElement): ts.CallExpression {
  const tagName = this.getJSXTagName(node);
  const stepId = `jsx-${tagName}-${++this.transformationCount!}`;

  if (this.tracker) {
    this.tracker.startStep(
      stepId,
      `Transform JSX element: ${tagName}`,
      TransformationPhaseEnum.JSX_TRANSFORM,
      'JsxElement'
    );
  }

  this.addFrameworkImport('t_element');

  const tagNameLiteral = ts.factory.createStringLiteral(tagName);
  const attributes = this.transformJSXAttributes(node.openingElement.attributes);
  const children = this.transformJSXChildren(node.children);

  const tElementCall = this.createTElementCall(tagName, attributes, children);

  if (this.tracker) {
    this.tracker.completeStep(stepId, 'CallExpression (t_element)', {
      tagName,
      hasAttributes: node.openingElement.attributes.properties.length > 0,
    });
  }

  return tElementCall;
}

/**
 * Get JSX tag name from element
 */
function getJSXTagName(
  this: IPSRTransformer,
  node: ts.JsxElement | ts.JsxSelfClosingElement
): string {
  const tagNameNode = 'openingElement' in node ? node.openingElement.tagName : node.tagName;

  if (ts.isIdentifier(tagNameNode)) {
    return tagNameNode.text;
  }

  // Handle dot notation like Context.Provider
  if (ts.isPropertyAccessExpression(tagNameNode)) {
    return tagNameNode.getText();
  }

  return 'unknown';
}

// Add more methods here... (continued in next message due to length)

// Import utility methods
import {
  addFrameworkImport,
  createRegistryExecuteCall,
  createTElementCall,
  getJSXAttributeValue,
  injectImports,
  transformControlFlowComponent,
  transformForComponent,
  transformIndexComponent,
  transformJSXAttributes,
  transformJSXChildren,
  transformJSXFragment,
  transformJSXSelfClosingElement,
  transformShowComponent,
  transformStyleObject,
  transformStyleProperty,
} from './psr-transformer-methods.js'

// Assign prototype methods
Object.assign(PSRTransformer.prototype, {
  createTransformerFactory,
  transform,
  isComponentDeclaration,
  isControlFlowComponent,
  isContextProvider,
  isStyleObject,
  transformComponentDeclaration,
  transformJSXElement,
  transformJSXSelfClosingElement,
  transformJSXFragment,
  transformControlFlowComponent,
  transformShowComponent,
  transformForComponent,
  transformIndexComponent,
  transformStyleObject,
  transformStyleProperty,
  transformJSXAttributes,
  transformJSXChildren,
  createRegistryExecuteCall,
  createTElementCall,
  getJSXAttributeValue,
  addFrameworkImport,
  injectImports,
  getJSXTagName,
});

/**
 * Create PSR transformer
 */
export function createPSRTransformer(options?: IPSRTransformerOptions): IPSRTransformer {
  return new (PSRTransformer as any)(options);
}
