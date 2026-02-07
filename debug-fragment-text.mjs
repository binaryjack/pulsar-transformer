import { createLexer } from './dist/parser/lexer/index.js';

const testCases = ['<></>', '<>Hello</>', '<>Text and <span>element</span></>'];

testCases.forEach((source) => {
  const lexer = createLexer();
  console.log(`\nSource: ${source}`);
  console.log('Tokens:');

  const tokens = lexer.tokenize(source);
  tokens.forEach((token, i) => {
    console.log(`${i}: ${token.type} = "${token.value}" (line ${token.line}, col ${token.column})`);
  });
});
