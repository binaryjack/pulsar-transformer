import type { IYieldExpressionNode } from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { TokenType } from '../lexer/token-types.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse yield expression
 *
 * @example
 * yield value;
 * yield* iterable;
 */
export function _parseYieldExpression(this: IParserInternal): IYieldExpressionNode {
  const startToken = this._getCurrentToken()!;

  // Expect yield
  if (startToken.type !== TokenType.YIELD) {
    throw new Error(`Expected yield at line ${startToken.line}`);
  }

  this._advance(); // consume yield

  // Check for delegate (yield*)
  let delegate = false;
  const next = this._getCurrentToken()!;
  if (next.type === TokenType.ASTERISK) {
    delegate = true;
    this._advance(); // consume *
  }

  // Parse argument (optional)
  let argument: any = null;
  let lastToken = startToken!; // Track last consumed token
  const current = this._getCurrentToken();

  // If next token is not semicolon or newline, parse expression
  if (current && current.type !== TokenType.SEMICOLON && current.type !== TokenType.NEWLINE) {
    // Simple expression parsing (just get the identifier/literal)
    argument = _parseSimpleExpression.call(this);
    lastToken = this._getCurrentToken()!; // Update after parsing
  } else if (delegate) {
    // For yield*, last token is the * token
    lastToken = this._getCurrentToken()!;
  }

  const endToken = lastToken!;

  return {
    type: ASTNodeType.YIELD_EXPRESSION,
    argument,
    delegate,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}

/**
 * Parse simple expression (identifier or literal)
 */
function _parseSimpleExpression(this: IParserInternal): any {
  const token = this._getCurrentToken()!;

  if (token.type === TokenType.IDENTIFIER) {
    const node = {
      type: ASTNodeType.IDENTIFIER,
      name: token.value,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    };
    this._advance();
    return node;
  }

  if (token.type === TokenType.NUMBER || token.type === TokenType.STRING) {
    const node = {
      type: ASTNodeType.LITERAL,
      value: token.value,
      location: {
        start: {
          line: token.line,
          column: token.column,
          offset: token.start,
        },
        end: {
          line: token.line,
          column: token.column + token.value.length,
          offset: token.end,
        },
      },
    };
    this._advance();
    return node;
  }

  this._advance();
  return null;
}
