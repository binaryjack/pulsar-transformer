/**
 * Minimal test for nested arrow functions with type annotations
 */

import { describe, expect, it } from 'vitest';
import { createCodeGenerator } from '../code-generator/index.js';
import { createLexer } from '../lexer/index.js';
import { createParser } from '../parser/index.js';

describe('Nested Arrow Functions', () => {
  it('should parse arrow function with typed parameter inside another arrow', () => {
    const source = `
export const Test = (): void => {
  const handler = (e: KeyboardEvent) => {
    console.log(e);
  };
};
`;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();
    const codeGen = createCodeGenerator(ast);
    const code = codeGen.generate();

    console.log('Generated:', code);
    expect(code).toContain('KeyboardEvent');
    expect(code).toContain('handler');
  });
});
