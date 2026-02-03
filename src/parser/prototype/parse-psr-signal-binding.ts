/**
 * Parse Signal Binding
 *
 * Parses $(signal) syntax into AST node.
 *
 * @example
 * $(count)
 * $(user.name)
 */

import type { IIdentifierNode, IPSRSignalBindingNode } from '../ast';
import { ASTNodeType } from '../ast';
import type { IParserInternal } from '../parser.types';

/**
 * Parse signal binding: $(identifier)
 */
export function parsePSRSignalBinding(this: IParserInternal): IPSRSignalBindingNode {
  const startToken = this._getCurrentToken()!;

  // Token from lexer is already SIGNAL_BINDING type: "$(identifier)"
  // Extract identifier from "$(identifier)" string
  const fullValue = startToken.value; // "$(count)"
  const match = fullValue.match(/\$\(([^)]+)\)/);

  if (!match) {
    this._addError({
      code: 'PSR-E004',
      message: `Invalid signal binding: ${fullValue}`,
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    throw new Error(`Invalid signal binding: ${fullValue}`);
  }

  const signalName = match[1]; // "count"

  this._advance(); // Consume SIGNAL_BINDING token

  const identifier: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: signalName,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column + 2, // Skip "$("
        offset: startToken.start + 2,
      },
      end: {
        line: startToken.line,
        column: startToken.column + 2 + signalName.length,
        offset: startToken.start + 2 + signalName.length,
      },
    },
  };

  return {
    type: ASTNodeType.PSR_SIGNAL_BINDING,
    identifier,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: startToken.line,
        column: startToken.column + fullValue.length,
        offset: startToken.end,
      },
    },
  };
}
