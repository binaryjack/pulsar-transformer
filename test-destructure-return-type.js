import { createLexer } from './dist/lexer/index.js';
import { createParser } from './dist/parser/index.js';

const source = `export const Test = ({ show }): HTMLElement => {
  if (!show) return <div />;
  return <span />;
};`;
const lexer = createLexer(source);
const tokens = lexer.scanTokens();

console.log('\n=== TOKENS ===');
tokens.slice(0, 25).forEach((t, i) => {
  console.log(`${i}: ${t.type.padEnd(20)} "${t.value}"`);
});

console.log('\n=== PARSING ===');
const parser = createParser(tokens);
try {
  const ast = parser.parse();
  console.log('\n✅ SUCCESS - Parsed correctly');
} catch (e) {
  console.log('\n❌ ERROR:', e.message);
  console.log('Stack:', e.stack.split('\n').slice(0, 8).join('\n'));
}
