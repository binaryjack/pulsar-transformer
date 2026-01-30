import * as ts from 'typescript';
import { IExpressionIR, IJSXElementIR, ITextIR } from '../../../ir/types/index.js';

/**
 * Utilities for rendering JSX children
 * Eliminates duplication between static and dynamic rendering paths
 */

const factory = ts.factory;

/**
 * Type for analyzed child nodes - matches the IR type system
 */
export type IAnalyzedChild = IJSXElementIR | IExpressionIR | ITextIR;

/**
 * Creates TypeScript expression that checks if value is not null/undefined/false
 * Returns: identifier !== null && identifier !== undefined && identifier !== false
 */
export function createNullFalseCheck(identifierName: string): ts.Expression {
  return factory.createBinaryExpression(
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        factory.createIdentifier(identifierName),
        factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        factory.createNull()
      ),
      factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
      factory.createBinaryExpression(
        factory.createIdentifier(identifierName),
        factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
        factory.createIdentifier('undefined')
      )
    ),
    factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    factory.createBinaryExpression(
      factory.createIdentifier(identifierName),
      factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      factory.createFalse()
    )
  );
}

/**
 * Creates TypeScript expression that checks if DocumentFragment is not empty
 * Returns: !(identifier instanceof DocumentFragment) || identifier.childNodes.length > 0
 */
export function createDocumentFragmentCheck(identifierName: string): ts.Expression {
  return factory.createBinaryExpression(
    factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      factory.createParenthesizedExpression(
        factory.createBinaryExpression(
          factory.createIdentifier(identifierName),
          factory.createToken(ts.SyntaxKind.InstanceOfKeyword),
          factory.createIdentifier('DocumentFragment')
        )
      )
    ),
    factory.createToken(ts.SyntaxKind.BarBarToken),
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(identifierName),
          factory.createIdentifier('childNodes')
        ),
        factory.createIdentifier('length')
      ),
      factory.createToken(ts.SyntaxKind.GreaterThanToken),
      factory.createNumericLiteral('0')
    )
  );
}

/**
 * Creates complete validation check combining null/false check and DocumentFragment check
 */
export function createCompleteValidationCheck(identifierName: string): ts.Expression {
  return factory.createBinaryExpression(
    createNullFalseCheck(identifierName),
    factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    createDocumentFragmentCheck(identifierName)
  );
}

/**
 * Creates appendChild statement with conditional null/false check
 * Generates: if (el !== null && el !== undefined && el !== false) { parent.appendChild(el) }
 */
export function createConditionalAppendChild(
  parentVar: string,
  childIdentifier: string
): ts.Statement {
  return factory.createIfStatement(
    createNullFalseCheck(childIdentifier),
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(parentVar),
          factory.createIdentifier('appendChild')
        ),
        undefined,
        [factory.createIdentifier(childIdentifier)]
      )
    )
  );
}

/**
 * Creates conditional expression for HTMLElement vs text node
 * Returns: expr instanceof HTMLElement ? expr : document.createTextNode(String(expr))
 */
export function createElementOrTextNode(exprIdentifier: string): ts.Expression {
  return factory.createConditionalExpression(
    factory.createBinaryExpression(
      factory.createIdentifier(exprIdentifier),
      factory.createToken(ts.SyntaxKind.InstanceOfKeyword),
      factory.createIdentifier('HTMLElement')
    ),
    factory.createToken(ts.SyntaxKind.QuestionToken),
    factory.createIdentifier(exprIdentifier),
    factory.createToken(ts.SyntaxKind.ColonToken),
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('document'),
        factory.createIdentifier('createTextNode')
      ),
      undefined,
      [
        factory.createCallExpression(factory.createIdentifier('String'), undefined, [
          factory.createIdentifier(exprIdentifier),
        ]),
      ]
    )
  );
}

/**
 * Creates typeof check for function
 * Returns: typeof identifier === 'function'
 */
export function createIsFunctionCheck(identifierName: string): ts.Expression {
  return factory.createBinaryExpression(
    factory.createTypeOfExpression(factory.createIdentifier(identifierName)),
    factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
    factory.createStringLiteral('function')
  );
}

/**
 * Creates Array.isArray() check
 * Returns: Array.isArray(identifier)
 */
export function createIsArrayCheck(identifierName: string): ts.Expression {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier('Array'),
      factory.createIdentifier('isArray')
    ),
    undefined,
    [factory.createIdentifier(identifierName)]
  );
}

/**
 * Creates expression that evaluates function or returns value as-is
 * Returns: typeof value === 'function' ? value() : value
 */
export function createEvaluateIfFunction(valueIdentifier: string): ts.Expression {
  return factory.createConditionalExpression(
    createIsFunctionCheck(valueIdentifier),
    factory.createToken(ts.SyntaxKind.QuestionToken),
    factory.createCallExpression(factory.createIdentifier(valueIdentifier), undefined, []),
    factory.createToken(ts.SyntaxKind.ColonToken),
    factory.createIdentifier(valueIdentifier)
  );
}

/**
 * Creates forEach loop that appends array elements with null/false filtering
 * Generates: array.forEach(el => { if (el !== null && !== undefined && !== false) parent.appendChild(el) })
 */
export function createArrayForEachAppend(arrayIdentifier: string, parentVar: string): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(arrayIdentifier),
        factory.createIdentifier('forEach')
      ),
      undefined,
      [
        factory.createArrowFunction(
          undefined,
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier('el')
            ),
          ],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock([createConditionalAppendChild(parentVar, 'el')], true)
        ),
      ]
    )
  );
}

/**
 * Creates forEach loop for removing elements
 * Generates: array.forEach(el => parent.removeChild(el))
 */
export function createArrayForEachRemove(arrayIdentifier: string, parentVar: string): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(arrayIdentifier),
        factory.createIdentifier('forEach')
      ),
      undefined,
      [
        factory.createArrowFunction(
          undefined,
          undefined,
          [
            factory.createParameterDeclaration(
              undefined,
              undefined,
              factory.createIdentifier('el')
            ),
          ],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier(parentVar),
              factory.createIdentifier('removeChild')
            ),
            undefined,
            [factory.createIdentifier('el')]
          )
        ),
      ]
    )
  );
}
