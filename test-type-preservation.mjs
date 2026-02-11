/**
 * Feature 4: Type Inference System - Phase 1 Scope
 * Verify TypeScript types are preserved through PSR transformation
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Component with typed props',
    code: 'component Counter({count, label}: {count: number; label: string}) { return <div>{label}: {count}</div>; }',
    expectedPatterns: ['count: number', 'label: string'],
  },
  {
    name: 'Generic function with constraints',
    code: 'function map<T extends object>(obj: T): T { return obj; }',
    expectedPatterns: ['<T extends object>', 'obj: T', ': T'],
  },
  {
    name: 'Multiple parameters with types',
    code: 'function add(a: number, b: number): number { return a + b; }',
    expectedPatterns: ['a: number', 'b: number', ': number'],
  },
  {
    name: 'Component with generic type',
    code: 'component List<T>(items: T[]) { return <div></div>; }',
    expectedPatterns: ['List<T>', 'items: T[]'],
  },
  {
    name: 'Optional and union types',
    code: 'function getValue(x?: string | number): string { return ""; }',
    expectedPatterns: ['x?:', 'string | number', ': string'],
  },
];

console.log('='.repeat(70));
console.log('FEATURE 4: TYPE PRESERVATION VALIDATION');
console.log('Verifying TypeScript types survive PSR transformation');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of testCases) {
    console.log(`\n🔹 Testing: ${test.name}`);

    try {
      const pipeline = createPipeline({ debug: true });
      const result = await pipeline.transform(test.code);

      if (result.diagnostics.length > 0) {
        console.log(`   ❌ TRANSFORMATION ERROR`);
        console.log(`   ${result.diagnostics[0].message}`);
        failed++;
        failures.push({ test: test.name, reason: result.diagnostics[0].message });
        continue;
      }

      // Check if all expected type patterns are preserved in output
      const missingPatterns = test.expectedPatterns.filter(
        (pattern) => !result.code.includes(pattern)
      );

      if (missingPatterns.length === 0) {
        console.log(`   ✅ PASS - All types preserved`);
        console.log(`   Found: ${test.expectedPatterns.join(', ')}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Types lost in transformation`);
        console.log(`   Missing: ${missingPatterns.join(', ')}`);
        console.log(`   Output: ${result.code}`);
        failed++;
        failures.push({
          test: test.name,
          reason: `Missing patterns: ${missingPatterns.join(', ')}`,
          output: result.code,
        });
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
      console.log(`   STACK: ${error.stack}`);
      failed++;
      failures.push({ test: test.name, reason: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TYPE PRESERVATION: ${passed}/${testCases.length} passed`);
  console.log('='.repeat(70));

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.test}`);
      console.log(`   Reason: ${f.reason}`);
      if (f.output) {
        console.log(`   Output: ${f.output.substring(0, 200)}...`);
      }
    });
  }

  if (passed === testCases.length) {
    console.log('\n✅ Feature 4 validation: Type preservation is WORKING correctly');
    console.log('The transformer successfully preserves TypeScript types through transformation.');
  } else {
    console.log('\n⚠️  Feature 4 validation: Some type patterns need fixing');
  }
})();
