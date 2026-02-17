/**
 * Unit tests for semantic analyzer - type checking
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { SemanticAnalyzer } from '../../semantic-analyzer/index.js';

describe('SemanticAnalyzer - Type Checking', () => {
  it('should infer type from type annotation', () => {
    const source = `const x: number = 1;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    const xSymbol = result.symbolTable.globalScope.symbols.get('x');
    expect(xSymbol?.type).toBe('number');
  });

  it('should infer type from literal', () => {
    const source = `const x = 42;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    const xSymbol = result.symbolTable.globalScope.symbols.get('x');
    expect(xSymbol?.type).toBe('number');
  });

  it('should track parameter types', () => {
    const source = `const fn = (x: number, y: string): void => {};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should track return types', () => {
    const source = `const fn = (): number => 42;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should handle union types', () => {
    const source = `const variant: 'primary' | 'secondary' = 'primary';`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should handle array types', () => {
    const source = `const items: string[] = ['a', 'b'];`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should handle function types', () => {
    const source = `const onClick: () => void = () => {};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });
});
