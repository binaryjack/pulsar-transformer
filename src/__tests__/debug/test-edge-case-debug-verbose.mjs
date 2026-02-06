/**
 * Test edge-case-1-array-map.psr with DEBUG MODE
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

console.log('Loading edge-case-1-array-map.psr...');
const source = readFileSync(
  './packages/pulsar-ui.dev/src/debug-tests/edge-case-1-array-map.psr',
  'utf-8'
);

console.log(`Source: ${source.length} chars`);
console.log('Creating pipeline with FULL DEBUG MODE enabled...\n');

const pipeline = createPipeline({
  debug: true,
  debugLogger: {
    enabled: true,
    console: true,
    timestamps: true,
    performance: true,
    minLevel: 'trace',
    collectLogs: true,
  },
});

console.log('Starting transformation with complete debug logging...\n');
console.log('═'.repeat(80));

try {
  const result = pipeline.transform(source);

  console.log('\n' + '═'.repeat(80));
  if (result.code) {
    console.log('\n✅ SUCCESS!');
    console.log(`Generated code: ${result.code.length} chars`);
    if (result.metrics) {
      console.log('\n📊 Performance Metrics:');
      console.log(`  Lexer:      ${result.metrics.lexerTime}ms`);
      console.log(`  Parser:     ${result.metrics.parserTime}ms`);
      console.log(`  Analyzer:   ${result.metrics.analyzerTime}ms`);
      console.log(`  Transform:  ${result.metrics.transformTime}ms`);
      console.log(`  Emitter:    ${result.metrics.emitterTime}ms`);
      console.log(`  Total:      ${result.metrics.totalTime}ms`);
    }
  } else {
    console.log('\n❌ FAILED - No code generated');
    if (result.diagnostics.length > 0) {
      console.log('Diagnostics:');
      result.diagnostics.forEach((d) => console.log(`- [${d.phase}] ${d.message}`));
    }
  }
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\nStack:', error.stack);
}
