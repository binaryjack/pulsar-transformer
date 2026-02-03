/**
 * Lexer Tests
 *
 * Unit tests for PSR lexer tokenization.
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../create-lexer.js';
import { TokenType } from '../token-types.js';

describe('Lexer', () => {
  describe('tokenize', () => {
    it('should tokenize component keyword', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('component');

      expect(tokens).toHaveLength(2); // COMPONENT + EOF
      expect(tokens[0].type).toBe(TokenType.COMPONENT);
      expect(tokens[0].value).toBe('component');
      expect(tokens[1].type).toBe(TokenType.EOF);
    });

    it('should tokenize identifiers', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('MyButton count setCount');

      expect(tokens).toHaveLength(4); // 3 identifiers + EOF
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe('MyButton');
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('count');
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].value).toBe('setCount');
    });

    it('should tokenize numbers', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('42 3.14');

      expect(tokens).toHaveLength(3); // 2 numbers + EOF
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe('42');
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe('3.14');
    });

    it('should tokenize strings', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('"hello" \'world\'');

      expect(tokens).toHaveLength(3); // 2 strings + EOF
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('hello');
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[1].value).toBe('world');
    });

    it('should tokenize signal binding', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('$(count)');

      expect(tokens).toHaveLength(2); // SIGNAL_BINDING + EOF
      expect(tokens[0].type).toBe(TokenType.SIGNAL_BINDING);
      expect(tokens[0].value).toBe('$(count)');
    });

    it('should tokenize delimiters', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('(){}<>[]');

      expect(tokens[0].type).toBe(TokenType.LPAREN);
      expect(tokens[1].type).toBe(TokenType.RPAREN);
      expect(tokens[2].type).toBe(TokenType.LBRACE);
      expect(tokens[3].type).toBe(TokenType.RBRACE);
      expect(tokens[4].type).toBe(TokenType.LT);
      expect(tokens[5].type).toBe(TokenType.GT);
      expect(tokens[6].type).toBe(TokenType.LBRACKET);
      expect(tokens[7].type).toBe(TokenType.RBRACKET);
    });

    it('should tokenize arrow function', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('=>');

      expect(tokens).toHaveLength(2); // ARROW + EOF
      expect(tokens[0].type).toBe(TokenType.ARROW);
      expect(tokens[0].value).toBe('=>');
    });

    it('should tokenize simple component', () => {
      const lexer = createLexer();
      const source = 'component MyButton() { return <button>Click</button>; }';
      const tokens = lexer.tokenize(source);

      expect(tokens[0].type).toBe(TokenType.COMPONENT);
      expect(tokens[0].value).toBe('component');

      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('MyButton');

      expect(tokens[2].type).toBe(TokenType.LPAREN);
      expect(tokens[3].type).toBe(TokenType.RPAREN);
      expect(tokens[4].type).toBe(TokenType.LBRACE);

      expect(tokens[5].type).toBe(TokenType.RETURN);
      expect(tokens[5].value).toBe('return');
    });

    it('should track line and column numbers', () => {
      const lexer = createLexer();
      const source = `component Test() {
  const x = 10;
  return <div>Test</div>;
}`;
      const tokens = lexer.tokenize(source);

      // component keyword (line 1, column 1)
      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);

      // Find 'const' token (line 2)
      const constToken = tokens.find((t) => t.type === TokenType.CONST);
      expect(constToken?.line).toBe(2);

      // Find second 'return' (line 3)
      const returnToken = tokens.find((t) => t.type === TokenType.RETURN);
      expect(returnToken?.line).toBe(3);
    });

    it('should handle edge case: empty string', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('');

      expect(tokens).toHaveLength(1); // Only EOF
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle edge case: only whitespace', () => {
      const lexer = createLexer();
      const tokens = lexer.tokenize('   \t\n   ');

      expect(tokens).toHaveLength(1); // Only EOF (whitespace skipped)
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should throw on unexpected character', () => {
      const lexer = createLexer();

      expect(() => lexer.tokenize('@')).toThrow(/PSR-E001/);
      expect(() => lexer.tokenize('#')).toThrow(/PSR-E001/);
    });
  });

  describe('peek', () => {
    it('should peek at next token without consuming', () => {
      const lexer = createLexer();
      lexer.tokenize('component MyButton');

      const first = lexer.peek();
      expect(first?.type).toBe(TokenType.COMPONENT);

      // Peek again - should return same token
      const second = lexer.peek();
      expect(second?.type).toBe(TokenType.COMPONENT);
    });
  });

  describe('getPosition', () => {
    it('should return current position', () => {
      const lexer = createLexer();
      lexer.tokenize('component');

      const pos = lexer.getPosition();
      expect(pos.position).toBeGreaterThanOrEqual(0);
      expect(pos.line).toBeGreaterThanOrEqual(1);
      expect(pos.column).toBeGreaterThanOrEqual(1);
    });
  });
});
