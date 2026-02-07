import { createLexer } from './dist/parser/lexer/index.js';

const lexer = createLexer();
const source = '<></>';

console.log('Source:', source);
console.log('\nTokens:');

const tokens = lexer.tokenize(source);
tokens.forEach((token, i) => {
  console.log(`${i}: ${token.type} = "${token.value}" (line ${token.line}, col ${token.column})`);
});
