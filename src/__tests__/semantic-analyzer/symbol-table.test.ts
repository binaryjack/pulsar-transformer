/**
 * Unit tests for semantic analyzer - symbol table
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { SemanticAnalyzer } from '../../semantic-analyzer/index.js';

describe('SemanticAnalyzer - Symbol Table', () => {
  it('should declare and resolve global symbols', () => {
    const source = `const x = 1;
const y = 2;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    expect(result.symbolTable.globalScope.symbols.has('x')).toBe(true);
    expect(result.symbolTable.globalScope.symbols.has('y')).toBe(true);
  });

  it('should detect undeclared variables', () => {
    const source = `const x = y + 1;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('undeclared-variable');
    expect(result.errors[0].message).toContain('y');
  });

  it('should detect duplicate declarations', () => {
    const source = `const x = 1;
const x = 2;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('duplicate-declaration');
    expect(result.errors[0].message).toContain('x');
  });

  it('should handle function scopes', () => {
    const source = `const x = 1;
const fn = () => {
  const y = 2;
  return x + y;
};`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    // Global scope has x and fn
    expect(result.symbolTable.globalScope.symbols.has('x')).toBe(true);
    expect(result.symbolTable.globalScope.symbols.has('fn')).toBe(true);
    // Function scope has y
    const functionScope = result.symbolTable.globalScope.children[0];
    expect(functionScope).toBeDefined();
  });

  it('should detect unused variables', () => {
    const source = `const x = 1;
const y = 2;
const z = x + 1;`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(2); // y and z unused
    expect(result.warnings[0].type).toBe('unused-variable');
  });

  it('should handle array destructuring', () => {
    const source = `const [count, setCount] = createSignal(0);
const x = count();`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(1); // createSignal not declared
    expect(result.symbolTable.globalScope.symbols.has('count')).toBe(true);
    expect(result.symbolTable.globalScope.symbols.has('setCount')).toBe(true);
  });

  it('should handle component declarations', () => {
    const source = `component Counter() {
  const [count, setCount] = createSignal(0);
  return <button>{count()}</button>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.symbolTable.globalScope.symbols.has('Counter')).toBe(true);
    const counterSymbol = result.symbolTable.globalScope.symbols.get('Counter');
    expect(counterSymbol?.kind).toBe('component');
  });

  it('should handle parameters in components', () => {
    const source = `component Badge({ label, variant = 'primary' }: IBadgeProps) {
  return <span>{label}</span>;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.symbolTable.globalScope.symbols.has('Badge')).toBe(true);
    // Component scope should have label and variant as parameters
  });

  it('should handle interface declarations', () => {
    const source = `interface IProps {
  label: string;
  count: number;
}`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    expect(result.symbolTable.globalScope.symbols.has('IProps')).toBe(true);
    const propsSymbol = result.symbolTable.globalScope.symbols.get('IProps');
    expect(propsSymbol?.kind).toBe('interface');
  });

  it('should handle imports', () => {
    const source = `import { createSignal } from '@pulsar/core';
const [count, setCount] = createSignal(0);`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    expect(result.symbolTable.globalScope.symbols.has('createSignal')).toBe(true);
    const importSymbol = result.symbolTable.globalScope.symbols.get('createSignal');
    expect(importSymbol?.kind).toBe('import');
  });

  it('should detect unused imports', () => {
    const source = `import { createSignal, useEffect } from '@pulsar/core';
const [count, setCount] = createSignal(0);`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast);

    const result = analyzer.analyze();

    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    const unusedImport = result.warnings.find((w) => w.type === 'unused-import');
    expect(unusedImport).toBeDefined();
  });
});
