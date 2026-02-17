/**
 * Type definitions for JSX transformation
 */

import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';

/**
 * Visitor object for JSX transformation
 * Contains handlers for JSXElement and JSXFragment nodes
 */
export interface VisitorObj {
  JSXElement: (path: NodePath<BabelTypes.JSXElement>) => void;
  JSXFragment: (path: NodePath<BabelTypes.JSXFragment>) => void;
}

/**
 * Set of component names that require special 'each' prop handling
 * These components expect a getter function, not a called result
 */
export type ComponentsNeedingEachUnwrap = Set<string>;

/**
 * Set of component names that require special 'when' prop handling
 * These components expect a getter function, not a boolean result
 */
export type ComponentsNeedingWhenUnwrap = Set<string>;
