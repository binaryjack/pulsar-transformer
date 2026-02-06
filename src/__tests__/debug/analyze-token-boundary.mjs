#!/usr/bin/env node
import { readFileSync } from 'fs';

const code = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

// Token 629: 7458-7590
// Token 630-633: scale ( 1 )
// Token 634: 7598-7761

console.log('=== Analyzing token boundaries ===\n');

console.log('Token 629 (STRING): 7458-7590');
console.log(`  Last 50 chars: "${code.substring(7540, 7590)}"`);
console.log(`  Char at 7590: "${code[7590]}" (${code.charCodeAt(7590)})`);

console.log('\nTokens 630-633 should be: scale ( 1 )');
console.log(`  7590-7598: "${code.substring(7590, 7598)}"`);

console.log('\nToken 634 (STRING): 7598-7761');
console.log(`  Char at 7598: "${code[7598]}" (${code.charCodeAt(7598)})`);
console.log(`  First 50 chars: "${code.substring(7598, 7648)}"`);

console.log('\n\n=== The pattern ===\n');
console.log(code.substring(7440, 7620));
