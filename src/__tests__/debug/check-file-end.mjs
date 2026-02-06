/**
 * Check last 150 chars of the file
 */

import { readFileSync } from 'fs';

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log(`File length: ${source.length} chars\n`);
console.log(`Error at column: 7661\n`);
console.log(`Last 150 chars (from position 7611):`);
console.log('─'.repeat(80));
console.log(source.substring(7611));
console.log('─'.repeat(80));

console.log(`\nLast 10 lines:`);
const lines = source.split('\n');
lines.slice(-10).forEach((line, idx) => {
  console.log(`${lines.length - 10 + idx + 1}: ${line}`);
});
