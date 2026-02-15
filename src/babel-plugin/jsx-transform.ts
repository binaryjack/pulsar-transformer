/**
 * JSX Transformation for Pulsar
 * Transforms JSX elements into t_element() runtime calls
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

interface VisitorObj {
  JSXElement: (path: NodePath<BabelTypes.JSXElement>) => void;
  JSXFragment: (path: NodePath<BabelTypes.JSXFragment>) => void;
}

export function createJSXTransform(t: typeof BabelTypes): VisitorObj {
  return {
    JSXElement(path: NodePath<BabelTypes.JSXElement>) {
      const element = path.node;
      const openingElement = element.openingElement;

      // Check if this is a component (capitalized) or HTML element (lowercase)
      const isComponent = isComponentElement(openingElement.name, t);

      if (isComponent) {
        // Component call: Component(props)
        const componentName = getComponentName(openingElement.name, t);
        const attributes = transformAttributes(openingElement.attributes, t);
        const children = transformChildren(element.children, t);

        // Add children to props if present
        let propsWithChildren: BabelTypes.ObjectExpression;
        if (children.elements.length === 0) {
          // No children
          propsWithChildren = attributes;
        } else if (children.elements.length === 1) {
          // Single child - pass directly (not as array)
          const singleChild = children.elements[0];
          if (singleChild && !t.isSpreadElement(singleChild)) {
            propsWithChildren = t.objectExpression([
              ...attributes.properties,
              t.objectProperty(t.identifier('children'), singleChild as BabelTypes.Expression),
            ]);
          } else {
            propsWithChildren = attributes;
          }
        } else {
          // Multiple children - pass as array
          propsWithChildren = t.objectExpression([
            ...attributes.properties,
            t.objectProperty(t.identifier('children'), children),
          ]);
        }

        // Call: ComponentName(props)
        const componentCall = t.callExpression(componentName, [propsWithChildren]);
        path.replaceWith(componentCall);
      } else {
        // HTML element: t_element('div', props, children)
        const tagName = getTagName(openingElement.name, t);
        const attributes = transformAttributes(openingElement.attributes, t);
        const children = transformChildren(element.children, t);

        // Build t_element call: t_element(tagName, attributes, children)
        const elementCall = t.callExpression(t.identifier('t_element'), [
          tagName,
          attributes,
          children,
        ]);

        path.replaceWith(elementCall);

        // Track import
        const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
        addImport(program, 't_element', '@pulsar-framework/pulsar.dev', t);
      }
    },

    JSXFragment(path: NodePath<BabelTypes.JSXFragment>) {
      const children = transformChildren(path.node.children, t);

      // Fragment -> t_element('Fragment', {}, [...children])
      const fragmentCall = t.callExpression(t.identifier('t_element'), [
        t.stringLiteral('Fragment'),
        t.objectExpression([]),
        children,
      ]);

      path.replaceWith(fragmentCall);

      const program = path.findParent((p) => p.isProgram()) as NodePath<BabelTypes.Program>;
      addImport(program, 't_element', '@pulsar-framework/pulsar.dev', t);
    },
  };
}

function getTagName(
  name: BabelTypes.JSXElement['openingElement']['name'],
  t: typeof BabelTypes
): BabelTypes.Expression {
  if (t.isJSXIdentifier(name)) {
    // Check if component (uppercase) or HTML element (lowercase)
    const isComponent = /^[A-Z]/.test(name.name);
    if (isComponent) {
      return t.identifier(name.name);
    }
    return t.stringLiteral(name.name);
  }

  if (t.isJSXMemberExpression(name)) {
    // e.g., <Context.Provider>
    const objectName = t.isJSXIdentifier(name.object) ? name.object.name : 'Unknown';
    return t.memberExpression(t.identifier(objectName), t.identifier(name.property.name));
  }

  return t.stringLiteral('div');
}

function isComponentElement(
  name: BabelTypes.JSXElement['openingElement']['name'],
  t: typeof BabelTypes
): boolean {
  if (t.isJSXIdentifier(name)) {
    return /^[A-Z]/.test(name.name);
  }
  if (t.isJSXMemberExpression(name)) {
    return true; // Member expressions are always components (e.g., Context.Provider)
  }
  return false;
}

function getComponentName(
  name: BabelTypes.JSXElement['openingElement']['name'],
  t: typeof BabelTypes
): BabelTypes.Expression {
  if (t.isJSXIdentifier(name)) {
    return t.identifier(name.name);
  }
  if (t.isJSXMemberExpression(name)) {
    const objectName = t.isJSXIdentifier(name.object) ? name.object.name : 'Unknown';
    return t.memberExpression(t.identifier(objectName), t.identifier(name.property.name));
  }
  return t.identifier('Unknown');
}

function transformAttributes(
  attributes: Array<BabelTypes.JSXAttribute | BabelTypes.JSXSpreadAttribute>,
  t: typeof BabelTypes
): BabelTypes.ObjectExpression {
  const properties: Array<BabelTypes.ObjectProperty | BabelTypes.SpreadElement> = [];

  for (const attr of attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      properties.push(t.spreadElement(attr.argument));
    } else if (t.isJSXAttribute(attr)) {
      // Use identifier for key (unquoted) instead of string literal
      const keyName = t.isJSXIdentifier(attr.name) ? attr.name.name : 'unknown';
      const key = t.identifier(keyName);

      let value: BabelTypes.Expression;

      if (!attr.value) {
        value = t.booleanLiteral(true);
      } else if (t.isStringLiteral(attr.value)) {
        value = attr.value;
      } else if (t.isJSXExpressionContainer(attr.value)) {
        if (t.isExpression(attr.value.expression)) {
          value = attr.value.expression;
        } else {
          value = t.nullLiteral();
        }
      } else {
        value = t.nullLiteral();
      }

      // Always use explicit property (no shorthand) for clarity
      properties.push(t.objectProperty(key, value, false, false));
    }
  }

  return t.objectExpression(properties);
}

function transformChildren(
  children: Array<
    | BabelTypes.JSXText
    | BabelTypes.JSXExpressionContainer
    | BabelTypes.JSXSpreadChild
    | BabelTypes.JSXElement
    | BabelTypes.JSXFragment
  >,
  t: typeof BabelTypes
): BabelTypes.ArrayExpression {
  const elements: Array<BabelTypes.Expression | BabelTypes.SpreadElement> = [];

  for (const child of children) {
    if (t.isJSXText(child)) {
      // Get raw text value - preserve meaningful whitespace
      const text = child.value;

      // Don't trim if text contains non-whitespace mixed with spaces
      // e.g., "Counter: " should keep the trailing space
      const hasLeadingContent = /^\S/.test(text);
      const hasTrailingContent = /\S$/.test(text);

      let processedText = text;
      if (!hasLeadingContent && !hasTrailingContent) {
        // Pure whitespace - skip it
        processedText = text.trim();
      } else {
        // Has content - trim only surrounding newlines/tabs but keep meaningful spaces
        processedText = text.replace(/^[\n\r\t]+|[\n\r\t]+$/g, '').replace(/\s+/g, ' ');
      }

      if (processedText) {
        // Add as plain string literal (not wrapped in t_text)
        elements.push(t.stringLiteral(processedText));
      }
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isExpression(child.expression)) {
        // Check if expression is already a function (arrow or function expression)
        // If so, passthrough as-is (used for component props like Index children)
        const isFunction =
          t.isArrowFunctionExpression(child.expression) || t.isFunctionExpression(child.expression);

        if (isFunction) {
          // Already a function - pass through as-is
          elements.push(child.expression);
        } else {
          // Not a function - wrap in arrow function for reactive evaluation
          // This allows t_element to detect reactive content and use insert()
          elements.push(t.arrowFunctionExpression([], child.expression));
        }
      }
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      // Will be transformed by visitor
      elements.push(child as any);
    }
  }

  return t.arrayExpression(elements);
}

function addImport(
  program: NodePath<BabelTypes.Program>,
  specifier: string,
  source: string,
  t: typeof BabelTypes
) {
  // Check if import already exists
  const imports = program.node.body.filter((node): node is BabelTypes.ImportDeclaration =>
    t.isImportDeclaration(node)
  );

  const existingImport = imports.find((imp) => imp.source.value === source);

  if (existingImport) {
    // Check if specifier already imported
    const hasSpecifier = existingImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) &&
        t.isIdentifier(spec.imported) &&
        spec.imported.name === specifier
    );

    if (!hasSpecifier) {
      existingImport.specifiers.push(
        t.importSpecifier(t.identifier(specifier), t.identifier(specifier))
      );
    }
  } else {
    // Add new import
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(specifier), t.identifier(specifier))],
      t.stringLiteral(source)
    );
    program.node.body.unshift(importDeclaration);
  }
}
