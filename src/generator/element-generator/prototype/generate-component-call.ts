import * as ts from 'typescript';
import { IJSXElementIR, IPropIR } from '../../../ir/types/index.js';
import { elementOrTextNode, notNullUndefinedFalse } from '../../ast-builder/index.js';
import { componentUsesProvider } from '../../utils/provider-detector.js';
import { IElementGeneratorInternal } from '../element-generator.types.js';

/**
 * Generates a function call for component elements (e.g., <Counter initialCount={0} />)
 * Transforms into: Counter({ initialCount: 0, children: childrenElement })
 */
export const generateComponentCall = function (
  this: IElementGeneratorInternal,
  componentIR: IJSXElementIR
): ts.Expression {
  const factory = ts.factory;

  // Build props object
  const propsProperties: ts.ObjectLiteralElementLike[] = [];

  // Add regular props
  componentIR.props.forEach((prop: IPropIR) => {
    try {
      // Skip props without values or expressions
      if (!prop.value && prop.value !== false && prop.value !== 0) {
        return;
      }

      // Strict validation - ensure we have a valid TypeScript expression node
      const valueExpr = prop.value;
      if (!valueExpr || typeof valueExpr !== 'object') {
        console.warn(
          `[generateComponentCall] Prop ${prop.name} has invalid value type:`,
          typeof valueExpr
        );
        return;
      }

      // Check for .kind property which all TS nodes must have
      if (!('kind' in valueExpr) || typeof (valueExpr as any).kind !== 'number') {
        console.warn(`[generateComponentCall] Prop ${prop.name} missing or invalid .kind property`);
        return;
      }

      // Wrap in try-catch to handle any edge cases
      // Use string literal for hyphenated property names, otherwise use identifier
      const propNameNode = prop.name.includes('-')
        ? factory.createStringLiteral(prop.name)
        : factory.createIdentifier(prop.name);

      const propAssignment = factory.createPropertyAssignment(
        propNameNode,
        valueExpr as ts.Expression
      );
      propsProperties.push(propAssignment);
    } catch (error) {
      console.error(
        `[generateComponentCall] Error creating property assignment for ${prop.name}:`,
        error
      );
      // Skip this prop and continue
    }
  });

  // Add children if present
  if (componentIR.children && componentIR.children.length > 0) {
    let childrenExpression: ts.Expression;

    // Check if we need to defer children (for Providers)
    const componentExpr = componentIR.component as ts.Expression;
    const shouldDeferChildren = componentUsesProvider(
      componentExpr,
      this.context.typeChecker,
      this.context.sourceFile
    );

    if (componentIR.children.length === 1 && !shouldDeferChildren) {
      const child = componentIR.children[0];
      if (child.type === 'text') {
        childrenExpression = factory.createStringLiteral(child.content);
      } else if (child.type === 'expression') {
        // Visit the expression to transform any nested JSX
        childrenExpression = this.context.jsxVisitor
          ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
          : child.expression;
      } else {
        // Recursively generate child element (IJSXElementIR type)
        childrenExpression = this.generate(child as IJSXElementIR);
      }
    } else {
      // Multiple children OR single child that needs deferral
      const needsContainer = componentIR.children.length > 1;
      const statements: ts.Statement[] = [];

      if (needsContainer) {
        // Create container for multiple children
        const containerVar = `container${(this as any).varCounter++}`;

        statements.push(
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  factory.createIdentifier(containerVar),
                  undefined,
                  undefined,
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('document'),
                      factory.createIdentifier('createElement')
                    ),
                    undefined,
                    [factory.createStringLiteral('div')]
                  )
                ),
              ],
              ts.NodeFlags.Const
            )
          )
        );

        // Append each child to container
        componentIR.children.forEach((child) => {
          let childExpr: ts.Expression;
          let needsNullCheck = false;

          if (child.type === 'text') {
            childExpr = factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('document'),
                factory.createIdentifier('createTextNode')
              ),
              undefined,
              [factory.createStringLiteral(child.content)]
            );
          } else if (child.type === 'expression') {
            const expr = child.expression as ts.Expression;
            childExpr = this.context.jsxVisitor
              ? (ts.visitNode(expr, this.context.jsxVisitor) as ts.Expression)
              : expr;
            // Expression children might evaluate to false/null/undefined (e.g., {condition && <element>})
            // We need to check before appendChild to avoid TypeError
            needsNullCheck = true;
          } else {
            childExpr = this.generate(child);
          }

          // If it's an expression child, wrap in null/false check
          if (needsNullCheck) {
            // Generate: if (childExpr !== null && childExpr !== undefined && childExpr !== false) { container.appendChild(childExpr) }
            const tempVar = `_child${(this as any).varCounter++}`;
            statements.push(
              factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                  [
                    factory.createVariableDeclaration(
                      factory.createIdentifier(tempVar),
                      undefined,
                      undefined,
                      childExpr
                    ),
                  ],
                  ts.NodeFlags.Const
                )
              )
            );
            statements.push(
              factory.createIfStatement(
                notNullUndefinedFalse(tempVar),
                factory.createBlock(
                  [
                    factory.createExpressionStatement(
                      factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier(containerVar),
                          factory.createIdentifier('appendChild')
                        ),
                        undefined,
                        [elementOrTextNode(tempVar)]
                      )
                    ),
                  ],
                  true
                )
              )
            );
          } else {
            // Static child or element - safe to append directly
            statements.push(
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(containerVar),
                    factory.createIdentifier('appendChild')
                  ),
                  undefined,
                  [childExpr]
                )
              )
            );
          }
        });

        statements.push(factory.createReturnStatement(factory.createIdentifier(containerVar)));
      } else {
        // Single child that needs deferral
        const child = componentIR.children[0];
        let childExpr: ts.Expression;

        if (child.type === 'text') {
          childExpr = factory.createStringLiteral(child.content);
        } else if (child.type === 'expression') {
          childExpr = this.context.jsxVisitor
            ? (ts.visitNode(child.expression, this.context.jsxVisitor) as ts.Expression)
            : child.expression;
        } else {
          childExpr = this.generate(child as IJSXElementIR);
        }

        statements.push(factory.createReturnStatement(childExpr));
      }

      if (shouldDeferChildren) {
        // Defer children for Provider components
        childrenExpression = factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(statements, true)
        );
      } else {
        // Non-provider with multiple children - use IIFE
        childrenExpression = factory.createCallExpression(
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
    }

    propsProperties.push(
      factory.createPropertyAssignment(factory.createIdentifier('children'), childrenExpression)
    );
  }

  // Generate component call: ComponentName({ prop1: value1, ... })
  return factory.createCallExpression(componentIR.component as ts.Expression, undefined, [
    factory.createObjectLiteralExpression(propsProperties, propsProperties.length > 1),
  ]);
};
