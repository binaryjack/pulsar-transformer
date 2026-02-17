/**
 * JSX Transformation Factory
 * Creates Babel visitor for transforming JSX to t_element() calls
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';
import { addImport } from './add-import.js';
import { getComponentName } from './get-component-name.js';
import { getTagName } from './get-tag-name.js';
import { isComponentElement } from './is-component-element.js';
import type { VisitorObj } from './jsx-transform.types.js';
import { transformAttributes } from './transform-attributes.js';
import { transformChildren } from './transform-children.js';

/**
 * Creates a Babel visitor for JSX transformation
 * Transforms JSX syntax into Pulsar runtime calls:
 * - Components: Component(props) function calls
 * - HTML elements: t_element('tag', attrs, children) calls
 *
 * @param t - Babel types helper
 * @returns Visitor object with JSXElement and JSXFragment handlers
 *
 * @example
 * const visitor = createJSXTransform(t);
 * traverse(ast, visitor);
 */
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
        const componentNameStr = t.isIdentifier(componentName) ? componentName.name : '';
        const attributes = transformAttributes(openingElement.attributes, t, componentNameStr);
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
        const attributes = transformAttributes(openingElement.attributes, t, '');
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
