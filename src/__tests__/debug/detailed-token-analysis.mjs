#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createLexer } from './packages/pulsar-transformer/dist/index.js';

const fullCode = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

const lexer = createLexer();
const tokens = lexer.tokenize(fullCode);

// Look at tokens 625-635
console.log('=== Tokens 625-635 (around the problem area) ===\n');

for (let i = 625; i <= 635; i++) {
  const t = tokens[i];
  const preview =
    t.value.length > 80
      ? t.value.substring(0, 40) + ' [...] ' + t.value.substring(t.value.length - 40)
      : t.value;

  console.log(`[${String(i).padStart(3)}] ${t.type.padEnd(20)}`);
  console.log(`      Position: ${t.start}-${t.end}`);
  console.log(`      Value (${t.value.length} chars): "${preview}"`);

  // Show actual characters at start and end positions
  console.log(`      Actual chars:`);
  console.log(`        @ ${t.start}: "${fullCode[t.start]}" (${fullCode.charCodeAt(t.start)})`);
  if (t.end < fullCode.length) {
    console.log(`        @ ${t.end}: "${fullCode[t.end]}" (${fullCode.charCodeAt(t.end)})`);
  }
  console.log('');
}
