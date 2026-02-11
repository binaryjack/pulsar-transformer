#!/usr/bin/env node
/**
 * DEBUG: Test whitespace tokenization
 */

import { createPipeline } from './dist/index.js';

const psrCode = `component T() { return <div>{a()} {b()}</div>; }`;

console.log('Testing PSR:');
console.log(psrCode);
console.log('\n' + '='.repeat(70) + '\n');

const pipeline = createPipeline({ debug: true });
const result = await pipeline.transform(psrCode);

console.log('\nTransformed:');
console.log(result.code);

if (result.diagnostics.length > 0) {
  console.log('\nDiagnostics:');
  result.diagnostics.forEach((d) => {
    console.log(`  ${d.type}: ${d.message}`);
  });
}
