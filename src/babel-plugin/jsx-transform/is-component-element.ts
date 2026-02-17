/**
 * Check if JSX element is a component (vs HTML element)
 * Components start with uppercase, HTML elements are lowercase
 */

import type * as BabelTypes from '@babel/types';

/**
 * Determines if a JSX element is a component or HTML element
 *
 * @param name - JSX element name
 * @param t - Babel types helper
 * @returns true if component (uppercase or member expression), false if HTML element
 *
 * @example
 * <Button> → true (component)
 * <div> → false (HTML element)
 * <Context.Provider> → true (component)
 */
export function isComponentElement(
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
