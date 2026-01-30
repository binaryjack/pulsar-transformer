/**
 * Create a variable declaration
 * Example: const myVar = value
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function createVariable(
  name: string,
  value: ts.Expression,
  flags: ts.NodeFlags = ts.NodeFlags.Const
): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          value
        ),
      ],
      flags
    )
  );
}
