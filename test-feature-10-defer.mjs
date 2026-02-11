#!/usr/bin/env node
/**
 * Test Feature 10: Defer Computation
 * Verify defer() function calls parse and transform correctly
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 10: DEFER COMPUTATION TRANSFORMATION');
console.log('Verify defer() calls parse as normal function calls');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Basic defer() call',
    code: `
component Deferred() {
  const data = signal(null);
  
  const loadData = () => {
    defer(() => {
      data(fetchData());
    });
  };
  
  return <div onClick={loadData}>{data()}</div>;
}`,
    expectedPatterns: ['defer(() => {', 'data(fetchData())'],
  },
  {
    name: 'defer() with computed value',
    code: `
component Computed() {
  const count = signal(0);
  const doubled = defer(() => count() * 2);
  
  return <div>{doubled()}</div>;
}`,
    expectedPatterns: ['defer(() => count() * 2)'],
  },
  {
    name: 'defer() in effect',
    code: `
component Effect() {
  const value = signal(0);
  
  effect(() => {
    defer(() => {
      console.log('Deferred:', value());
    });
  });
  
  return <div>{value()}</div>;
}`,
    expectedPatterns: ['effect(() => {', 'defer(() => {', "console.log('Deferred:', value())"],
  },
  {
    name: 'Nested defer() calls',
    code: `
component Nested() {
  const x = signal(0);
  
  const update = () => {
    defer(() => {
      x(1);
      defer(() => {
        x(2);
      });
    });
  };
  
  return <div onClick={update}>{x()}</div>;
}`,
    expectedPatterns: ['defer(() => {', 'x(1)', 'defer(() => {', 'x(2)'],
  },
  {
    name: 'defer() with return value',
    code: `
component DeferredValue() {
  const result = signal(null);
  
  const compute = () => {
    const value = defer(() => {
      return heavyComputation();
    });
    result(value);
  };
  
  return <div onClick={compute}>{result()}</div>;
}`,
    expectedPatterns: ['defer(() => {', 'return heavyComputation()', 'result(value)'],
  },
];

(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`🔹 Testing: ${test.name}`);

    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      if (result.diagnostics.length > 0) {
        console.log(`   ❌ FAIL - ${result.diagnostics[0].message}\n`);
        failed++;
        continue;
      }

      const code = result.code;
      const missing = test.expectedPatterns.filter((pattern) => !code.includes(pattern));

      if (missing.length === 0) {
        console.log(`   ✅ PASS`);
        console.log(`   Found all patterns: ${test.expectedPatterns.join(', ')}...\n`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Missing patterns: ${missing.join(', ')}`);
        console.log(`   Output:\n${code}\n`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ FAIL - ${err.message}\n`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log(`DEFER COMPUTATION: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 10 validation: defer() transformation works correctly');
    console.log('The transformer parses defer() as a normal function call.');
  } else {
    console.log('❌ Feature 10 validation failed');
    process.exit(1);
  }
})();
