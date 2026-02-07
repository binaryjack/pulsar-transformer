/**
 * Parse Function Declaration
 *
 * Parses function declarations.
 *
 * @example
 * function greet(name: string): string { return "Hello"; }
 * async function fetchData(): Promise<Data> { ... }
 */

import type {
  IFunctionDeclarationNode,
  IIdentifierNode,
  ITypeAnnotationNode,
} from '../ast/index.js'
import { ASTNodeType } from '../ast/index.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

/**
 * Parse function declaration
 *
 * Grammar:
 *   [async] function Identifier ( [params] ) [: ReturnType] { body }
 */
export function parseFunctionDeclaration(this: IParserInternal): IFunctionDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Check for async
  let isAsync = false;
  if (startToken.type === TokenType.ASYNC) {
    isAsync = true;
    this._advance();
  }

  // function keyword
  this._expect('FUNCTION', 'Expected function keyword');

  // Check for generator (function*)
  let isGenerator = false;
  if (this._check('ASTERISK')) {
    isGenerator = true;
    this._advance();
  }

  // Function name
  const nameToken = this._expect('IDENTIFIER', 'Expected function name');
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

  // Parameters: ( ... )
  this._expect('LPAREN', 'Expected ( after function name');

  const params: Array<{ name: IIdentifierNode; typeAnnotation?: ITypeAnnotationNode }> = [];

  if (!this._check('RPAREN')) {
    do {
      const paramToken = this._expect('IDENTIFIER', 'Expected parameter name');
      const paramName: IIdentifierNode = {
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
      };

      // Optional type annotation: : Type
      let typeAnnotation: ITypeAnnotationNode | undefined;
      if (this._check('COLON')) {
        this._advance(); // consume :

        this._lexer.enterTypeContext(); // PHASE 3: Enable type-aware tokenization

        // Read type tokens until we hit , or ) at depth 0
        const typeTokens: string[] = [];
        let braceDepth = 0;
        let bracketDepth = 0;
        let parenDepth = 0;
        let angleDepth = 0;

        while (!this._isAtEnd()) {
          const token = this._getCurrentToken();
          if (!token) break;

          // Stop at , or ) only if all brackets are balanced
          if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && angleDepth === 0) {
            if (token.type === 'COMMA' || token.type === 'RPAREN') {
              break;
            }
          }

          // Collect token value
          typeTokens.push(token.value);
          this._advance();

          // Track depth for balanced parsing AFTER collecting
          const collectedToken = token;
          if (collectedToken!.type === 'LBRACE') braceDepth++;
          else if (collectedToken!.type === 'RBRACE') braceDepth--;
          else if (collectedToken!.type === 'LBRACKET') bracketDepth++;
          else if (collectedToken!.type === 'RBRACKET') bracketDepth--;
          else if (collectedToken!.type === 'LPAREN') parenDepth++;
          else if (collectedToken!.type === 'RPAREN') parenDepth--;
          else if (collectedToken!.value === '<') angleDepth++;
          else if (collectedToken!.value === '>') angleDepth--;
        }

        this._lexer.exitTypeContext(); // PHASE 3: Restore normal tokenization

        if (typeTokens.length > 0) {
          typeAnnotation = {
            type: ASTNodeType.TYPE_ANNOTATION,
            typeString: typeTokens.join(' ').trim(),
            location: {
              start: {
                line: paramToken!.line,
                column: paramToken!.column,
                offset: paramToken!.start,
              },
              end: { line: paramToken!.line, column: paramToken!.column, offset: paramToken!.end },
            },
          };
        }
      }

      params.push({ name: paramName, typeAnnotation });
    } while (this._match('COMMA'));
  }

  this._expect('RPAREN', 'Expected ) after parameters');

  // Optional return type: : ReturnType
  let returnType: ITypeAnnotationNode | undefined;
  if (this._check('COLON')) {
    this._advance(); // consume :

    this._lexer.enterTypeContext(); // PHASE 3: Enable type-aware tokenization

    const typeTokens: string[] = [];
    let braceDepth = 0;
    let bracketDepth = 0;
    let parenDepth = 0;
    let angleDepth = 0;

    while (!this._isAtEnd()) {
      const token = this._getCurrentToken();
      if (!token) break;

      // Stop at { when all brackets balanced AND we've collected at least one closing brace
      // (This prevents breaking on the opening brace of object type like { name: string })
      if (
        typeTokens.length > 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        parenDepth === 0 &&
        angleDepth === 0 &&
        token.type === 'LBRACE'
      ) {
        break;
      }

      // Collect token value
      typeTokens.push(token.value);
      this._advance();

      // Track depth AFTER collecting
      const collectedToken = token;
      if (collectedToken!.type === 'LBRACE') braceDepth++;
      else if (collectedToken!.type === 'RBRACE') braceDepth--;
      else if (collectedToken!.type === 'LBRACKET') bracketDepth++;
      else if (collectedToken!.type === 'RBRACKET') bracketDepth--;
      else if (collectedToken!.type === 'LPAREN') parenDepth++;
      else if (collectedToken!.type === 'RPAREN') parenDepth--;
      else if (collectedToken!.value === '<') angleDepth++;
      else if (collectedToken!.value === '>') angleDepth--;
    }

    this._lexer.exitTypeContext(); // PHASE 3: Restore normal tokenization

    if (typeTokens.length > 0) {
      returnType = {
        type: ASTNodeType.TYPE_ANNOTATION,
        typeString: typeTokens.join(' ').trim(),
        location: {
          start: { line: nameToken!.line, column: nameToken!.column, offset: nameToken!.start },
          end: { line: nameToken!.line, column: nameToken!.column, offset: nameToken!.end },
        },
      };
    }
  }

  // Function body: { ... }
  this._expect('LBRACE', 'Expected { before function body');

  const bodyStatements: any[] = [];
  while (!this._check('RBRACE') && !this._isAtEnd()) {
    const stmt = this._parseStatement();
    if (stmt) {
      bodyStatements.push(stmt);
    }
  }

  this._expect('RBRACE', 'Expected } after function body');

  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.FUNCTION_DECLARATION,
    name,
    params,
    returnType,
    body: {
      type: ASTNodeType.BLOCK_STATEMENT,
      body: bodyStatements,
      location: {
        start: { line: startToken!.line, column: startToken!.column, offset: startToken!.start },
        end: { line: endToken!.line, column: endToken!.column, offset: endToken!.end },
      },
    },
    async: isAsync ? true : undefined,
    generator: isGenerator ? true : undefined,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.end,
      },
    },
  };
}
