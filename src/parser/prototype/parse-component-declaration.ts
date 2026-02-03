/**
 * Parse Component Declaration
 *
 * Parses PSR component syntax into AST node.
 *
 * @example
 * component MyButton() { return <button>Click</button>; }
 */

import type { IComponentDeclarationNode, IIdentifierNode, IReturnStatementNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse component declaration
 *
 * Grammar:
 *   component Identifier ( Params? ) { Statement* }
 */
export function parseComponentDeclaration(this: IParserInternal): IComponentDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Consume 'component' keyword
  this._expect('COMPONENT', 'Expected "component" keyword');

  // Parse component name
  const nameToken = this._expect('IDENTIFIER', 'Expected component name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken.value,
    location: {
      start: {
        line: nameToken.line,
        column: nameToken.column,
        offset: nameToken.start,
      },
      end: {
        line: nameToken.line,
        column: nameToken.column + nameToken.value.length,
        offset: nameToken.end,
      },
    },
  };

  // Parse parameters: ()
  this._expect('LPAREN', 'Expected "(" after component name');

  const params: IIdentifierNode[] = [];

  // Parse parameter list (if any)
  if (!this._check('RPAREN')) {
    do {
      const paramToken = this._expect('IDENTIFIER', 'Expected parameter name');
      params.push({
        type: ASTNodeType.IDENTIFIER,
        name: paramToken.value,
        location: {
          start: {
            line: paramToken.line,
            column: paramToken.column,
            offset: paramToken.start,
          },
          end: {
            line: paramToken.line,
            column: paramToken.column + paramToken.value.length,
            offset: paramToken.end,
          },
        },
      });
    } while (this._match('COMMA'));
  }

  this._expect('RPAREN', 'Expected ")" after parameters');

  // Parse body: { ... }
  this._expect('LBRACE', 'Expected "{" before component body');

  const body: any[] = [];
  let returnStatement: IReturnStatementNode | null = null;

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const statement = this._parseStatement();
    if (statement) {
      if (statement.type === ASTNodeType.RETURN_STATEMENT) {
        returnStatement = statement as IReturnStatementNode;
      }
      body.push(statement);
    }
  }

  const endToken = this._expect('RBRACE', 'Expected "}" after component body');

  return {
    type: ASTNodeType.COMPONENT_DECLARATION,
    name,
    params,
    body,
    returnStatement,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column + 1,
        offset: endToken.end,
      },
    },
  };
}
