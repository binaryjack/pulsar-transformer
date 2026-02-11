/**
 * Parser.prototype.parseVariableDeclaration
 * const [count, setCount] = createSignal(0);
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';
import { Parser } from '../parser.js';
import type { IPattern, IVariableDeclaration, IVariableDeclarator } from '../parser.types.js';

Parser.prototype.parseVariableDeclaration = function (this: IParser): IVariableDeclaration {
  const start = this.peek().start;

  const kindToken = this.advance(); // const, let, or var
  const kind = kindToken.value as 'const' | 'let' | 'var';

  const declarations: IVariableDeclarator[] = [];

  do {
    // Parse pattern (identifier or destructuring)
    let id: IPattern;

    if (this.match(TokenTypeEnum.LBRACKET)) {
      // Array destructuring: [count, setCount]
      const patternStart = this.peek().start;
      this.advance();

      const elements: (IPattern | null)[] = [];

      while (!this.match(TokenTypeEnum.RBRACKET) && !this.isAtEnd()) {
        if (this.match(TokenTypeEnum.COMMA)) {
          elements.push(null);
          this.advance();
        } else {
          const idToken = this.expect(TokenTypeEnum.IDENTIFIER);
          elements.push({
            type: 'Identifier',
            name: idToken.value,
            start: idToken.start,
            end: idToken.end,
          });

          if (this.match(TokenTypeEnum.COMMA)) {
            this.advance();
          }
        }
      }

      const patternEnd = this.peek().end;
      this.expect(TokenTypeEnum.RBRACKET);

      id = {
        type: 'ArrayPattern',
        elements,
        start: patternStart,
        end: patternEnd,
      };
    } else if (this.match(TokenTypeEnum.LBRACE)) {
      // Object destructuring: {label, icon}
      const patternStart = this.peek().start;
      this.advance();

      const properties: any[] = [];

      while (!this.match(TokenTypeEnum.RBRACE) && !this.isAtEnd()) {
        const keyToken = this.expect(TokenTypeEnum.IDENTIFIER);

        // TODO: Support {key: value} syntax
        properties.push({
          type: 'Property',
          key: {
            type: 'Identifier',
            name: keyToken.value,
            start: keyToken.start,
            end: keyToken.end,
          },
          value: {
            type: 'Identifier',
            name: keyToken.value,
            start: keyToken.start,
            end: keyToken.end,
          },
          shorthand: true,
          start: keyToken.start,
          end: keyToken.end,
        });

        if (this.match(TokenTypeEnum.COMMA)) {
          this.advance();
        }
      }

      const patternEnd = this.peek().end;
      this.expect(TokenTypeEnum.RBRACE);

      id = {
        type: 'ObjectPattern',
        properties,
        start: patternStart,
        end: patternEnd,
      };
    } else {
      // Simple identifier
      const idToken = this.expect(TokenTypeEnum.IDENTIFIER);
      id = {
        type: 'Identifier',
        name: idToken.value,
        start: idToken.start,
        end: idToken.end,
      };

      // Check for type annotation: const x: Type = ...
      if (this.match(TokenTypeEnum.COLON)) {
        this.advance(); // consume :
        // Parse type annotation (handles complex types like string[], () => void, etc.)
        const typeAnnotation = this.parseTypeAnnotation();
        (id as any).typeAnnotation = typeAnnotation;
      }
    }

    // Initializer
    let init = null;
    if (this.match(TokenTypeEnum.EQUALS)) {
      this.advance();
      init = this.parseExpression();
    }

    declarations.push({
      type: 'VariableDeclarator',
      id,
      init,
      start: id.start,
      end: init?.end || id.end,
    });

    if (this.match(TokenTypeEnum.COMMA)) {
      this.advance();
    }
  } while (
    !this.match(TokenTypeEnum.SEMICOLON) &&
    !this.isAtEnd() &&
    this.peek().line === this.peek(-1).line
  );

  // Optional semicolon
  if (this.match(TokenTypeEnum.SEMICOLON)) {
    this.advance();
  }

  const end = declarations[declarations.length - 1].end;

  return {
    type: 'VariableDeclaration',
    kind,
    declarations,
    start,
    end,
  };
};
