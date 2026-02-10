/**
 * Lexer Unit Tests
 * Tests tokenization of PSR source code
 */

import { describe, expect, it } from 'vitest';
import { createLexer, TokenTypeEnum } from '../index';

describe('Lexer - Basic Tokenization', () => {
  it('should tokenize empty source', () => {
    const lexer = createLexer('');
    const tokens = lexer.scanTokens();

    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenTypeEnum.EOF);
  });

  it('should tokenize simple identifier', () => {
    const lexer = createLexer('counter');
    const tokens = lexer.scanTokens();

    expect(tokens).toHaveLength(2); // IDENTIFIER + EOF
    expect(tokens[0].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[0].value).toBe('counter');
  });

  it('should recognize keywords', () => {
    const lexer = createLexer('const component return');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.CONST);
    expect(tokens[1].type).toBe(TokenTypeEnum.COMPONENT);
    expect(tokens[2].type).toBe(TokenTypeEnum.RETURN);
  });

  it('should tokenize string literals', () => {
    const lexer = createLexer('"hello world"');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.STRING);
    expect(tokens[0].value).toBe('hello world');
  });

  it('should tokenize numbers', () => {
    const lexer = createLexer('42 3.14');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.NUMBER);
    expect(tokens[0].value).toBe('42');
    expect(tokens[1].type).toBe(TokenTypeEnum.NUMBER);
    expect(tokens[1].value).toBe('3.14');
  });

  it('should tokenize operators', () => {
    const lexer = createLexer('= == === => + - * /');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.EQUALS);
    expect(tokens[1].type).toBe(TokenTypeEnum.EQUALS_EQUALS);
    expect(tokens[2].type).toBe(TokenTypeEnum.EQUALS_EQUALS_EQUALS);
    expect(tokens[3].type).toBe(TokenTypeEnum.ARROW);
    expect(tokens[4].type).toBe(TokenTypeEnum.PLUS);
    expect(tokens[5].type).toBe(TokenTypeEnum.MINUS);
    expect(tokens[6].type).toBe(TokenTypeEnum.STAR);
  });

  it('should tokenize delimiters', () => {
    const lexer = createLexer('( ) { } [ ] ; , : ? . ...');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.LPAREN);
    expect(tokens[1].type).toBe(TokenTypeEnum.RPAREN);
    expect(tokens[2].type).toBe(TokenTypeEnum.LBRACE);
    expect(tokens[3].type).toBe(TokenTypeEnum.RBRACE);
    expect(tokens[4].type).toBe(TokenTypeEnum.LBRACKET);
    expect(tokens[5].type).toBe(TokenTypeEnum.RBRACKET);
    expect(tokens[6].type).toBe(TokenTypeEnum.SEMICOLON);
    expect(tokens[7].type).toBe(TokenTypeEnum.COMMA);
    expect(tokens[8].type).toBe(TokenTypeEnum.COLON);
    expect(tokens[9].type).toBe(TokenTypeEnum.QUESTION);
    expect(tokens[10].type).toBe(TokenTypeEnum.DOT);
    expect(tokens[11].type).toBe(TokenTypeEnum.SPREAD);
  });

  it('should tokenize comments', () => {
    const lexer = createLexer('// single line\n/* multi line */');
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.COMMENT);
    expect(tokens[0].value).toBe('// single line');
    expect(tokens[1].type).toBe(TokenTypeEnum.COMMENT);
    expect(tokens[1].value).toBe('/* multi line */');
  });

  it('should tokenize simple component structure', () => {
    const source = `component Counter() {}`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.COMPONENT);
    expect(tokens[1].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[1].value).toBe('Counter');
    expect(tokens[2].type).toBe(TokenTypeEnum.LPAREN);
    expect(tokens[3].type).toBe(TokenTypeEnum.RPAREN);
    expect(tokens[4].type).toBe(TokenTypeEnum.LBRACE);
    expect(tokens[5].type).toBe(TokenTypeEnum.RBRACE);
  });

  it('should track line and column positions', () => {
    const source = `const\ncount`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    expect(tokens[0].line).toBe(1);
    expect(tokens[1].line).toBe(2);
  });
});

describe('Lexer - Complex Tokenization', () => {
  it('should tokenize import statement', () => {
    const source = `import { createSignal } from '@pulsar-framework/pulsar.dev';`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.IMPORT);
    expect(tokens[1].type).toBe(TokenTypeEnum.LBRACE);
    expect(tokens[2].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[2].value).toBe('createSignal');
    expect(tokens[3].type).toBe(TokenTypeEnum.RBRACE);
    expect(tokens[4].type).toBe(TokenTypeEnum.FROM);
    expect(tokens[5].type).toBe(TokenTypeEnum.STRING);
  });

  it('should tokenize arrow function', () => {
    const source = `const fn = () => {}`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.CONST);
    expect(tokens[1].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[2].type).toBe(TokenTypeEnum.EQUALS);
    expect(tokens[3].type).toBe(TokenTypeEnum.LPAREN);
    expect(tokens[4].type).toBe(TokenTypeEnum.RPAREN);
    expect(tokens[5].type).toBe(TokenTypeEnum.ARROW);
    expect(tokens[6].type).toBe(TokenTypeEnum.LBRACE);
    expect(tokens[7].type).toBe(TokenTypeEnum.RBRACE);
  });

  it('should tokenize destructuring', () => {
    const source = `const [count, setCount] = createSignal(0);`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    expect(tokens[0].type).toBe(TokenTypeEnum.CONST);
    expect(tokens[1].type).toBe(TokenTypeEnum.LBRACKET);
    expect(tokens[2].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[2].value).toBe('count');
    expect(tokens[3].type).toBe(TokenTypeEnum.COMMA);
    expect(tokens[4].type).toBe(TokenTypeEnum.IDENTIFIER);
    expect(tokens[4].value).toBe('setCount');
    expect(tokens[5].type).toBe(TokenTypeEnum.RBRACKET);
  });
});
