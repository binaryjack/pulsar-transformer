/**
 * Get component name as Babel identifier or member expression
 */

import type * as BabelTypes from '@babel/types';

/**
 * Extracts component name from JSX element for function call transformation
 *
 * @param name - JSX element name
 * @param t - Babel types helper
 * @returns Expression representing the component (identifier or member expression)
 *
 * @example
 * <Button> → identifier('Button')
 * <Context.Provider> → memberExpression(Context, Provider)
 */
export function getComponentName(
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
  // Fallback
  return t.identifier('Unknown');
}
