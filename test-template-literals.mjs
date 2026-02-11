/**
 * Simple test for template literals
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Simple template literal',
    code: 'const msg = `hello world`;',
    expected: "const msg = 'hello world';",
  },
  {
    name: 'Template with single expression',
    code: 'const msg = `hello ${name}`;',
    expected: "const msg = 'hello ' + name;",
  },
  {
    name: 'Template with multiple expressions',
    code: 'const msg = `${first} ${last}`;',
    expected: "const msg = first + ' ' + last;",
  },
  {
    name: 'Template in JSX attribute',
    code: '<div className={`btn-${variant}`}>Click</div>',
    expected: "t_element('div', { className: 'btn-' + variant }, ['Click'])",
  },
];

console.log('='.repeat(70));
console.log('TEMPLATE LITERAL TESTS');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   Result type: ${typeof result}`);
      console.log(`   Result keys: ${result ? Object.keys(result).join(', ') : 'null'}`);

      // Pipeline returns the code string directly
      const output = typeof result === 'string' ? result : result?.code || '';

      // Check if output contains expected pattern
      const normalized = output.trim().replace(/\s+/g, ' ');
      const normalizedExpected = test.expected.replace(/\s+/g, ' ');

      if (normalized.includes(normalizedExpected)) {
        console.log(`✅ PASS`);
        console.log(`   Output: ${normalized.substring(0, 100)}...`);
        passed++;
      } else {
        console.log(`❌ FAIL`);
        console.log(`   Expected: ${normalizedExpected}`);
        console.log(`   Got: ${normalized}`);
        failed++;
      }
    } catch (error) {
      console.log(`\n❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
})();
