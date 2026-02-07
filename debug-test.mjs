/**
 * Debug single test to understand validation failure
 */

import { createPSRTestRunner } from './src/testing/index.js';

const runner = createPSRTestRunner({ verbose: true });

const test = {
  description: 'Debug basic signal',
  source: `
    component SignalTest() {
      const [count, setCount] = signal(0);
      return <div>{count()}</div>;
    }
  `,
  expectedDOM: [{ selector: 'div', textContent: '0' }],
};

console.log('Running test...\n');

const result = await runner.runTest(test);

console.log('\n=== RESULT ===');
console.log('Passed:', result.passed);
console.log('Transformation Success:', result.transformationSuccess);
console.log('Execution Success:', result.executionSuccess);
console.log('\nDOM Validation Results:');
console.log(JSON.stringify(result.domValidation, null, 2));
console.log('\nErrors:');
console.log(JSON.stringify(result.errors, null, 2));
console.log('\nWarnings:');
console.log(JSON.stringify(result.warnings, null, 2));
