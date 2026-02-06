#!/usr/bin/env node
import { createLexer } from './packages/pulsar-transformer/dist/index.js';

const code = `component Test() {
  return (
    <button
      onMouseOut={(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      Click me
    </button>
  );
}`;

console.log('Testing lexer with arrow function containing single-quoted string\n');
console.log('Code:');
console.log(code);
console.log('\n--- TOKENS ---\n');

try {
  const lexer = createLexer();
  const tokens = lexer.tokenize(code);

  console.log(`Generated ${tokens.length} tokens:\n`);

  // Show all tokens
  tokens.forEach((t, i) => {
    const preview = t.value.length > 40 ? t.value.substring(0, 40) + '...' : t.value;
    console.log(
      `[${String(i).padStart(3)}] ${t.type.padEnd(20)} ${String(t.start).padStart(4)}-${String(t.end).padStart(4)} "${preview}"`
    );
  });

  // Check for suspicious long STRING tokens
  console.log('\n--- SUSPICIOUS TOKENS ---\n');
  tokens.forEach((t, i) => {
    if (t.type === 'STRING' && t.value.length > 20) {
      console.log(`⚠️  Token ${i}: STRING of length ${t.value.length}`);
      console.log(`    Content: "${t.value}"`);
      console.log(`    Position: ${t.start}-${t.end}`);
    }
  });
} catch (err) {
  console.log('Lexer error:', err.message);
  console.log(err.stack);
}
