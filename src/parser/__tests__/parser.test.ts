/**
 * Parser Integration Test
 * Test parsing of counter.psr fixture
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../index.js';

describe('Parser - Integration', () => {
  it('should parse empty program', () => {
    const lexer = createLexer('');
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Program');
    expect(ast.body).toHaveLength(0);
  });

  it('should parse simple variable declaration', () => {
    const source = `const count = 0;`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Program');
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('VariableDeclaration');
    expect((ast.body[0] as any).kind).toBe('const');
  });

  it('should parse array destructuring', () => {
    const source = `const [count, setCount] = createSignal(0);`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    const decl = ast.body[0] as any;
    expect(decl.type).toBe('VariableDeclaration');
    expect(decl.declarations[0].id.type).toBe('ArrayPattern');
    expect(decl.declarations[0].init.type).toBe('CallExpression');
  });

  it('should parse component declaration', () => {
    const source = `component Counter() {}`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('ComponentDeclaration');
    expect((ast.body[0] as any).name.name).toBe('Counter');
  });

  it('should parse import statement', () => {
    const source = `import { createSignal } from '@pulsar-framework/pulsar.dev';`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('ImportDeclaration');
    expect((ast.body[0] as any).specifiers).toHaveLength(1);
  });

  it('should parse simple JSX element', () => {
    const source = `const el = <div></div>;`;
    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    const decl = ast.body[0] as any;
    expect(decl.declarations[0].init.type).toBe('JSXElement');
  });
});

describe('Parser - Counter.psr Fixture', () => {
  it('should parse simplified counter.psr', () => {
    const source = `
import { createSignal } from '@pulsar-framework/pulsar.dev';

export component Counter() {
  const [count, setCount] = createSignal(0);
  
  const increment = () => {
    setCount(count() + 1);
  };
  
  return (
    <div>
      <h2>Counter: {count()}</h2>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Program');
    expect(ast.body.length).toBeGreaterThan(1);

    // Check import
    expect(ast.body[0].type).toBe('ImportDeclaration');

    // Check component export
    expect(ast.body[1].type).toBe('ExportNamedDeclaration');
    const component = (ast.body[1] as any).declaration;
    expect(component.type).toBe('ComponentDeclaration');
    expect(component.name.name).toBe('Counter');

    // Check body has statements
    expect(component.body.body.length).toBeGreaterThan(0);
  });
});
