/**
 * Test complex JSX expressions
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Ternary in JSX child',
    code: '<div>{isActive ? "Active" : "Inactive"}</div>',
    expected: "isActive ? 'Active' : 'Inactive'",
  },
  {
    name: 'Logical AND in JSX',
    code: '<div>{user && user.name}</div>',
    expected: 'user && user.name',
  },
  {
    name: 'Logical OR in JSX',
    code: '<div>{name || "Guest"}</div>',
    expected: "name || 'Guest'",
  },
  {
    name: 'Complex nested ternary',
    code: '<div>{type === "primary" ? "btn-primary" : type === "secondary" ? "btn-secondary" : "btn-default"}</div>',
    expected:
      "type === 'primary' ? 'btn-primary' : type === 'secondary' ? 'btn-secondary' : 'btn-default'",
  },
  {
    name: 'Ternary in JSX attribute',
    code: '<button className={isActive ? "active" : "inactive"}>Click</button>',
    expected: "isActive ? 'active' : 'inactive'",
  },
  {
    name: 'Nullish coalescing',
    code: '<div>{value ?? "default"}</div>',
    expected: "value ?? 'default'",
  },
  {
    name: 'Optional chaining',
    code: '<div>{user?.profile?.name}</div>',
    expected: 'user?.profile?.name',
  },
];

console.log('='.repeat(70));
console.log('COMPLEX JSX EXPRESSIONS TESTS');
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
      const normalized = output.trim().replace(/\s+/g, ' ');
      const normalizedExpected = test.expected.replace(/\s+/g, ' ');

      if (normalized.includes(normalizedExpected)) {
        console.log(`✅ PASS`);
        console.log(`   Found: ${normalizedExpected}`);
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
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
})();
