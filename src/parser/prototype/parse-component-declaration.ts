/**
 * Parse Component Declaration
 *
 * Parses PSR component syntax into AST node.
 *
 * @example
 * component MyButton() { return <button>Click</button>; }
 */

import type {
  IComponentDeclarationNode,
  IIdentifierNode,
  IReturnStatementNode,
} from '../ast/index.js';
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

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseComponentDeclaration: START', {
      currentToken: startToken.type,
      position: this._current,
    });
  }

  // Consume 'component' keyword
  this._expect('COMPONENT', 'Expected "component" keyword');

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseComponentDeclaration: After consuming COMPONENT', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  // Parse component name
  const nameToken = this._expect('IDENTIFIER', 'Expected component name');
  const name: IIdentifierNode = {
    type: ASTNodeType.IDENTIFIER,
    name: nameToken!.value,
    location: {
      start: {
        line: nameToken!.line,
        column: nameToken!.column,
        offset: nameToken!.start,
      },
      end: {
        line: nameToken!.line,
        column: nameToken!.column + nameToken!.value.length,
        offset: nameToken!.end,
      },
    },
  };

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseComponentDeclaration: Component name parsed', {
      name: nameToken!.value,
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  // Parse parameters: () - optional when no parameters
  const params: IIdentifierNode[] = [];
  const hasParams = this._match('LPAREN');

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseComponentDeclaration: hasParams=${hasParams}`, {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  if (hasParams) {
    // Parse parameter list (if any)
    if (!this._check('RPAREN')) {
      if (this._logger) {
        this._logger.log('parser', 'debug', 'parseComponentDeclaration: Parsing params (not RPAREN)', {
          currentToken: this._getCurrentToken()?.type,
          position: this._current,
        });
      }
      do {
        // Check for object destructuring: { prop1, prop2, ...rest }
        if (this._check('LBRACE')) {
          this._advance(); // consume {

          const properties: any[] = [];

          // Parse destructuring properties
          while (!this._check('RBRACE') && !this._isAtEnd()) {
            // Check for rest parameter: ...rest
            if (this._check('SPREAD')) {
              this._advance(); // consume ...
              const restToken = this._expect('IDENTIFIER', 'Expected identifier after ...');

              properties.push({
                type: 'RestElement',
                argument: {
                  type: ASTNodeType.IDENTIFIER,
                  name: restToken!.value,
                  location: {
                    start: {
                      line: restToken!.line,
                      column: restToken!.column,
                      offset: restToken!.start,
                    },
                    end: {
                      line: restToken!.line,
                      column: restToken!.column + restToken!.value.length,
                      offset: restToken!.end,
                    },
                  },
                },
              });

              // Rest must be last
              break;
            }

            const propToken = this._expect('IDENTIFIER', 'Expected property name');

            // Check for default value: prop = value
            let defaultValue = null;
            if (this._match('ASSIGN')) {
              // Parse the default value expression
              defaultValue = this._parseExpression();
            }

            properties.push({
              type: 'Property',
              key: {
                type: ASTNodeType.IDENTIFIER,
                name: propToken!.value,
              },
              value: defaultValue
                ? {
                    type: 'AssignmentPattern',
                    left: {
                      type: ASTNodeType.IDENTIFIER,
                      name: propToken!.value,
                    },
                    right: defaultValue,
                  }
                : {
                    type: ASTNodeType.IDENTIFIER,
                    name: propToken!.value,
                  },
              location: {
                start: {
                  line: propToken!.line,
                  column: propToken!.column,
                  offset: propToken!.start,
                },
                end: {
                  line: propToken!.line,
                  column: propToken!.column + propToken!.value.length,
                  offset: propToken!.end,
                },
              },
            });

            if (!this._match('COMMA')) {
              break;
            }
          }

          this._expect('RBRACE', 'Expected "}" after destructuring properties');

          // Skip TypeScript type annotation if present (: type)
          if (this._match('COLON')) {
            // Track nesting depth for braces, brackets, and parentheses in type annotations
            let depth = 0;
            while (true) {
              const tok = this._peek(0);
              if (!tok || this._isAtEnd()) break;

              // Track opening delimiters
              if (tok.type === 'LBRACE' || tok.type === 'LBRACKET' || tok.type === 'LPAREN') {
                depth++;
              }
              // Track closing delimiters
              else if (tok.type === 'RBRACE' || tok.type === 'RBRACKET' || tok.type === 'RPAREN') {
                if (depth === 0) {
                  // We're at the closing paren of the parameter list
                  break;
                }
                depth--;
              }
              // Stop at comma if we're at depth 0 (between parameters)
              else if (tok.type === 'COMMA' && depth === 0) {
                break;
              }

              this._advance();
            }
          }

          // Add the whole destructuring pattern as a single parameter
          params.push({
            type: 'ObjectPattern',
            properties,
          } as any);

          continue;
        }

        // Simple parameter (not destructuring)
        const paramToken = this._expect('IDENTIFIER', 'Expected parameter name');

        // Skip TypeScript type annotation if present (: type)
        if (this._match('COLON')) {
          // Track nesting depth for complex types
          let depth = 0;
          while (true) {
            const tok = this._peek(0);
            if (!tok || this._isAtEnd()) break;

            if (tok.type === 'LBRACE' || tok.type === 'LBRACKET' || tok.type === 'LPAREN') {
              depth++;
            } else if (tok.type === 'RBRACE' || tok.type === 'RBRACKET' || tok.type === 'RPAREN') {
              if (depth === 0) break;
              depth--;
            } else if (tok.type === 'COMMA' && depth === 0) {
              break;
            }

            this._advance();
          }
        }

        params.push({
          type: ASTNodeType.IDENTIFIER,
          name: paramToken!.value,
          location: {
            start: {
              line: paramToken!.line,
              column: paramToken!.column,
              offset: paramToken!.start,
            },
            end: {
              line: paramToken!.line,
              column: paramToken!.column + paramToken!.value.length,
              offset: paramToken!.end,
            },
          },
        });
      } while (this._match('COMMA'));
    }

    if (this._logger) {
      this._logger.log('parser', 'debug', 'parseComponentDeclaration: About to expect RPAREN', {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      });
    }

    this._expect('RPAREN', 'Expected ")" after parameters');

    if (this._logger) {
      this._logger.log('parser', 'debug', 'parseComponentDeclaration: After RPAREN', {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      });
    }
  }

  // Skip TypeScript return type annotation if present (: ReturnType)
  if (this._match('COLON')) {
    if (this._logger) {
      this._logger.log('parser', 'debug', 'parseComponentDeclaration: Found COLON, skipping type annotation', {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      });
    }
    // Skip type tokens until we hit LBRACE (component body start)
    let typeSkipCount = 0;
    while (!this._check('LBRACE') && !this._isAtEnd()) {
      typeSkipCount++;
      if (this._logger && typeSkipCount % 10 === 0) {
        this._logger.log('parser', 'warn', `parseComponentDeclaration: Type skip iteration ${typeSkipCount}`, {
          currentToken: this._getCurrentToken()?.type,
          position: this._current,
        });
      }
      if (typeSkipCount > 100) {
        throw new Error(`Infinite loop while skipping type annotation at position ${this._current}`);
      }
      this._advance();
    }
    if (this._logger) {
      this._logger.log('parser', 'debug', `parseComponentDeclaration: Finished skipping type (${typeSkipCount} tokens)`, {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      });
    }
  }

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseComponentDeclaration: About to expect LBRACE', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  // Parse body: { ... }
  this._expect('LBRACE', 'Expected "{" before component body');

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseComponentDeclaration: After LBRACE, parsing body', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  const body: any[] = [];
  let returnStatement: IReturnStatementNode | null = null;
  let bodyIterations = 0;

  while (!this._check('RBRACE') && !this._isAtEnd()) {
    bodyIterations++;
    if (this._logger && bodyIterations % 10 === 0) {
      this._logger.log('parser', 'warn', `parseComponentDeclaration: Body parsing iteration ${bodyIterations}`, {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
        bodyStatements: body.length,
      });
    }
    if (bodyIterations > 1000) {
      throw new Error(`Infinite loop in component body parsing at position ${this._current}`);
    }
    const statement = this._parseStatement();
    if (statement) {
      if (statement.type === ASTNodeType.RETURN_STATEMENT) {
        returnStatement = statement as IReturnStatementNode;
      }
      body.push(statement);
      if (this._logger && body.length <= 10) {
        this._logger.log('parser', 'debug', `parseComponentDeclaration: Body statement ${body.length} added`, {
          statementType: statement.type,
          position: this._current,
        });
      }
    }
  }

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseComponentDeclaration: Finished body parsing (${body.length} statements)`, {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
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
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column + 1,
        offset: endToken!.end,
      },
    },
  };
}
