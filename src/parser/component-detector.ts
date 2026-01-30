/**
 * Component Definition Detector
 * Identifies Pulsar component functions that return HTMLElement and contain JSX
 */

import * as ts from 'typescript';

/**
 * Interface for detected component information
 */
export interface IComponentDefinition {
  node: ts.Node;
  name: string;
  isArrowFunction: boolean;
  isFunctionDeclaration: boolean;
  returnType: ts.TypeNode | undefined;
  body: ts.Block | ts.Expression | undefined;
}

/**
 * Check if a node is a Pulsar component definition
 *
 * Criteria:
 * 1. Arrow function or function declaration
 * 2. Return type annotation is HTMLElement (or implicitly returns HTMLElement)
 * 3. Returns JSX
 */
export function isComponentDefinition(
  node: ts.Node
): node is ts.ArrowFunction | ts.FunctionDeclaration | ts.VariableDeclaration {
  // Case 1: Arrow function variable declaration
  // export const MyComponent = (...): HTMLElement => <div>...</div>
  if (ts.isVariableDeclaration(node)) {
    if (node.initializer && ts.isArrowFunction(node.initializer)) {
      const hasReturn = hasHtmlElementReturn(node.initializer);
      const hasJsx = hasJSXInBody(node.initializer.body);

      // DEBUG: Log detection details
      const componentName = node.name.getText();
      console.log(
        `[component-detector] Checking ${componentName}: hasReturn=${hasReturn}, hasJSX=${hasJsx}`
      );

      if (hasReturn && hasJsx) {
        console.log(`[component-detector] ✓ Found component: ${componentName}`);
      }
      return hasReturn && hasJsx;
    }
  }

  // Case 2: Function declaration
  // export function MyComponent(...): HTMLElement { return <div>...</div> }
  if (ts.isFunctionDeclaration(node)) {
    return hasHtmlElementReturn(node) && node.body ? hasJSXInBody(node.body) : false;
  }

  // Case 3: Direct arrow function (rare but possible)
  if (ts.isArrowFunction(node)) {
    return hasHtmlElementReturn(node) && hasJSXInBody(node.body);
  }

  return false;
}

/**
 * Extract component definition details
 */
export function getComponentDefinition(node: ts.Node): IComponentDefinition | null {
  // Variable declaration with arrow function
  if (ts.isVariableDeclaration(node)) {
    if (node.initializer && ts.isArrowFunction(node.initializer)) {
      return {
        node: node.initializer,
        name: node.name.getText(),
        isArrowFunction: true,
        isFunctionDeclaration: false,
        returnType: node.initializer.type,
        body: node.initializer.body,
      };
    }
  }

  // Function declaration
  if (ts.isFunctionDeclaration(node)) {
    return {
      node,
      name: node.name?.getText() || 'anonymous',
      isArrowFunction: false,
      isFunctionDeclaration: true,
      returnType: node.type,
      body: node.body,
    };
  }

  // Arrow function
  if (ts.isArrowFunction(node)) {
    return {
      node,
      name: 'anonymous',
      isArrowFunction: true,
      isFunctionDeclaration: false,
      returnType: node.type,
      body: node.body,
    };
  }

  return null;
}

/**
 * Check if function has HTMLElement return type
 */
function hasHtmlElementReturn(node: ts.ArrowFunction | ts.FunctionDeclaration): boolean {
  const returnType = node.type;

  if (!returnType) {
    // No explicit type, can't determine
    return false;
  }

  // Check if it's a type reference to HTMLElement
  if (ts.isTypeReferenceNode(returnType)) {
    const typeName = returnType.typeName.getText();
    return typeName === 'HTMLElement';
  }

  return false;
}

/**
 * Check if function body contains JSX
 */
function hasJSXInBody(body: ts.Block | ts.Expression | undefined): boolean {
  if (!body) {
    return false;
  }

  let hasJSX = false;

  const visit = (node: ts.Node): void => {
    // Check for JSX elements
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      hasJSX = true;
      return;
    }

    // Continue traversing if no JSX found yet
    if (!hasJSX) {
      ts.forEachChild(node, visit);
    }
  };

  visit(body);
  return hasJSX;
}

/**
 * Check if a node is inside a component definition
 * Used to determine if JSX should be transformed differently
 */
export function isInsideComponentDefinition(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  let current: ts.Node | undefined = node.parent;

  while (current && current !== sourceFile) {
    if (isComponentDefinition(current)) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

/**
 * Get all component definitions in a source file
 */
export function getComponentDefinitions(sourceFile: ts.SourceFile): IComponentDefinition[] {
  const components: IComponentDefinition[] = [];

  const visit = (node: ts.Node): void => {
    if (isComponentDefinition(node)) {
      const def = getComponentDefinition(node);
      if (def) {
        components.push(def);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return components;
}
