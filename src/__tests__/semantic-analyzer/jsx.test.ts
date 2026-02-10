/**
 * Unit tests for semantic analyzer - JSX validation
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { SemanticAnalyzer } from '../../semantic-analyzer/index.js';

describe('SemanticAnalyzer - JSX', () => {
  it('should validate HTML elements (no error)', () => {
    const source = `component App() {
  return <div>Hello</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should detect undeclared component', () => {
    const source = `component App() {
  return <Counter />;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Counter');
  });

  it('should validate declared component', () => {
    const source = `component Counter() {
  return <div>0</div>;
}

component App() {
  return <Counter />;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should validate JSX expressions', () => {
    const source = `component App() {
  const count = 0;
  return <div>{count}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });

  it('should detect undeclared variable in JSX expression', () => {
    const source = `component App() {
  return <div>{count}</div>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('count');
  });

  it('should validate event handlers', () => {
    const source = `component App() {
  const handleClick = () => {};
  return <button onClick={handleClick}>Click</button>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
  });
});
