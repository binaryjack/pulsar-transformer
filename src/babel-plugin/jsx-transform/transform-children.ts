/**
 * Transform JSX children to array expression
 * Handles text nodes, expressions, and nested JSX with smart wrapping
 */

import type * as BabelTypes from '@babel/types';

/**
 * Transforms JSX children into a Babel array expression
 * Includes smart wrapping:
 * - Text nodes: Preserves meaningful whitespace, collapses extras
 * - Expressions: Only wraps reactive expressions (with function calls)
 * - Static values: Passes through unwrapped
 *
 * @param children - Array of JSX child nodes
 * @param t - Babel types helper
 * @returns Array expression containing transformed children
 */
export function transformChildren(
  children: Array<
    | BabelTypes.JSXText
    | BabelTypes.JSXExpressionContainer
    | BabelTypes.JSXSpreadChild
    | BabelTypes.JSXElement
    | BabelTypes.JSXFragment
  >,
  t: typeof BabelTypes
): BabelTypes.ArrayExpression {
  const elements: Array<
    | BabelTypes.Expression
    | BabelTypes.SpreadElement
    | BabelTypes.JSXElement
    | BabelTypes.JSXFragment
  > = [];

  for (const child of children) {
    if (t.isJSXText(child)) {
      // Get raw text value - preserve meaningful whitespace
      const text = child.value;

      // Check if text contains any non-whitespace content
      const hasContent = /\S/.test(text);

      let processedText: string;
      if (hasContent) {
        // Has content - trim surrounding newlines/tabs, collapse multiple spaces
        processedText = text
          .replaceAll(/^[\n\r\t]+|[\n\r\t]+$/g, '') // Remove leading/trailing newlines/tabs
          .replaceAll(/\s+/g, ' ') // Collapse multiple spaces to single space
          .trim(); // Remove leading/trailing spaces after normalization

        // CRITICAL: If original text ended with space before an expression, preserve it
        // e.g., "Index: {expr}" should keep the space: "Index: " not "Index:"
        const endsWithSpace = /\s$/.test(text.replaceAll(/[\n\r\t]+$/g, ''));
        if (endsWithSpace && processedText) {
          processedText += ' ';
        }
      } else {
        // Pure whitespace - only preserve if it's on a single line (between inline elements)
        // Multi-line whitespace (between block elements) should be skipped
        const hasNewline = /[\n\r]/.test(text);
        if (!hasNewline && text.length > 0) {
          processedText = ' '; // Single space between inline elements like <strong>A:</strong> {x}
        } else {
          processedText = ''; // Skip multi-line whitespace
        }
      }

      if (processedText) {
        // Add as plain string literal (not wrapped in t_text)
        elements.push(t.stringLiteral(processedText));
      }
    } else if (t.isJSXExpressionContainer(child)) {
      if (t.isExpression(child.expression)) {
        // Check if expression is already a function (arrow or function expression)
        // If so, passthrough as-is (used for component props like Index children)
        const isFunction =
          t.isArrowFunctionExpression(child.expression) || t.isFunctionExpression(child.expression);

        // Check if it's a static literal value
        const isLiteral =
          t.isStringLiteral(child.expression) ||
          t.isNumericLiteral(child.expression) ||
          t.isBooleanLiteral(child.expression) ||
          t.isNullLiteral(child.expression) ||
          (t.isIdentifier(child.expression) && child.expression.name === 'undefined');

        if (isFunction) {
          // Already a function - pass through as-is
          elements.push(child.expression);
        } else if (isLiteral) {
          // Static literal - no wrapping needed
          elements.push(child.expression);
        } else {
          // Everything else (identifiers, calls, expressions) - wrap for reactivity
          // This includes props, signals, memos, and computed expressions
          elements.push(t.arrowFunctionExpression([], child.expression));
        }
      }
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      // Will be transformed by visitor
      elements.push(child);
    }
  }

  return t.arrayExpression(elements);
}
