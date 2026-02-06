/**
 * Test EXACT lines 1-13
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const fullSource = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = fullSource.split('\n');

const chunk = lines.slice(0, 13).join('\n');

console.log('Testing EXACT lines 1-13:');
console.log('═'.repeat(80));
console.log(chunk);
console.log('═'.repeat(80));

const pipeline = createPipeline({ debug: true });

const result = pipeline.transform(chunk);

console.log('\nResult:', result.code ? '✅ SUCCESS' : '❌ FAILED');

if (!result.code) {
  const error = result.diagnostics?.find((d) => d.type === 'error');
  console.log('\n Error:', error?.message);
}

if (result.code) {
  console.log('\n✅ Generated code:');
  console.log('─'.repeat(80));
  console.log(result.code);
  console.log('─'.repeat(80));
}
