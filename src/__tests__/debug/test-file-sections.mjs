/**
 * Test increasing sections of actual file
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const fullSource = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = fullSource.split('\n');

console.log(`Total lines: ${lines.length}\n`);

const pipeline = createPipeline({ debug: false });

// Test progressively: 50%, 75%, 90%, 100%
const percentages = [50, 75, 90, 100];

for (const pct of percentages) {
  const numLines = Math.floor((lines.length * pct) / 100);
  const chunk = lines.slice(0, numLines).join('\n');

  const result = pipeline.transform(chunk);
  const status = result.code ? '✅' : '❌';
  console.log(`${status} Lines 1-${numLines} (${pct}%)`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    console.log(`    Error: ${error?.message}`);
    console.log(`\n    Last 3 lines:`);
    lines.slice(numLines - 3, numLines).forEach((line, idx) => {
      console.log(`      ${numLines - 3 + idx + 1}: ${line.substring(0, 80)}`);
    });
    break;
  } else {
    console.log(`    ✓ Generated ${result.code.length} chars`);
  }
}
