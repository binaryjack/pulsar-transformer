/**
 * Feature 5: Show Components - JSX Transformation Test
 * Verify <Show> transforms as normal JSX to t_element() calls
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Basic Show component',
    code: 'const result = <Show when={true}><div>Visible</div></Show>;',
    expectedPatterns: ['Show', 'when:', 'true', 'div', 'Visible'],
  },
  {
    name: 'Show with fallback prop',
    code: '<Show when={loaded()} fallback={<Spinner />}><Content /></Show>',
    expectedPatterns: ['Show', 'when:', 'loaded()', 'fallback:', 'Spinner', 'Content'],
  },
  {
    name: 'Show with complex expression',
    code: '<Show when={count() > 0 && isVisible()}><div>{count()}</div></Show>',
    expectedPatterns: ['Show', 'when:', 'count()', 'isVisible()', 'div'],
  },
  {
    name: 'Nested Show components',
    code: '<Show when={user()}><Show when={user().isAdmin}><AdminPanel /></Show></Show>',
    expectedPatterns: ['Show', 'user()', 'isAdmin', 'AdminPanel'],
  },
  {
    name: 'Show in component',
    code: 'component App() { return <Show when={true}><div>Hi</div></Show>; }',
    expectedPatterns: ['Show', 'when:', 'true', 'div', 'Hi'],
  },
];

console.log('='.repeat(70));
console.log('FEATURE 5: SHOW COMPONENTS JSX TRANSFORMATION');
console.log('Verify <Show> transforms as normal JSX');
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
        console.log(`   Output: ${result.code.substring(0, 200)}...`);
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
  console.log(`SHOW COMPONENTS: ${passed}/${testCases.length} passed`);
  console.log('='.repeat(70));

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.test}`);
      console.log(`   Reason: ${f.reason}`);
      if (f.output) {
        console.log(`   Output: ${f.output.substring(0, 300)}...`);
      }
    });
  }

  if (passed === testCases.length) {
    console.log('\n✅ Feature 5 validation: <Show> JSX transformation works correctly');
    console.log('The transformer handles <Show> like normal JSX (no special logic needed).');
  } else {
    console.log('\n⚠️  Feature 5 validation: Some <Show> patterns need fixing');
  }
})();
