#!/usr/bin/env node
/**
 * Test Feature 8: Batch Updates
 * Verify batch() function calls parse and transform correctly
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 8: BATCH UPDATES TRANSFORMATION');
console.log('Verify batch() calls parse as normal function calls');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Basic batch() call',
    code: `
component Counter() {
  const count = signal(0);
  
  const increment = () => {
    batch(() => {
      count(count() + 1);
    });
  };
  
  return <div onClick={increment}>{count()}</div>;
}`,
    expectedPatterns: ['batch(() => {', 'count(count() + 1)'],
  },
  {
    name: 'Multiple updates in batch',
    code: `
component Dashboard() {
  const count = signal(0);
  const name = signal('');
  
  const updateAll = () => {
    batch(() => {
      count(count() + 1);
      name('Updated');
    });
  };
  
  return <div onClick={updateAll}>{name()}</div>;
}`,
    expectedPatterns: ['batch(() => {', 'count(count() + 1)', "name('Updated')"],
  },
  {
    name: 'Nested batch() calls',
    code: `
component App() {
  const a = signal(0);
  const b = signal(0);
  
  const update = () => {
    batch(() => {
      a(1);
      batch(() => {
        b(2);
      });
    });
  };
  
  return <div>{a()}</div>;
}`,
    expectedPatterns: ['batch(() => {', 'a(1)', 'batch(() => {', 'b(2)'],
  },
  {
    name: 'batch() with return value',
    code: `
component Example() {
  const count = signal(0);
  
  const getValue = () => {
    return batch(() => {
      count(count() + 1);
      return count();
    });
  };
  
  return <div>{getValue()}</div>;
}`,
    expectedPatterns: ['return batch(() => {', 'count(count() + 1)', 'return count()'],
  },
  {
    name: 'batch() in effect',
    code: `
component Synced() {
  const x = signal(0);
  const y = signal(0);
  
  effect(() => {
    batch(() => {
      x(10);
      y(20);
    });
  });
  
  return <div>{x()}</div>;
}`,
    expectedPatterns: ['effect(() => {', 'batch(() => {', 'x(10)', 'y(20)'],
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
  console.log(`BATCH UPDATES: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 8 validation: batch() transformation works correctly');
    console.log('The transformer parses batch() as a normal function call.');
  } else {
    console.log('❌ Feature 8 validation failed');
    process.exit(1);
  }
})();
