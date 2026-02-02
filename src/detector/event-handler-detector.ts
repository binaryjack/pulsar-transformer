import * as ts from 'typescript';
import type { ITransformContext } from '../types.js';

/**
 * Check if expression is used in event handler context
 * Walks up parent chain to find JSX attribute with event name
 *
 * @param expression - Expression node to check
 * @param context - Transform context
 * @returns true if expression is in event handler attribute (e.g., onClick, onInput)
 *
 * @example
 * // Returns true for:
 * <button onClick={handleClick}>Click</button>
 * <input onInput={e => setValue(e.target.value)} />
 *
 * // Returns false for:
 * <div className={styles.container}>Text</div>
 * <span>{count()}</span>
 */
export function isEventHandlerContext(
  expression: ts.Expression,
  context: ITransformContext
): boolean {
  let node: ts.Node | undefined = expression;

  // Walk up the AST parent chain
  while (node && node.parent) {
    const parent: ts.Node = node.parent;

    // Check if parent is JSX attribute
    if (ts.isJsxAttribute(parent)) {
      const attrName = ts.isIdentifier(parent.name) ? parent.name.text : parent.name.name.text;

      // Check if attribute name matches event handler pattern (onXxx)
      return /^on[A-Z]/.test(attrName);
    }

    node = parent;
  }

  return false;
}
