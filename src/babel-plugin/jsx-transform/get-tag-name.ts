/**
 * Get tag name from JSX element name
 * Converts JSX name to appropriate Babel expression
 */

import type * as BabelTypes from '@babel/types';

/**
 * Extracts tag name from JSX element
 *
 * @param name - JSX element name (JSXIdentifier or JSXMemberExpression)
 * @param t - Babel types helper
 * @returns Expression representing the tag name (string for HTML, identifier for components)
 *
 * @example
 * <div> → stringLiteral('div')
 * <Component> → identifier('Component')
 * <Context.Provider> → memberExpression(Context, Provider)
 */
export function getTagName(
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

  // Fallback
  return t.stringLiteral('div');
}
