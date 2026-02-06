/**
 * Test line-by-line from line 10 to 20
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const fullSource = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = fullSource.split('\n');

console.log('Testing line-by-line from 10 to 25...\n');

const pipeline = createPipeline({ debug: false });

// Test every single line from 10 to 25
for (let numLines = 10; numLines <= 25; numLines++) {
  const chunk = lines.slice(0, numLines).join('\n');
  const result = pipeline.transform(chunk);

  const status = result.code ? '✅' : '❌';
  const currentLine = lines[numLines - 1];
  console.log(`Line ${numLines}: ${status} ${currentLine.substring(0, 60)}...`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    console.log(`\n❌ PARSER FAILED AT LINE ${numLines}`);
    console.log(`  Error: ${error?.message}`);
    console.log(`\n  Context (lines ${numLines - 3} to ${numLines}):`);
    lines.slice(Math.max(0, numLines - 3), numLines).forEach((line, idx) => {
      const lineNum = numLines - 3 + idx + 1;
      console.log(`    ${String(lineNum).padStart(4, ' ')} | ${line}`);
    });
    break;
  }
}
