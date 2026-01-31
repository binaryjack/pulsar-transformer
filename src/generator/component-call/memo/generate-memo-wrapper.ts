/**
 * Component Memoization Wrapper Generator
 *
 * Proper memoization: Uses shallowEqual to compare props and skips re-execution
 */

import * as ts from 'typescript';

export interface IMemoWrapperOptions {
  componentName: string;
  componentExpr: ts.Expression;
  propsExpr: ts.Expression;
  varCounter: number;
  factory: ts.NodeFactory;
}

/**
 * Generate proper memoization using shallowEqual
 *
 * Pattern:
 * (() => {
 *   let __memoState = { lastProps: null, lastElement: null };
 *   const __getProps = () => (propsExpr);
 *
 *   return createEffect(() => {
 *     const __newProps = __getProps();
 *
 *     // Check if props changed using shallowEqual
 *     if (__memoState.lastElement && shallowEqual(__memoState.lastProps, __newProps)) {
 *       return __memoState.lastElement;
 *     }
 *
 *     // Props changed - re-execute component
 *     const __newElement = ComponentName(__newProps);
 *     __memoState.lastProps = __newProps;
 *     __memoState.lastElement = __newElement;
 *     return __newElement;
 *   });
 * })()
 */
export function generateMemoWrapper(options: IMemoWrapperOptions): ts.Expression {
  const { componentExpr, propsExpr, varCounter, factory } = options;

  const stateVar = `__memoState${varCounter}`;
  const getPropsVar = `__getProps${varCounter}`;
  const newPropsVar = `__newProps${varCounter}`;
  const newElementVar = `__newElement${varCounter}`;

  const statements: ts.Statement[] = [];

  // let __memoState = { lastProps: null, lastElement: null };
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(stateVar),
            undefined,
            undefined,
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment('lastProps', factory.createNull()),
              factory.createPropertyAssignment('lastElement', factory.createNull()),
            ])
          ),
        ],
        ts.NodeFlags.Let
      )
    )
  );

  // const __getProps = () => (propsExpr);
  statements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(getPropsVar),
            undefined,
            undefined,
            factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createParenthesizedExpression(propsExpr)
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // Build createEffect callback statements
  const effectStatements: ts.Statement[] = [];

  // const __newProps = __getProps();
  effectStatements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(newPropsVar),
            undefined,
            undefined,
            factory.createCallExpression(factory.createIdentifier(getPropsVar), undefined, [])
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // if (__memoState.lastElement && shallowEqual(__memoState.lastProps, __newProps)) {
  //   return __memoState.lastElement;
  // }
  effectStatements.push(
    factory.createIfStatement(
      factory.createBinaryExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(stateVar), 'lastElement'),
        factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        factory.createCallExpression(factory.createIdentifier('shallowEqual'), undefined, [
          factory.createPropertyAccessExpression(factory.createIdentifier(stateVar), 'lastProps'),
          factory.createIdentifier(newPropsVar),
        ])
      ),
      factory.createBlock(
        [
          factory.createReturnStatement(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(stateVar),
              'lastElement'
            )
          ),
        ],
        true
      )
    )
  );

  // const __newElement = ComponentName(__newProps);
  effectStatements.push(
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier(newElementVar),
            undefined,
            undefined,
            factory.createCallExpression(componentExpr, undefined, [
              factory.createIdentifier(newPropsVar),
            ])
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  // __memoState.lastProps = __newProps;
  effectStatements.push(
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(stateVar), 'lastProps'),
        factory.createToken(ts.SyntaxKind.EqualsToken),
        factory.createIdentifier(newPropsVar)
      )
    )
  );

  // __memoState.lastElement = __newElement;
  effectStatements.push(
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(stateVar), 'lastElement'),
        factory.createToken(ts.SyntaxKind.EqualsToken),
        factory.createIdentifier(newElementVar)
      )
    )
  );

  // return __newElement;
  effectStatements.push(factory.createReturnStatement(factory.createIdentifier(newElementVar)));

  // return createEffect(() => { ... });
  statements.push(
    factory.createReturnStatement(
      factory.createCallExpression(factory.createIdentifier('createEffect'), undefined, [
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(effectStatements, true)
        ),
      ])
    )
  );

  // Wrap in IIFE: (() => { ... })()
  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
}
