/**
 * JSX Transform - Public API
 *
 * Modular JSX transformation for Pulsar framework
 * Transforms JSX syntax into runtime calls
 */

// Main factory
export { createJSXTransform } from './create-jsx-transform.js';

// Types
export type { VisitorObj } from './jsx-transform.types.js';

// Utilities (re-exported for testing/advanced usage)
export { addImport } from './add-import.js';
export { getComponentName } from './get-component-name.js';
export { getTagName } from './get-tag-name.js';
export { isComponentElement } from './is-component-element.js';
export { transformAttributes } from './transform-attributes.js';
export { transformChildren } from './transform-children.js';
