import { createLexer } from './dist/index.js';

const test2 = `function map<T extends object>(obj: T): T { return obj; }`;

console.log('Input:', test2);
console.log('\nTokens:');

const lexer = createLexer(test2);
const tokens = lexer.scanTokens();

tokens.forEach((token, i) => {
  if (i >= 5 && i <= 12) {
    // Focus on the generic part
    console.log(`${i}: ${token.type.padEnd(15)} "${token.value}" at column ${token.column}`);
  }
});
