import { createLexer } from './dist/index.js';

const test = `<Show when={count() > 0 && isVisible()}><div>{count()}</div></Show>`;

console.log('Input:', test);
console.log('Column 41:', test[40]);
console.log('\nTokens around column 41:');

const lexer = createLexer(test);
const tokens = lexer.scanTokens();

tokens.forEach((token, i) => {
  if (token.column >= 35 && token.column <= 50) {
    console.log(`${i}: ${token.type.padEnd(15)} "${token.value}" at column ${token.column}`);
  }
});
