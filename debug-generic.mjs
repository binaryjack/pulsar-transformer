/**
 * Debug Generic Angle Bracket Detection
 */

import { createLexer } from './dist/parser/lexer/index.js';

const testCases = [
  'class Foo<T> { }',
  'interface Bar<T, U> { }',
  'type Box<T> = { value: T };',
  '<div>Hello</div>',
  '<Button>Click</Button>',
];

for (const testCase of testCases) {
  console.log(`\nInput: ${testCase}`);
  const lexer = createLexer();
  const tokens = lexer.tokenize(testCase);

  console.log('Tokens:');
  tokens.forEach((token, i) => {
    console.log(`  ${i}: ${token.type.padEnd(20)} "${token.value}"`);
  });
}
