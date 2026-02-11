import { createLexer } from './dist/index.js';

const test2 = `function map<T extends object>(obj: T): T`;

const lexer = createLexer(test2);

// Monkey-patch to log state transitions
const originalPushState = lexer.pushState;
const originalPopState = lexer.popState;

lexer.pushState = function (state) {
  console.log(`PUSH STATE: ${state} (stack was: [${this.stateStack.join(', ')}])`);
  originalPushState.call(this, state);
};

lexer.popState = function () {
  const current = this.stateStack[this.stateStack.length - 1];
  console.log(`POP STATE: ${current} (stack was: [${this.stateStack.join(', ')}])`);
  return originalPopState.call(this);
};

console.log('Scanning tokens...\n');
const tokens = lexer.scanTokens();

console.log('\n\nFinal tokens around generic:');
tokens.slice(3, 10).forEach((token, i) => {
  console.log(`${i + 3}: ${token.type.padEnd(15)} "${token.value}"`);
});
