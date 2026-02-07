import { createLexer } from './src/parser/lexer/index.js';

const lexer = createLexer();
const source = '<></>';
console.log('Tokenizing source:', source);

const tokens = lexer.tokenize(source);
console.log('Tokens:');
tokens.forEach((token, index) => {
  console.log(`${index}: ${token.type} "${token.value}" at ${token.line}:${token.column}`);
});
