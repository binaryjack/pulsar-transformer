/**
 * Transform JSX attributes to object expression
 * Handles special cases for control flow components and reactive props
 */

import type * as BabelTypes from '@babel/types';
import { needsReactiveWrapper } from '../needs-reactive-wrapper.js';

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
  componentName: string = '',
  /**
   * When true, auto-wrapping reactive values as getter functions is SKIPPED.
   * Components receive plain JS values in their props — they manage their own
   * reactivity internally. Auto-wrap only makes sense for native HTML element
   * attributes which are wired via $REGISTRY.wire() expecting a getter.
   */
  isComponent: boolean = false
): BabelTypes.ObjectExpression {
  const properties: Array<BabelTypes.ObjectProperty | BabelTypes.SpreadElement> = [];

  // Control flow components that need reactive props unwrapped
  // Includes common import aliases (e.g. ShowRegistry as Show, ForRegistry as For)
  const needsEachUnwrap = new Set(['ForRegistry', 'Index', 'For']);
  const needsWhenUnwrap = new Set(['ShowRegistry', 'Show']);

  for (const attr of attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      properties.push(t.spreadElement(attr.argument));
    } else if (t.isJSXAttribute(attr)) {
      // Use identifier for simple names, string literal for names with hyphens/special chars
      const keyName = t.isJSXIdentifier(attr.name) ? attr.name.name : 'unknown';
      const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(keyName);
      const key = isValidIdentifier ? t.identifier(keyName) : t.stringLiteral(keyName);

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

          // Reactive string style: template literal containing signal calls
          // e.g. style={`background: ${isDragging() ? 'cyan' : 'black'}`}
          // → style: () => `background: ${isDragging() ? 'cyan' : 'black'}`
          // t_element will wire this via style.cssText for live updates
          if (keyName === 'style' && t.isTemplateLiteral(value) && value.expressions.length > 0) {
            value = t.arrowFunctionExpression([], value);
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

          // Auto-wrap reactive expressions for all non-special attributes.
          // Mirrors the same logic already applied in transform-children.ts so that
          // signal calls inside attribute values are also tracked by the effect system.
          //
          // Skipped when:
          //   - value is already a function (user-provided arrow or function expr)
          //   - event handler (onXxx) — intentionally a plain function reference
          //   - style — handled above with dedicated logic
          //   - control-flow special attrs (each/when) — already unwrapped to signal refs
          //
          // Example: stroke={selectedId() === line.id ? 'a' : 'b'}
          //   → stroke: () => selectedId() === line.id ? 'a' : 'b'
          //   → wired via $REGISTRY.wire(el, 'stroke', getter) → setAttribute on change
          const isAlreadyFunction =
            t.isArrowFunctionExpression(value) || t.isFunctionExpression(value);
          const isEventHandler = keyName.startsWith('on');
          // Only skip auto-wrap for style OBJECT — its individual properties were already
          // wrapped above. Style template literals are already wrapped (isAlreadyFunction).
          // Style ternaries / other expressions must fall through to auto-wrap so they get
          // wired via style.cssText in the runtime.
          const isStyleObject = keyName === 'style' && t.isObjectExpression(value);
          const isControlFlowSpecial =
            (needsEachUnwrap.has(componentName) && keyName === 'each') ||
            (needsWhenUnwrap.has(componentName) && keyName === 'when');

          // Auto-wrap only for native HTML element attributes, NOT for component props.
          // Components receive raw JS values; native elements need getter functions
          // so $REGISTRY.wire() can subscribe to signal changes.
          // Wrapping component props (e.g. resource={resource()}) would produce
          // `resource: () => resource()` — the component receives a function
          // instead of the actual value, silently breaking prop access.
          if (
            !isAlreadyFunction &&
            !isEventHandler &&
            !isStyleObject &&
            !isControlFlowSpecial &&
            !isComponent
          ) {
            if (needsReactiveWrapper(value, t)) {
              value = t.arrowFunctionExpression([], value);
            }
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
