/**
 * Find exact character at line 38, column 90
 */

import { readFileSync } from 'fs'

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = source.split('\n');

const targetLine = 37; // 0-indexed
const targetCol = 89; // 0-indexed

console.log(`Line 38 content:`);
console.log(lines[targetLine]);
console.log();

console.log(`Character at column 90:`);
console.log(`"${lines[targetLine][targetCol]}"`);
console.log();

console.log(`Context around column 90 (cols 80-100):`);
const start = Math.max(0, targetCol - 10);
const end = Math.min(lines[targetLine].length, targetCol + 10);
console.log(`...${lines[targetLine].substring(start, end)}...`);
console.log(`   ${' '.repeat(targetCol - start)}^`);
