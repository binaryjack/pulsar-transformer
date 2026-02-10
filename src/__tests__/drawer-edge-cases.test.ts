/**
 * Test Drawer parsing edge cases
 */

import { describe, expect, it } from 'vitest';
import { createCodeGenerator } from '../code-generator/index.js';
import { createLexer } from '../lexer/index.js';
import { createParser } from '../parser/index.js';

describe('Drawer Parsing Edge Cases', () => {
  it('should parse multi-line destructured params', () => {
    const source = `
export const Drawer = ({
  open,
  placement = 'right',
  children
}: IDrawerProps): HTMLElement => {
  return <div>{children}</div>;
};
`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    expect(ast.body.length).toBeGreaterThan(0);
  });

  it('should handle JSX in return statement', () => {
    const source = `
export const Test = (): HTMLElement => {
  return <div />;
};
`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const codeGen = createCodeGenerator(ast);
    const code = codeGen.generate();

    expect(code).toContain('t_element');
  });

  it('should handle early return with JSX', () => {
    const source = `
export const Test = ({ show }): HTMLElement => {
  if (!show) return <div />;
  return <span />;
};
`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const codeGen = createCodeGenerator(ast);
    const code = codeGen.generate();

    expect(code).toContain('t_element');
  });
});
