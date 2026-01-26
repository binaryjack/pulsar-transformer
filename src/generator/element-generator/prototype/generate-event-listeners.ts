import * as ts from 'typescript';
import { IJSXElementIR } from '../../../ir/types/index.js';
import { IElementGenerator } from '../element-generator.types.js';

/**
 * Generates code for attaching event listeners
 * Example output:
 *   el.addEventListener('click', (e) => handleClick(e))
 */
export const generateEventListeners = function (
  this: IElementGenerator,
  elementVar: string,
  elementIR: IJSXElementIR
): ts.Statement[] {
  const factory = ts.factory;
  const statements: ts.Statement[] = [];

  if (!elementIR.events || elementIR.events.length === 0) {
    console.log('-----[PULSAR] generateEventListeners: No events for element:', elementVar);
    return statements;
  }

  console.log(
    '-----[PULSAR] generateEventListeners: Generating for',
    elementVar,
    'events:',
    elementIR.events.length
  );

  elementIR.events.forEach((event) => {
    console.log('-----[PULSAR] generateEventListeners: Adding addEventListener for', event.type);
    // el.addEventListener('click', handler)
    statements.push(
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier(elementVar),
            factory.createIdentifier('addEventListener')
          ),
          undefined,
          [factory.createStringLiteral(event.type), event.handler as ts.Expression]
        )
      )
    );

    // TODO: Handle event modifiers (passive, capture, once)
    // if (event.modifiers) { ... }
  });

  console.log(
    '-----[PULSAR] generateEventListeners: Generated',
    statements.length,
    'addEventListener calls'
  );
  return statements;
};
