#!/usr/bin/env node
/**
 * Comprehensive Test Suite - All 14 Transformer Features
 * Run all feature tests to validate transformer implementation
 */

import { execSync } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
  { id: 1, name: 'Template Literals', file: 'test-template-literals.mjs' },
  { id: 2, name: 'Complex JSX Expressions', file: 'test-complex-jsx.mjs' },
  { id: 3, name: 'Generic Type Arguments', file: 'test-feature-3-generics.mjs' },
  { id: 4, name: 'Type Inference System', file: 'test-type-preservation.mjs' },
  { id: 5, name: 'Show Components', file: 'test-feature-5-show.mjs' },
  { id: 6, name: 'For Iteration', file: 'test-feature-6-for.mjs' },
  { id: 7, name: 'Dynamic Components', file: 'test-feature-7-dynamic.mjs' },
  { id: 8, name: 'Batch Updates', file: 'test-feature-8-batch.mjs' },
  { id: 9, name: 'Untrack Execution', file: 'test-feature-9-untrack.mjs' },
  { id: 10, name: 'Defer Computation', file: 'test-feature-10-defer.mjs' },
  { id: 11, name: 'Static/Dynamic Optimization', file: 'test-feature-11-static-dynamic.mjs' },
  { id: 12, name: 'Client-Server Detection', file: 'test-feature-12-client-server.mjs' },
  { id: 13, name: 'Server-Side Rendering', file: 'test-feature-13-ssr.mjs' },
  { id: 14, name: 'Hydration Markers', file: 'test-feature-14-hydration.mjs' },
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║   PULSAR TRANSFORMER - COMPREHENSIVE FEATURE VALIDATION SUITE        ║');
console.log('║   Testing all 14 implemented features                               ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const test of testFiles) {
  const startTime = Date.now();
  process.stdout.write(`[${test.id}/14] ${test.name}... `);

  try {
    execSync(`node ${test.file}`, {
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    const duration = Date.now() - startTime;
    console.log(`✅ PASS (${duration}ms)`);
    results.push({ ...test, status: 'PASS', duration });
    totalPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ FAIL (${duration}ms)`);
    results.push({ ...test, status: 'FAIL', duration, error: error.message });
    totalFailed++;
  }
}

console.log('\n' + '═'.repeat(70));
console.log('VALIDATION SUMMARY');
console.log('═'.repeat(70));

console.log('\n📊 Results by Phase:\n');

console.log('Phase 1: Foundation');
results.slice(0, 4).forEach((r) => {
  console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} Feature ${r.id}: ${r.name}`);
});

console.log('\nPhase 2: Runtime Components');
results.slice(4, 7).forEach((r) => {
  console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} Feature ${r.id}: ${r.name}`);
});

console.log('\nPhase 3: Performance & SSR');
results.slice(7, 14).forEach((r) => {
  console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} Feature ${r.id}: ${r.name}`);
});

console.log('\n' + '═'.repeat(70));
console.log(`OVERALL: ${totalPassed}/${testFiles.length} features passing`);
console.log('═'.repeat(70));

if (totalFailed === 0) {
  console.log('\n🎉 SUCCESS! All transformer features validated and working!\n');
  console.log('The PSR transformer is ready for:');
  console.log('  • Production use');
  console.log('  • Integration with build tools (Vite plugin)');
  console.log('  • VS Code extension integration');
  console.log('  • Publishing to npm\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${totalFailed} feature(s) failed validation\n`);

  results
    .filter((r) => r.status === 'FAIL')
    .forEach((r) => {
      console.log(`Feature ${r.id}: ${r.name}`);
      console.log(`  Error: ${r.error}\n`);
    });

  process.exit(1);
}
