/**
 * Test with complete component
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
/**
 * Debug Test Suite - PSR Version
 * Testing PSR transformation with RenderCapture validation
 */

import { useState } from '@pulsar-framework/pulsar.dev';
import { EdgeCase1ArrayMapPSR } from './edge-case-1-array-map.psr';
import { EdgeCase2NestedComponentsPSR } from './edge-case-2-nested-components.psr';
import { EdgeCase3ConditionalsPSR } from './edge-case-3-conditionals.psr';

type TestCase = 'home' | 'array-map' | 'nested-components' | 'conditionals';

component DebugTestSuitePSR() {
  return <div>Hello</div>;
}
`;

console.log('Testing complete component with imports...\n');

const pipeline = createPipeline({ debug: false });

const result = pipeline.transform(test1);

console.log('Result:', result.code ? '✅ SUCCESS' : '❌ FAILED');

if (!result.code) {
  const error = result.diagnostics?.find((d) => d.type === 'error');
  console.log('\nError:', error?.message);
}

if (result.code) {
  console.log('\n✅ Generated code length:', result.code.length);
  console.log('\nExports found:', result.code.includes('export') ? 'YES' : 'NO');
  console.log('DebugTestSuitePSR found:', result.code.includes('DebugTestSuitePSR') ? 'YES' : 'NO');
}
