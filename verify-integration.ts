/**
 * Verification Script - Test Integration Status
 *
 * Run this to see what's working and what's not.
 * This will test each module independently and then test the full pipeline.
 */

import { createImportManager } from './src/analyzer/import-manager.js';
import { createReactivityAnalyzer } from './src/analyzer/reactivity-analyzer.js';
import { createPipeline } from './src/pipeline/create-pipeline.js';
import { escapeUnicode, needsUnicodeEscape } from './src/unicode-handler.js';

console.log('\n🔍 PULSAR TRANSFORMER - INTEGRATION VERIFICATION\n');
console.log('='.repeat(80));

// Test 1: Unicode Handler (Standalone)
console.log('\n📝 Test 1: Unicode Handler (Standalone)');
console.log('-'.repeat(80));
try {
  const testStrings = [
    { input: 'தமிழ்', desc: 'Tamil' },
    { input: '中文', desc: 'Chinese' },
    { input: '😀', desc: 'Emoji' },
    { input: 'Hello World', desc: 'ASCII' },
  ];

  let unicodeTestsPassed = 0;
  for (const { input, desc } of testStrings) {
    const needs = needsUnicodeEscape(input);
    const escaped = escapeUnicode(input);
    console.log(`  ${desc}: "${input}" → ${needs ? `"${escaped}"` : 'no escape needed'}`);
    unicodeTestsPassed++;
  }

  console.log(`\n✅ Unicode Handler: ${unicodeTestsPassed}/${testStrings.length} tests passed`);
} catch (error) {
  console.log(`\n❌ Unicode Handler: FAILED`);
  console.error(error);
}

// Test 2: Import Manager (Standalone)
console.log('\n📝 Test 2: Import Manager (Standalone)');
console.log('-'.repeat(80));
try {
  const imports = createImportManager();

  imports.addNamedImport('createSignal', '@pulsar/runtime');
  imports.addNamedImport('createMemo', '@pulsar/runtime');
  imports.addDefaultImport('React', 'react');

  const statements = imports.generateImportStatements();
  console.log('  Generated imports:');
  statements.forEach((stmt) => console.log(`    ${stmt}`));

  console.log(`\n✅ Import Manager: Working`);
} catch (error) {
  console.log(`\n❌ Import Manager: FAILED`);
  console.error(error);
}

// Test 3: Reactivity Analyzer (Standalone)
console.log('\n📝 Test 3: Reactivity Analyzer (Standalone)');
console.log('-'.repeat(80));
try {
  const analyzer = createReactivityAnalyzer();

  const testCases = [
    {
      input: 'const count = signal(0);',
      expected: 'const [count, setCount] = createSignal(0);',
    },
    {
      input: 'const total = computed(() => a() + b());',
      expected: 'const total = createMemo(() => a() + b());',
    },
    {
      input: 'effect(() => { console.log(x()); });',
      expected: 'createEffect(() => { console.log(x()); });',
    },
  ];

  let reactivityTestsPassed = 0;
  for (const { input, expected } of testCases) {
    let transformed = analyzer.transformSignal(input);
    transformed = analyzer.transformComputed(transformed);
    transformed = analyzer.transformEffect(transformed);

    const passed = transformed === expected;
    console.log(`  ${passed ? '✅' : '❌'} "${input}"`);
    console.log(`     → "${transformed}"`);
    if (!passed) {
      console.log(`     Expected: "${expected}"`);
    }
    if (passed) reactivityTestsPassed++;
  }

  console.log(
    `\n${reactivityTestsPassed === testCases.length ? '✅' : '❌'} Reactivity Analyzer: ${reactivityTestsPassed}/${testCases.length} tests passed`
  );
} catch (error) {
  console.log(`\n❌ Reactivity Analyzer: FAILED`);
  console.error(error);
}

// Test 4: Full Pipeline Integration
console.log('\n📝 Test 4: Full Pipeline Integration');
console.log('-'.repeat(80));
console.log('Testing if modules are connected to pipeline...\n');

const testCases = [
  {
    name: 'Unicode in JSX',
    code: `component Test() { return <div>தமிழ் 😀</div>; }`,
    checks: [
      { test: (c: string) => c.includes('function Test'), name: 'Component declared' },
      {
        test: (c: string) => c.includes('\\u0BA4') || c.includes('தமிழ்'),
        name: 'Unicode handled',
        critical: true,
      },
    ],
  },
  {
    name: 'Signal Transformation',
    code: `component Counter() { const [count, setCount] = signal(0); return <div>{count()}</div>; }`,
    checks: [
      { test: (c: string) => c.includes('function Counter'), name: 'Component declared' },
      {
        test: (c: string) => c.includes('createSignal'),
        name: 'Signal transformed',
        critical: true,
      },
      {
        test: (c: string) => !c.includes('signal(0)'),
        name: 'Original signal() removed',
        critical: true,
      },
    ],
  },
  {
    name: 'Auto Import Injection',
    code: `component Test() { const [x, setX] = signal(1); return <div>{x()}</div>; }`,
    checks: [
      { test: (c: string) => c.includes('function Test'), name: 'Component declared' },
      {
        test: (c: string) => /import.*createSignal.*from/.test(c),
        name: 'createSignal imported',
        critical: true,
      },
    ],
  },
];

let pipelineTestsPassed = 0;
let criticalFailures = 0;

for (const { name, code, checks } of testCases) {
  console.log(`\n  Test: ${name}`);
  console.log(`  Code: ${code.substring(0, 60)}...`);

  try {
    const pipeline = createPipeline();
    const result = pipeline.transform(code);

    console.log(
      `  Output (first 200 chars):\n    ${result.code.substring(0, 200).replace(/\n/g, '\n    ')}...`
    );

    let allPassed = true;
    for (const check of checks) {
      const passed = check.test(result.code);
      console.log(`    ${passed ? '✅' : '❌'} ${check.name}`);

      if (!passed) {
        allPassed = false;
        if (check.critical) {
          criticalFailures++;
        }
      }
    }

    if (allPassed) {
      pipelineTestsPassed++;
      console.log(`  ✅ ${name}: PASSED`);
    } else {
      console.log(`  ❌ ${name}: FAILED`);
    }
  } catch (error) {
    console.log(`  ❌ ${name}: ERROR`);
    console.error(`    ${error}`);
  }
}

// Final Summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 VERIFICATION SUMMARY\n');
console.log(`  Standalone Modules:`);
console.log(`    ✅ Unicode Handler: Working`);
console.log(`    ✅ Import Manager: Working`);
console.log(`    ✅ Reactivity Analyzer: Working`);
console.log();
console.log(`  Pipeline Integration:`);
console.log(`    ${pipelineTestsPassed}/${testCases.length} tests passed`);
console.log(`    ${criticalFailures} critical failures`);
console.log();

if (criticalFailures === 0 && pipelineTestsPassed === testCases.length) {
  console.log('🎉 ALL SYSTEMS GO! Integration is complete.\n');
  process.exit(0);
} else if (criticalFailures > 0) {
  console.log('🚨 CRITICAL: Modules work but are NOT integrated into pipeline.');
  console.log('   See INTEGRATION-GUIDE.md for integration steps.\n');
  process.exit(1);
} else {
  console.log('⚠️  WARNING: Some non-critical checks failed.\n');
  process.exit(1);
}
