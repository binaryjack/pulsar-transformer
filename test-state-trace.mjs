import { createLexer } from './dist/index.js';

const test = `<Show when={count() > 0 && isVisible()}><div>Hi</div></Show>`;

const lexer = createLexer(test);

// Monkey-patch to log state and token generation
const originalAddToken = lexer.addToken;
const originalGetState = lexer.getState;

let tokenCount = 0;

lexer.addToken = function (type, value) {
  const state = this.state;
  const stack = [...this.stateStack];
  console.log(
    `[${tokenCount++}] Token: ${type.padEnd(15)} "${value.substring(0, 20)}" | State: ${state} | Stack: [${stack.join(', ')}]`
  );
  originalAddToken.call(this, type, value);
};

console.log('Scanning...\n');
lexer.scanTokens();
