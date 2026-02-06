/**
 * Test array literal support
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

console.log('🧪 Testing array and object literals...\n');

const pipeline = createPipeline({ debug: false });

const testCases = [
  {
    name: 'Array literal',
    code: 'component Test() { const arr = [1, 2, 3]; return <div/>; }',
  },
  {
    name: 'Object literal',
    code: `component Test() { const obj = { a: 1, b: 2 }; return <div/>; }`,
  },
  {
    name: 'Function call with array arg',
    code: 'component Test() { someFunc([1, 2, 3]); return <div/>; }',
  },
  {
    name: 'Function call with object arg',
    code: 'component Test() { someFunc({ a: 1, b: 2 }); return <div/>; }',
  },
];

for (const test of testCases) {
  console.log(`Testing: ${test.name}`);

  try {
    const result = pipeline.transform(test.code);
    if (result.diagnostics.filter((d) => d.type === 'error').length === 0) {
      console.log('✅ PASSED\n');
    } else {
      console.log('❌ FAILED');
      result.diagnostics.forEach((d) => {
        if (d.type === 'error') {
          console.log(`- [${d.phase}] ${d.message}`);
        }
      });
      console.log('');
    }
  } catch (err) {
    console.log('❌ ERROR:', err.message, '\n');
  }
}
