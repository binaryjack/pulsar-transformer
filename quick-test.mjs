/**
 * Simple test - just signals
 */

import { createPSRTestRunner } from './src/testing/index.js';

const runner = createPSRTestRunner({ verbose: true });

const tests = [
  {
    description: 'Basic signal',
    source: `component T1() { const [x] = signal(5); return <div>{x()}</div>; }`,
    expectedDOM: [{ selector: 'div', textContent: '5' }],
  },
  {
    description: 'String signal',
    source: `component T2() { const [x] = signal('Hi'); return <span>{x()}</span>; }`,
    expectedDOM: [{ selector: 'span', textContent: 'Hi' }],
  },
  {
    description: 'Object signal',
    source: `component T3() { const [user] = signal({ name: 'Alice' }); return <div>{user().name}</div>; }`,
    expectedDOM: [{ selector: 'div', textContent: 'Alice' }],
  },
  {
    description: 'Array signal',
    source: `component T4() { const [items] = signal([1, 2, 3]); return <div>{items().length}</div>; }`,
    expectedDOM: [{ selector: 'div', textContent: '3' }],
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const result = await runner.runTest(test);
    if (result.passed) {
      console.log(`✅ ${test.description}`);
      passed++;
    } else {
      console.log(`❌ ${test.description}`);
      if (result.errors && result.errors.length > 0) {
        console.log(`   Errors: ${JSON.stringify(result.errors)}`);
      }
      if (result.domValidation && result.domValidation.length > 0) {
        console.log(`   DOM: ${JSON.stringify(result.domValidation)}`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${test.description} - EXCEPTION: ${error.message}`);
    failed++;
  }
}

console.log(`\n${passed}/${tests.length} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
