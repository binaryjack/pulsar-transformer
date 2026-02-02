/**
 * Expression classifier - Strategy pattern for JSX expression analysis
 * Complete implementation with full edge case handling
 */

import * as ts from 'typescript';
import {
  ExpressionType,
  IClassificationMetadata,
  IExpressionClassification,
  IExpressionClassifier,
  ITransformContext,
} from '../types.js';
import { isEventHandlerContext } from './event-handler-detector.js';
import { getSignalDependencies, hasSignalCalls, isSignalGetter } from './signal-detector.js';

/**
 * Create expression classifier
 */
export function createExpressionClassifier(context: ITransformContext): IExpressionClassifier {
  const classifier: IExpressionClassifier = {
    classify(expression: ts.Expression): IExpressionClassification {
      // Check for child JSX elements first
      if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression)) {
        return createClassification('child', 'jsx-child', 'JSX element child', false, false);
      }

      // Check for JSX fragments
      if (ts.isJsxFragment(expression)) {
        return createClassification('fragment', 'jsx-fragment', 'JSX fragment', false, false);
      }

      // Check for conditional expressions
      if (ts.isConditionalExpression(expression)) {
        const hasSignals = classifier.hasSignalDependencies(expression);
        if (hasSignals) {
          return createClassification(
            'conditional',
            'show-component',
            'Conditional expression with signal dependencies',
            true,
            true
          );
        }
      }

      // Check for array methods (map, filter, etc.)
      if (ts.isCallExpression(expression)) {
        if (ts.isPropertyAccessExpression(expression.expression)) {
          const methodName = expression.expression.name.text;
          if (methodName === 'map' || methodName === 'flatMap') {
            return createClassification(
              'loop',
              'for-component',
              'Array mapping requires For component',
              true,
              true
            );
          }
        }
      }

      // Check parent context for event handlers
      const isEventHandler = isEventHandlerContext(expression, context);
      if (isEventHandler) {
        return createClassification(
          'event',
          'add-event-listener',
          'Event handler detected from parent attribute',
          false,
          false
        );
      }

      // Check for signal dependencies
      if (classifier.hasSignalDependencies(expression)) {
        const deps = classifier.getSignalDependencies(expression);
        return createClassification(
          'dynamic',
          'registry-wire',
          `Expression contains ${deps.length} signal dependencies`,
          true,
          false,
          {
            signalCount: deps.length,
            hasNestedSignals: hasNestedSignals(expression, context),
            isNullable: isNullableExpression(expression, context),
            isConditional: false,
            isArray: false,
            dependencies: deps.map((s) => s.name),
            estimatedComplexity: estimateComplexity(expression),
          }
        );
      }

      // Check for static values
      if (classifier.isStaticValue(expression)) {
        return createClassification(
          'static',
          'direct-assignment',
          'Static value with no reactive dependencies',
          false,
          false
        );
      }

      // Default: treat as static (conservative)
      return createClassification(
        'static',
        'direct-assignment',
        'No reactive dependencies detected, treating as static',
        false,
        false
      );
    },

    classifyAttribute(propName: string, value: ts.Expression): IExpressionClassification {
      // Check if it's an event handler attribute
      if (classifier.isEventHandler(propName)) {
        // Extract event name from propName (e.g., "onClick" -> "click")
        const eventName = propName.slice(2).toLowerCase();
        return createClassification(
          'event',
          'add-event-listener',
          `Event handler for ${eventName} event`,
          false,
          false,
          {
            eventName,
            isInline: ts.isArrowFunction(value) || ts.isFunctionExpression(value),
          }
        );
      }

      // Otherwise classify the value expression normally
      return classifier.classify(value);
    },

    isSignalCall(expression: ts.Expression): boolean {
      if (!ts.isCallExpression(expression)) return false;
      if (!ts.isIdentifier(expression.expression)) return false;

      return isSignalGetter(expression.expression, context);
    },

    isEventHandler(propName: string): boolean {
      // DOM Level 0-3 events
      const eventPatterns = [
        // Mouse events
        'onClick',
        'onDblClick',
        'onMouseDown',
        'onMouseUp',
        'onMouseMove',
        'onMouseEnter',
        'onMouseLeave',
        'onMouseOver',
        'onMouseOut',
        'onContextMenu',

        // Keyboard events
        'onKeyDown',
        'onKeyUp',
        'onKeyPress',

        // Form events
        'onChange',
        'onInput',
        'onSubmit',
        'onReset',
        'onInvalid',
        'onFocus',
        'onBlur',
        'onFocusIn',
        'onFocusOut',

        // Drag events
        'onDrag',
        'onDragStart',
        'onDragEnd',
        'onDragOver',
        'onDragEnter',
        'onDragLeave',
        'onDrop',

        // Touch events
        'onTouchStart',
        'onTouchMove',
        'onTouchEnd',
        'onTouchCancel',

        // Scroll events
        'onScroll',
        'onWheel',

        // Clipboard events
        'onCopy',
        'onCut',
        'onPaste',

        // Media events
        'onPlay',
        'onPause',
        'onEnded',
        'onVolumeChange',
        'onLoadedData',
        'onLoadedMetadata',
        'onCanPlay',

        // Animation/Transition events
        'onAnimationStart',
        'onAnimationEnd',
        'onAnimationIteration',
        'onTransitionEnd',

        // Other events
        'onLoad',
        'onError',
        'onAbort',
        'onResize',
        'onSelect',
      ];

      return eventPatterns.includes(propName);
    },

    isStaticValue(expression: ts.Expression): boolean {
      // Literals
      if (
        ts.isStringLiteral(expression) ||
        ts.isNumericLiteral(expression) ||
        ts.isNoSubstitutionTemplateLiteral(expression) ||
        expression.kind === ts.SyntaxKind.TrueKeyword ||
        expression.kind === ts.SyntaxKind.FalseKeyword ||
        expression.kind === ts.SyntaxKind.NullKeyword ||
        expression.kind === ts.SyntaxKind.UndefinedKeyword
      ) {
        return true;
      }

      // Template literals with no expressions
      if (ts.isTemplateExpression(expression)) {
        return expression.templateSpans.every((span) => classifier.isStaticValue(span.expression));
      }

      // Array literals with static elements
      if (ts.isArrayLiteralExpression(expression)) {
        return expression.elements.every((el) => classifier.isStaticValue(el));
      }

      // Object literals with static properties
      if (ts.isObjectLiteralExpression(expression)) {
        return expression.properties.every((prop) => {
          if (ts.isPropertyAssignment(prop)) {
            return classifier.isStaticValue(prop.initializer);
          }
          if (ts.isShorthandPropertyAssignment(prop)) {
            // Check if the identifier refers to a signal
            return !isSignalGetter(prop.name, context);
          }
          return false;
        });
      }

      // Binary expressions with static operands
      if (ts.isBinaryExpression(expression)) {
        return (
          classifier.isStaticValue(expression.left) && classifier.isStaticValue(expression.right)
        );
      }

      // Unary expressions
      if (ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)) {
        return classifier.isStaticValue(expression.operand);
      }

      // Parenthesized expressions
      if (ts.isParenthesizedExpression(expression)) {
        return classifier.isStaticValue(expression.expression);
      }

      // Property access on static objects
      if (ts.isPropertyAccessExpression(expression)) {
        return classifier.isStaticValue(expression.expression);
      }

      // Element access with static indices
      if (ts.isElementAccessExpression(expression)) {
        return (
          classifier.isStaticValue(expression.expression) &&
          (!expression.argumentExpression ||
            classifier.isStaticValue(expression.argumentExpression))
        );
      }

      // Type assertions/casts
      if (ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression)) {
        return classifier.isStaticValue(expression.expression);
      }

      // Non-null assertions
      if (ts.isNonNullExpression(expression)) {
        return classifier.isStaticValue(expression.expression);
      }

      return false;
    },

    hasSignalDependencies(expression: ts.Expression): boolean {
      return hasSignalCalls(expression, context);
    },

    getSignalDependencies(expression: ts.Expression): ts.Symbol[] {
      return getSignalDependencies(expression, context);
    },
  };

  return classifier;
}

/**
 * Create classification result
 */
function createClassification(
  type: ExpressionType,
  strategy: string,
  reason: string,
  requiresWire: boolean,
  requiresAnchor: boolean,
  metadata?: Partial<IClassificationMetadata>
): IExpressionClassification {
  const hasSignals = (metadata?.signalCount || 0) > 0 || metadata?.hasNestedSignals || false;
  return {
    type,
    strategy,
    reason,
    requiresWire,
    requiresAnchor,
    isStatic: type === 'static',
    hasSignals,
    metadata: {
      signalCount: 0,
      hasNestedSignals: false,
      isNullable: false,
      isConditional: false,
      isArray: false,
      dependencies: [],
      estimatedComplexity: 'low',
      ...metadata,
    },
  };
}

/**
 * Check if expression has nested signal calls
 */
function hasNestedSignals(expression: ts.Expression, context: ITransformContext): boolean {
  let depth = 0;
  let maxDepth = 0;

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        if (isSignalGetter(node.expression, context)) {
          maxDepth = Math.max(maxDepth, depth);
        }
      }
      depth++;
    }

    ts.forEachChild(node, visit);

    if (ts.isCallExpression(node)) {
      depth--;
    }
  }

  visit(expression);
  return maxDepth > 0;
}

/**
 * Check if expression can be null/undefined
 */
function isNullableExpression(expression: ts.Expression, context: ITransformContext): boolean {
  if (!context.typeChecker) return true; // Conservative: assume nullable if no type checker

  try {
    const type = context.typeChecker.getTypeAtLocation(expression);
    if (!type || !type.flags) return true; // Conservative: assume nullable if no type info

    // Check for null/undefined in union type
    if (type.isUnion()) {
      return type.types.some(
        (t) => t?.flags && (t.flags & ts.TypeFlags.Null || t.flags & ts.TypeFlags.Undefined)
      );
    }

    return (type.flags & ts.TypeFlags.Null) !== 0 || (type.flags & ts.TypeFlags.Undefined) !== 0;
  } catch {
    return true; // Conservative: assume nullable on error
  }
}

/**
 * Estimate expression complexity
 */
function estimateComplexity(expression: ts.Expression): 'low' | 'medium' | 'high' {
  let nodeCount = 0;

  function count(node: ts.Node): void {
    nodeCount++;
    ts.forEachChild(node, count);
  }

  count(expression);

  if (nodeCount < 5) return 'low';
  if (nodeCount < 15) return 'medium';
  return 'high';
}
