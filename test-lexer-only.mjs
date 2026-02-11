/**
 * Test lexer output for generic type syntax
 */

import { createLexer } from './dist/index.js';

const code = 'function identity<T>(value: T): T { return value; }';

console.log('Input:', code);
console.log('\nTokenizing...\n');

try {
  const lexer = createLexer(code);
  console.log('Lexer created');

  const tokens = lexer.scanTokens();
  console.log('Tokens scanned');

  console.log(`\nGenerated ${tokens.length} tokens:\n`);
  tokens.forEach((token, i) => {
    console.log(`${i}: ${token.type.padEnd(20)} "${token.value}" at ${token.line}:${token.column}`);
  });
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
