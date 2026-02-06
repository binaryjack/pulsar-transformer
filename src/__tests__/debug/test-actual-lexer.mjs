#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createLexer } from './packages/pulsar-transformer/dist/index.js';

// Read the actual file
const fullCode = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('Testing lexer on actual index.psr file\n');
console.log(`File length: ${fullCode.length} chars\n`);

try {
  const lexer = createLexer();
  const tokens = lexer.tokenize(fullCode);

  console.log(`Generated ${tokens.length} tokens\n`);

  // Show last 20 tokens
  console.log('--- LAST 20 TOKENS ---\n');
  const lastTokens = tokens.slice(-20);
  lastTokens.forEach((t, i) => {
    const actualIndex = tokens.length - 20 + i;
    const preview = t.value.length > 60 ? t.value.substring(0, 60) + '...' : t.value;
    console.log(
      `[${String(actualIndex).padStart(3)}] ${t.type.padEnd(20)} ${String(t.start).padStart(5)}-${String(t.end).padStart(5)} "${preview}"`
    );
  });

  // Check for suspicious STRING tokens > 100 chars
  console.log('\n--- SUSPICIOUS LONG STRING TOKENS ---\n');
  let foundSuspicious = false;
  tokens.forEach((t, i) => {
    if (t.type === 'STRING' && t.value.length > 100) {
      foundSuspicious = true;
      console.log(`⚠️  Token ${i}: STRING of length ${t.value.length}`);
      console.log(`    Position: ${t.start}-${t.end}`);
      console.log(`    First 100 chars: "${t.value.substring(0, 100)}"`);
      console.log(`    Last 100 chars: "${t.value.substring(t.value.length - 100)}"`);
      console.log('');
    }
  });

  if (!foundSuspicious) {
    console.log('✅ No suspicious long STRING tokens found');
  }
} catch (err) {
  console.log('Lexer error:', err.message);
  console.log(err.stack);
}
