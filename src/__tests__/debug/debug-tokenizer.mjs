import fs from 'fs';
import { createLexer } from './packages/pulsar-transformer/dist/parser/lexer/index.js';

const content = fs.readFileSync('packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf8');

console.log('=== Tokenizing full file ===');
const lexer = createLexer();
const tokens = lexer.tokenize(content);

console.log(`Total tokens: ${tokens.length}`);

// Find tokens around the arrow character position (7643)
console.log('\n=== Tokens around arrow position 7643 ===');
const arrowPos = 7643;

for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];

  // Show tokens within 100 chars of the arrow
  if (token.start >= arrowPos - 100 && token.start <= arrowPos + 100) {
    console.log(
      `[${i}] ${token.type.padEnd(20)} start:${token.start.toString().padStart(5)} end:${token.end.toString().padStart(5)} value:${JSON.stringify(token.value).substring(0, 40)}`
    );
  }
}

// Find tokens near position 7661 (where error occurs)
console.log('\n=== Tokens around error position 7661 ===');
const errorPos = 7661;

for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];

  if (token.start >= errorPos - 50 && token.start <= errorPos + 50) {
    console.log(
      `[${i}] ${token.type.padEnd(20)} start:${token.start.toString().padStart(5)} end:${token.end.toString().padStart(5)} value:${JSON.stringify(token.value).substring(0, 40)}`
    );
  }
}

// Check if there are any tokens at position 7661
const tokenAt7661 = tokens.find((t) => t.start <= 7661 && t.end > 7661);
console.log('\n=== Token containing position 7661:', tokenAt7661);

// Show last 20 tokens
console.log('\n=== Last 20 tokens ===');
for (let i = Math.max(0, tokens.length - 20); i < tokens.length; i++) {
  const token = tokens[i];
  console.log(
    `[${i}] ${token.type.padEnd(20)} start:${token.start.toString().padStart(5)} end:${token.end.toString().padStart(5)} value:${JSON.stringify(token.value).substring(0, 40)}`
  );
}
