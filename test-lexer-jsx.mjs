// Simple lexer test for JSX whitespace
import { createLexer } from '../dist/lexer/index.js';

const jsxCode = `<div>{first()} {last()}</div>`;

console.log('Testing JSX lexer with:', jsxCode);

const lexer = createLexer();
const tokens = lexer.tokenize(jsxCode);

console.log('\nTokens:');
tokens.forEach((token, i) => {
  console.log(`${i}: ${token.type} = "${token.lexeme}"`);
});

// Look for JSX_TEXT token with space
const spaceToken = tokens.find((t) => t.type === 'JSX_TEXT' && t.lexeme === ' ');
if (spaceToken) {
  console.log('\n✅ SUCCESS: Found JSX_TEXT token with space!');
} else {
  console.log('\n❌ FAILED: No space JSX_TEXT token found');
  console.log('JSX_TEXT tokens found:');
  tokens.filter((t) => t.type === 'JSX_TEXT').forEach((t) => console.log(`  "${t.lexeme}"`));
}
