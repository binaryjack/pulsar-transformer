/**
 * Transform JSX attributes to object expression
 * Handles special cases for control flow components and reactive props
 */

import type * as BabelTypes from '@babel/types';

/**
 * Transforms JSX attributes into a Babel object expression
 * Includes special handling for:
 * - ForRegistry/Index 'each' prop (unwraps signal calls)
 * - ShowRegistry 'when' prop (unwraps signal calls)
 * - Style attribute with reactive properties
 *
 * @param attributes - Array of JSX attributes
 * @param t - Babel types helper
 * @param componentName - Name of parent component (for special handling)
 * @returns Object expression with transformed properties
 */
export function transformAttributes(
  attributes: Array<BabelTypes.JSXAttribute | BabelTypes.JSXSpreadAttribute>,
  t: typeof BabelTypes,
  componentName: string = ''
): BabelTypes.ObjectExpression {
  const properties: Array<BabelTypes.ObjectProperty | BabelTypes.SpreadElement> = [];

  // Control flow components that need reactive props unwrapped
  const needsEachUnwrap = new Set(['ForRegistry', 'Index']);
  const needsWhenUnwrap = new Set(['ShowRegistry']);

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

          // Special handling for 'each' attribute on ForRegistry/Index
          // If user wrote each={items()}, unwrap to each={items} (pass getter, not array)
          if (
            needsEachUnwrap.has(componentName) &&
            keyName === 'each' &&
            t.isCallExpression(value)
          ) {
            // Check if it's a simple call with no arguments (likely a signal getter)
            if (value.arguments.length === 0 && t.isIdentifier(value.callee)) {
              value = value.callee; // Unwrap: items() -> items
            }
          }

          // Special handling for 'when' attribute on ShowRegistry
          // If user wrote when={isVisible()}, unwrap to when={isVisible} (pass getter, not boolean)
          if (
            needsWhenUnwrap.has(componentName) &&
            keyName === 'when' &&
            t.isCallExpression(value)
          ) {
            // Check if it's a simple call with no arguments (likely a signal getter)
            if (value.arguments.length === 0 && t.isIdentifier(value.callee)) {
              value = value.callee; // Unwrap: isVisible() -> isVisible
            }
          }

          // Special handling for style attribute with object expression
          if (keyName === 'style' && t.isObjectExpression(value)) {
            // Process style object properties to wrap reactive values
            const styleProps = value.properties.map((prop) => {
              if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
                // Wrap CallExpressions (like bgColor()) in arrow functions for reactivity
                if (t.isCallExpression(prop.value)) {
                  return t.objectProperty(
                    prop.key,
                    t.arrowFunctionExpression([], prop.value),
                    prop.computed,
                    prop.shorthand
                  );
                }

                // Wrap TemplateLiterals (like `${fontSize()}px`) in arrow functions for reactivity
                if (t.isTemplateLiteral(prop.value) && prop.value.expressions.length > 0) {
                  return t.objectProperty(
                    prop.key,
                    t.arrowFunctionExpression([], prop.value),
                    prop.computed,
                    prop.shorthand
                  );
                }
              }
              return prop;
            });
            value = t.objectExpression(styleProps);
          }
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
