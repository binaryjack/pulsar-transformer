/**
 * Feature 6: For Iteration - JSX Transformation Test
 * Verify <For> transforms as normal JSX with render callbacks
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Basic For loop',
    code: '<For each={items()}>{(item) => <div>{item}</div>}</For>',
    expectedPatterns: ['For', 'each:', 'items()', '(item) =>', 'div'],
  },
  {
    name: 'For with index parameter',
    code: '<For each={todos()}>{(todo, index) => <span>{todo.text}</span>}</For>',
    expectedPatterns: ['For', 'each:', 'todos()', '(todo, index) =>', 'span'],
  },
  {
    name: 'For with fallback',
    code: '<For each={items()} fallback={<Empty />}>{(item) => <Item data={item} />}</For>',
    expectedPatterns: ['For', 'each:', 'items()', 'fallback:', 'Empty', 'Item', 'data:'],
  },
  {
    name: 'Nested For loops',
    code: '<For each={categories()}>{(cat) => <For each={cat.items}>{(item) => <div>{item}</div>}</For>}</For>',
    expectedPatterns: ['For', 'categories()', 'cat', 'items', 'item', 'div'],
  },
  {
    name: 'For in component',
    code: 'component List() { return <For each={data()}>{(item) => <li>{item}</li>}</For>; }',
    expectedPatterns: ['For', 'each:', 'data()', '(item) =>', 'li'],
  },
];

console.log('='.repeat(70));
console.log('FEATURE 6: FOR ITERATION JSX TRANSFORMATION');
console.log('Verify <For> transforms with render callbacks');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of testCases) {
    console.log(`\n🔹 Testing: ${test.name}`);

    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      if (result.diagnostics.length > 0) {
        console.log(`   ❌ TRANSFORMATION ERROR`);
        console.log(`   ${result.diagnostics[0].message}`);
        failed++;
        failures.push({ test: test.name, reason: result.diagnostics[0].message });
        continue;
      }

      // Check if all expected patterns are in output
      const missingPatterns = test.expectedPatterns.filter(
        (pattern) => !result.code.includes(pattern)
      );

      if (missingPatterns.length === 0) {
        console.log(`   ✅ PASS`);
        console.log(`   Found all patterns: ${test.expectedPatterns.slice(0, 3).join(', ')}...`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Patterns missing in output`);
        console.log(`   Missing: ${missingPatterns.join(', ')}`);
        console.log(`   Output: ${result.code.substring(0, 300)}...`);
        failed++;
        failures.push({
          test: test.name,
          reason: `Missing patterns: ${missingPatterns.join(', ')}`,
          output: result.code,
        });
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
      failed++;
      failures.push({ test: test.name, reason: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`FOR ITERATION: ${passed}/${testCases.length} passed`);
  console.log('='.repeat(70));

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.test}`);
      console.log(`   Reason: ${f.reason}`);
      if (f.output) {
        console.log(`   Output: ${f.output.substring(0, 400)}...`);
      }
    });
  }

  if (passed === testCases.length) {
    console.log('\n✅ Feature 6 validation: <For> JSX transformation works correctly');
    console.log('The transformer handles <For> like normal JSX with render callbacks.');
  } else {
    console.log('\n⚠️  Feature 6 validation: Some <For> patterns need fixing');
  }
})();
