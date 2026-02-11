/**
 * Test Feature 3: Generic Type Arguments
 * Tests ONLY generic type parameters, NOT complex type annotations
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Simple generic function',
    code: 'function identity<T>(value: T): T { return value; }',
    expected: ['identity<T>', 'value: T', ': T'],
  },
  {
    name: 'Generic with constraint',
    code: 'function stringify<T extends Object>(obj: T): string { return ""; }',
    expected: ['stringify<T extends Object>', 'obj: T', ': string'],
  },
  {
    name: 'Generic with default',
    code: 'function create<T = string>(val: T): T { return val; }',
    expected: ['create<T = string>', 'val: T', ': T'],
  },
  {
    name: 'Multiple type parameters',
    code: 'function map<K, V>(key: K, value: V): V { return value; }',
    expected: ['map<K, V>', 'key: K', 'value: V', ': V'],
  },
  {
    name: 'Generic component (simple)',
    code: 'component Box<T>(value: T) { return <div></div>; }',
    expected: ['Box<T>', 'value: T'],
  },
  {
    name: 'Component with multiple generics',
    code: 'component Pair<A, B>(first: A, second: B) { return <div></div>; }',
    expected: ['Pair<A, B>', 'first: A', 'second: B'],
  },
];

console.log('='.repeat(70));
console.log('FEATURE 3: GENERIC TYPE ARGUMENTS');
console.log('Scope: Type parameters only, NOT complex type annotations');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n🔹 Testing: ${test.name}`);

    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      if (result.diagnostics.length > 0) {
        console.log(`   ❌ ERROR`);
        console.log(`   Diagnostics: ${result.diagnostics[0].message}`);
        failed++;
        continue;
      }

      // Check if all expected patterns exist in output
      const allFound = test.expected.every((pattern) => result.code.includes(pattern));

      if (allFound) {
        console.log(`   ✅ PASS`);
        console.log(`   All patterns found: ${test.expected.join(', ')}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Expected patterns: ${test.expected.join(', ')}`);
        console.log(`   Output: ${result.code}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));
})();
