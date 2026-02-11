/**
 * Test generic type arguments
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Generic component with single type parameter',
    code: 'component List<T>(props: { items: T[] }) { return <div>{props.items.length}</div>; }',
    expected: 'function List',
  },
  {
    name: 'Generic component with type constraint',
    code: 'component Container<T extends HTMLElement>(props: { el: T }) { return <div></div>; }',
    expected: 'function Container',
  },
  {
    name: 'Generic component with default type',
    code: 'component Box<T = string>(props: { value: T }) { return <div>{props.value}</div>; }',
    expected: 'function Box',
  },
  {
    name: 'Generic function declaration',
    code: 'function createStore<T>(initial: T): T { return initial; }',
    expected: 'function createStore',
  },
  {
    name: 'Multiple type parameters',
    code: 'component Map<K, V>(props: { key: K; value: V }) { return <div></div>; }',
    expected: 'function Map',
  },
  {
    name: 'Generic arrow function with type',
    code: 'const identity = <T>(value: T): T => value;',
    expected: 'const identity',
  },
];

console.log('='.repeat(70));
console.log('GENERIC TYPE ARGUMENTS TESTS');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      console.log(`\n🔍 Testing: ${test.name}`);

      const output = result.code;
      const hasGenerics = output.includes('<') && output.includes('>');

      if (result.diagnostics.length > 0 && result.diagnostics.some((d) => d.type === 'error')) {
        console.log(`❌ ERROR`);
        console.log(`   Diagnostics: ${result.diagnostics.map((d) => d.message).join(', ')}`);
        failed++;
      } else if (output.includes(test.expected)) {
        console.log(`✅ PASS`);
        console.log(`   Found: ${test.expected}`);
        console.log(`   Preserves generics: ${hasGenerics ? 'Yes' : 'No'}`);
        passed++;
      } else {
        console.log(`❌ FAIL`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Got: ${output.substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`\n❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
})();
