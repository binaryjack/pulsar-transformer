/**
 * Test Issue #1 - Object/array signal arguments
 */

import { createPSRTestRunner } from './src/testing/index.js';

const runner = createPSRTestRunner({ verbose: true });

const test = {
  description: 'Object signal argument',
  source: `
    component ObjectSignalTest() {
      const [user, setUser] = signal({ name: 'Alice' });
      return <div>{user().name}</div>;
    }
  `,
  expectedDOM: [{ selector: 'div', textContent: 'Alice' }],
};

console.log('Testing Issue #1: Object signal arguments\n');

const result = await runner.runTest(test);

console.log('\n=== RESULT ===');
console.log('Passed:', result.passed);
console.log('\nTransformed Code:');
console.log(result.transformedCode);
