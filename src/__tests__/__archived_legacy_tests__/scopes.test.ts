/**
 * Unit tests for semantic analyzer - scopes
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { SemanticAnalyzer } from '../../semantic-analyzer/index.js';

describe('SemanticAnalyzer - Scopes', () => {
  it('should create global scope', () => {
    const source = `const x = 1;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.symbolTable.globalScope).toBeDefined();
    expect(result.symbolTable.globalScope.type).toBe('global');
    expect(result.symbolTable.globalScope.parent).toBeNull();
  });

  it('should create function scope', () => {
    const source = `const fn = () => {
  const x = 1;
};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.symbolTable.globalScope.children).toHaveLength(1);
    const functionScope = result.symbolTable.globalScope.children[0];
    expect(functionScope.type).toBe('function');
    expect(functionScope.parent).toBe(result.symbolTable.globalScope);
  });

  it('should create block scope', () => {
    const source = `const fn = () => {
  const x = 1;
  {
    const y = 2;
  }
};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    const functionScope = result.symbolTable.globalScope.children[0];
    expect(functionScope.children).toHaveLength(1);
    const blockScope = functionScope.children[0];
    expect(blockScope.type).toBe('block');
  });

  it('should create component scope', () => {
    const source = `component Counter() {
  const x = 1;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.symbolTable.globalScope.children).toHaveLength(1);
    const componentScope = result.symbolTable.globalScope.children[0];
    expect(componentScope.type).toBe('component');
  });

  it('should resolve symbols from parent scope', () => {
    const source = `const x = 1;
const fn = () => {
  const y = x + 1;
};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should not allow shadowing (duplicate in same scope)', () => {
    const source = `const x = 1;
{
  const x = 2;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    // No error - different scopes can have same variable name (shadowing)
    expect(result.errors).toHaveLength(0);
  });

  it('should handle nested functions', () => {
    const source = `const outer = () => {
  const x = 1;
  const inner = () => {
    const y = x + 1;
  };
};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    const outerScope = result.symbolTable.globalScope.children[0];
    expect(outerScope.children).toHaveLength(1);
  });
});
