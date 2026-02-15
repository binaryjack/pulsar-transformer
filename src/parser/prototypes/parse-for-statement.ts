/**
 * Parser.prototype.parseForStatement
 * for (init; test; update) { ... }
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IForStatement } from '../parser.types.js';

Parser.prototype.parseForStatement = function (this: IParser): IForStatement {
  const start = this.peek().start;

  this.expect(TokenTypeEnum.FOR);
  this.expect(TokenTypeEnum.LPAREN);

  // Parse init (variable declaration or expression or null)
  let init: any = null;
  if (!this.match(TokenTypeEnum.SEMICOLON)) {
    if (
      this.match(TokenTypeEnum.VAR) ||
      this.match(TokenTypeEnum.LET) ||
      this.match(TokenTypeEnum.CONST)
    ) {
      // Parse single variable declaration for for loop: let i = 0
      const start = this.peek().start;
      const kindToken = this.advance(); // consume let/const/var
      const kind = kindToken.value as 'const' | 'let' | 'var';

      const idToken = this.expect(TokenTypeEnum.IDENTIFIER);
      const id = {
        type: 'Identifier',
        name: idToken.value,
        start: idToken.start,
        end: idToken.end,
      };

      // Initializer (= expression)
      let initExpr = null;
      if (this.match(TokenTypeEnum.EQUALS)) {
        this.advance(); // consume =
        initExpr = this.parseExpression();
      }

      // Create single variable declarator
      const declarator = {
        type: 'VariableDeclarator',
        id,
        init: initExpr,
        start: id.start,
        end: initExpr?.end || id.end,
      };

      init = {
        type: 'VariableDeclaration',
        kind,
        declarations: [declarator],
        start,
        end: declarator.end,
      };
    } else {
      init = this.parseExpression();
    }
  }

  // Expect first semicolon for traditional for loop
  this.expect(TokenTypeEnum.SEMICOLON);

  // Parse test (expression or null)
  let test: any = null;
  if (!this.match(TokenTypeEnum.SEMICOLON)) {
    test = this.parseExpression();
  }
  this.expect(TokenTypeEnum.SEMICOLON);

  // Parse update (expression or null)
  let update: any = null;
  if (!this.match(TokenTypeEnum.RPAREN)) {
    update = this.parseExpression();
  }
  this.expect(TokenTypeEnum.RPAREN);

  // Parse body
  const body = this.parseStatement();

  const end = body!.end;

  return {
    type: 'ForStatement',
    init,
    test,
    update,
    body: body!,
    start,
    end,
  };
};
