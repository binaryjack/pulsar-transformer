#!/usr/bin/env node
import { readFileSync } from 'fs';

const code = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

const pos = 7598;
const context = 50;

console.log(`File length: ${code.length}`);
console.log(`\nCharacter at position ${pos}: "${code[pos]}" (char code: ${code.charCodeAt(pos)})`);
console.log(`\nContext around position ${pos}:\n`);

const start = Math.max(0, pos - context);
const end = Math.min(code.length, pos + context);

console.log('Position markers:');
console.log(''.padStart(pos - start) + '↓');
console.log(code.substring(start, end));
console.log(''.padStart(pos - start) + '↑ Position ' + pos);

console.log('\n\nChar-by-char around position:\n');
for (let i = pos - 10; i <= pos + 10; i++) {
  if (i >= 0 && i < code.length) {
    const char = code[i];
    const escaped = char === '\n' ? '\\n' : char === '\r' ? '\\r' : char === '\t' ? '\\t' : char;
    console.log(`  ${i}: "${escaped}" (${char.charCodeAt(0)})`);
  }
}
