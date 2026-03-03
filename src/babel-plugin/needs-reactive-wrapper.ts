/**
 * Determines if a JSX expression needs reactive wrapper (arrow function)
 * Static values don't need wrapping, only expressions with function calls
 */

import type * as BabelTypes from '@babel/types';

/**
 * Known reactive resource/store property names.
 * Accessing these on any identifier (e.g. `resource.isLoading`) is
 * implicitly reactive because the underlying value is backed by a signal.
 * The transformer promotes ternaries/&&-expressions with these as the
 * condition to ShowRegistry so they stay live after the initial render.
 */
const REACTIVE_MEMBER_PROPS = new Set([
  'isLoading',
  'isSuccess',
  'isError',
  'isStale',
  'data',
  'error',
  'state',
]);

/**
 * Check if an expression contains function calls or reactive dependencies
 * @param node - Babel AST expression node
 * @param t - Babel types helper
 * @returns true if expression needs arrow function wrapping for reactivity
 */
export function needsReactiveWrapper(node: BabelTypes.Expression, t: typeof BabelTypes): boolean {
  // Direct call expression: count()
  if (t.isCallExpression(node)) return true;

  // Member expression: obj.prop
  if (t.isMemberExpression(node) && !node.computed) {
    // obj.method() — property is itself called
    if (t.isCallExpression(node.property)) return true;
    // fn().property — object is a call
    if (t.isCallExpression(node.object)) return true;
    // Recursively check nested member expressions: obj.nested.method()
    if (t.isMemberExpression(node.object)) {
      return needsReactiveWrapper(node.object, t);
    }
    // Known reactive resource/store accessor names (signal-backed getters):
    // resource.isLoading, resource.isSuccess, resource.data, etc.
    if (t.isIdentifier(node.property) && REACTIVE_MEMBER_PROPS.has(node.property.name)) {
      return true;
    }
  }

  // Template literal with expressions: `${count()}`
  if (t.isTemplateLiteral(node)) {
    return node.expressions.some((expr) => t.isExpression(expr) && needsReactiveWrapper(expr, t));
  }

  // Binary/logical with calls: count() + 1, count() || 'default'
  if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
    return (
      needsReactiveWrapper(node.left as BabelTypes.Expression, t) ||
      needsReactiveWrapper(node.right as BabelTypes.Expression, t)
    );
  }

  // Ternary with calls: count() > 5 ? 'high' : 'low'
  if (t.isConditionalExpression(node)) {
    return (
      needsReactiveWrapper(node.test, t) ||
      needsReactiveWrapper(node.consequent, t) ||
      needsReactiveWrapper(node.alternate, t)
    );
  }

  // Unary expression: !isActive()
  if (t.isUnaryExpression(node)) {
    return needsReactiveWrapper(node.argument as BabelTypes.Expression, t);
  }

  // Array expression: [count(), 'static']
  if (t.isArrayExpression(node)) {
    return node.elements.some((el) => el && t.isExpression(el) && needsReactiveWrapper(el, t));
  }

  // Object expression: { value: count() }
  if (t.isObjectExpression(node)) {
    return node.properties.some((prop) => {
      if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
        return needsReactiveWrapper(prop.value, t);
      }
      return false;
    });
  }

  // Sequence expression: (a(), b())
  if (t.isSequenceExpression(node)) {
    return node.expressions.some((expr) => needsReactiveWrapper(expr, t));
  }

  // Static values don't need wrapping
  return false;
}

  // Template literal with expressions: `${count()}`
  if (t.isTemplateLiteral(node)) {
    return node.expressions.some((expr) => t.isExpression(expr) && needsReactiveWrapper(expr, t));
  }

  // Binary/logical with calls: count() + 1, count() || 'default'
  if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
    return (
      needsReactiveWrapper(node.left as BabelTypes.Expression, t) ||
      needsReactiveWrapper(node.right as BabelTypes.Expression, t)
    );
  }

  // Ternary with calls: count() > 5 ? 'high' : 'low'
  if (t.isConditionalExpression(node)) {
    return (
      needsReactiveWrapper(node.test, t) ||
      needsReactiveWrapper(node.consequent, t) ||
      needsReactiveWrapper(node.alternate, t)
    );
  }

  // Unary expression: !isActive()
  if (t.isUnaryExpression(node)) {
    return needsReactiveWrapper(node.argument as BabelTypes.Expression, t);
  }

  // Array expression: [count(), 'static']
  if (t.isArrayExpression(node)) {
    return node.elements.some((el) => el && t.isExpression(el) && needsReactiveWrapper(el, t));
  }

  // Object expression: { value: count() }
  if (t.isObjectExpression(node)) {
    return node.properties.some((prop) => {
      if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
        return needsReactiveWrapper(prop.value, t);
      }
      return false;
    });
  }

  // Sequence expression: (a(), b())
  if (t.isSequenceExpression(node)) {
    return node.expressions.some((expr) => needsReactiveWrapper(expr, t));
  }

  // Static values don't need wrapping
  return false;
}

