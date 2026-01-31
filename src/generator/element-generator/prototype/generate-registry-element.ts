import * as ts from 'typescript';
import { IJSXElementIR, IPropIR } from '../../../ir/types/index.js';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Generates registry-pattern element code
 * Uses t_element() and $REGISTRY.wire() instead of createEffect
 *
 * Generated pattern:
 * ```
 * const el = t_element('div', { className: 'static' })
 * $REGISTRY.wire(el, 'textContent', () => signal())
 * ```
 */
export const generateRegistryElement = function (
  this: IElementGenerator,
  elementIR: IJSXElementIR
): ts.Expression {
  const statements: ts.Statement[] = [];
  const varName = `el_${this.varCounter++}`;
  const config = this.context.config;

  // Safety check
  if (!elementIR.props) {
    console.error('[Transformer] elementIR.props is undefined:', elementIR);
    throw new Error('elementIR.props is undefined - check analyzer');
  }

  // Build attributes object for t_element
  const attributes: ts.ObjectLiteralElementLike[] = [];

  // Add data-hid for SSR hydration if enabled
  if (config?.enableSSR) {
    attributes.push(
      ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral('data-hid'),
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('$REGISTRY'),
            ts.factory.createIdentifier('nextHid')
          ),
          undefined,
          []
        )
      )
    );
  }

  // Add static props
  elementIR.props.forEach((prop: IPropIR) => {
    if (!prop.isDynamic) {
      attributes.push(
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral(prop.name),
          prop.value as ts.Expression
        )
      );
    }
  });

  // Use tagName or tag, ensure it's defined
  const tag = elementIR.tagName || elementIR.tag;
  if (!tag) {
    throw new Error('Element must have a tag or tagName');
  }

  // Create: const el = t_element('tag', { ...attrs })
  const createElement = ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(varName),
          undefined,
          undefined,
          ts.factory.createCallExpression(ts.factory.createIdentifier('t_element'), undefined, [
            ts.factory.createStringLiteral(tag),
            ts.factory.createObjectLiteralExpression(attributes, false),
          ])
        ),
      ],
      ts.NodeFlags.Const
    )
  );
  statements.push(createElement);

  // Wire dynamic props: $REGISTRY.wire(el, 'prop', () => value)
  if (elementIR.props && Array.isArray(elementIR.props)) {
    elementIR.props.forEach((prop: IPropIR) => {
      if (prop.isDynamic) {
        const wireCall = ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('$REGISTRY'),
              ts.factory.createIdentifier('wire')
            ),
            undefined,
            [
              ts.factory.createIdentifier(varName),
              ts.factory.createStringLiteral(prop.name),
              // Check if value is already a function/signal or needs wrapping
              isSignalExpression(prop.value)
                ? (prop.value as ts.Expression)
                : ts.factory.createArrowFunction(
                    undefined,
                    undefined,
                    [],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    prop.value as ts.Expression
                  ),
            ]
          )
        );
        statements.push(wireCall);
      }
    });
  }
  // Add event listeners: el.addEventListener('event', handler)
  if (elementIR.events) {
    elementIR.events.forEach((event) => {
      const eventName = event.name.toLowerCase().replace('on', '');
      const listenerCall = ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(varName),
            ts.factory.createIdentifier('addEventListener')
          ),
          undefined,
          [ts.factory.createStringLiteral(eventName), event.handler]
        )
      );
      statements.push(listenerCall);
    });
  }

  // Handle children
  if (elementIR.children && elementIR.children.length > 0) {
    elementIR.children.forEach((child) => {
      if (child.type === 'text') {
        // Static text
        if (!child.isDynamic) {
          statements.push(
            ts.factory.createExpressionStatement(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier(varName),
                  ts.factory.createIdentifier('appendChild')
                ),
                undefined,
                [
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier('document'),
                      ts.factory.createIdentifier('createTextNode')
                    ),
                    undefined,
                    child.value
                      ? [child.value as ts.Expression]
                      : [ts.factory.createStringLiteral(child.content)]
                  ),
                ]
              )
            )
          );
        } else {
          // Dynamic text - wire textContent
          const textValue = child.value as ts.Expression;
          if (!textValue) {
            console.error('[Transformer] Dynamic text child has no value:', child);
            return;
          }

          statements.push(
            ts.factory.createExpressionStatement(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('$REGISTRY'),
                  ts.factory.createIdentifier('wire')
                ),
                undefined,
                [
                  ts.factory.createIdentifier(varName),
                  ts.factory.createStringLiteral('textContent'),
                  isSignalExpression(textValue)
                    ? textValue
                    : ts.factory.createArrowFunction(
                        undefined,
                        undefined,
                        [],
                        undefined,
                        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        textValue
                      ),
                ]
              )
            )
          );
        }
      } else if (child.type === 'expression') {
        // Expression child (e.g., {condition && <Component />})
        statements.push(
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(varName),
                ts.factory.createIdentifier('appendChild')
              ),
              undefined,
              [child.expression as ts.Expression]
            )
          )
        );
      } else if (
        child.type === 'element' ||
        child.type === 'component' ||
        child.type === 'fragment'
      ) {
        // Element child - recursively generate
        const childExpr = this.generate(child as IJSXElementIR);
        statements.push(
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(varName),
                ts.factory.createIdentifier('appendChild')
              ),
              undefined,
              [childExpr]
            )
          )
        );
      }
    });
  }

  // Return the element
  statements.push(ts.factory.createReturnStatement(ts.factory.createIdentifier(varName)));

  // Wrap in IIFE to create scope
  return ts.factory.createCallExpression(
    ts.factory.createParenthesizedExpression(
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
};

/**
 * Helper: Check if expression is already a signal/function call
 */
function isSignalExpression(expr: ts.Node | undefined): boolean {
  if (!expr) return false;

  // Check if it's a call expression (signal call)
  if (ts.isCallExpression(expr)) {
    return true;
  }

  // Check if it's an identifier (might be a signal)
  if (ts.isIdentifier(expr)) {
    return true;
  }

  // Check if it's an arrow function
  if (ts.isArrowFunction(expr)) {
    return true;
  }

  return false;
}
