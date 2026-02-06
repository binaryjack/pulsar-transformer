/**
 * Test progressive chunks of the EXACT file
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const fullSource = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = fullSource.split('\n');

console.log('Testing exact chunks from index.psr...\n');
console.log(`Total lines in file: ${lines.length}\n`);

const pipeline = createPipeline({ debug: false });

// Test by adding 10 lines at a time
for (let numLines = 10; numLines <= lines.length; numLines += 10) {
  const chunk = lines.slice(0, numLines).join('\n');
  const result = pipeline.transform(chunk);

  const status = result.code ? '✅' : '❌';
  console.log(`Lines 1-${numLines}: ${status}`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    console.log(`  ❌ ERROR: ${error?.message}`);
    console.log(`\n  Last 5 lines before failure:`);
    lines.slice(Math.max(0, numLines - 5), numLines).forEach((line, idx) => {
      const lineNum = numLines - 5 + idx + 1;
      console.log(`    ${String(lineNum).padStart(4, ' ')} | ${line}`);
    });
    break;
  }
}
