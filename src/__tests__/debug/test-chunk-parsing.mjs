/**
 * Test the actual problematic section from index.psr
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const fullSource = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('Testing chunks of index.psr...\n');

const pipeline = createPipeline({ debug: false });

// Try to isolate where it breaks by testing progressively larger chunks
const testChunks = [
  { name: 'First 1000 chars', source: fullSource.substring(0, 1000) },
  { name: 'First 2000 chars', source: fullSource.substring(0, 2000) },
  { name: 'First 3000 chars', source: fullSource.substring(0, 3000) },
  { name: 'First 4000 chars', source: fullSource.substring(0, 4000) },
  { name: 'First 5000 chars', source: fullSource.substring(0, 5000) },
  { name: 'First 6000 chars', source: fullSource.substring(0, 6000) },
  { name: 'First 7000 chars', source: fullSource.substring(0, 7000) },
  { name: 'Full file', source: fullSource },
];

for (const chunk of testChunks) {
  const result = pipeline.transform(chunk.source);
  const status = result.code ? '✅ PASS' : '❌ FAIL';
  console.log(`${chunk.name}: ${status}`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    if (error) {
      console.log(`  Error: ${error.message}`);
      console.log(`  Phase: ${error.phase}`);
      if (error.location) {
        console.log(`  Location: line ${error.location.line}, col ${error.location.column}`);
      }
    }

    // Show the last 200 chars before failure point
    const endPos = chunk.source.length;
    const startPos = Math.max(0, endPos - 200);
    console.log(`\n  Last 200 chars before error:`);
    console.log('  ' + '-'.repeat(60));
    console.log('  ' + chunk.source.substring(startPos, endPos).replace(/\n/g, '\n  '));
    console.log('  ' + '-'.repeat(60));

    break; // Stop at first failure
  }
}
