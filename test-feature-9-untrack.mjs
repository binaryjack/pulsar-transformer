#!/usr/bin/env node
/**
 * Test Feature 9: Untrack Execution
 * Verify untrack() function calls parse and transform correctly
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 9: UNTRACK EXECUTION TRANSFORMATION');
console.log('Verify untrack() calls parse as normal function calls');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Basic untrack() call',
    code: `
component Logger() {
  const count = signal(0);
  
  effect(() => {
    untrack(() => {
      console.log('Count changed:', count());
    });
  });
  
  return <div>{count()}</div>;
}`,
    expectedPatterns: ['untrack(() => {', "console.log('Count changed:', count())"],
  },
  {
    name: 'untrack() to prevent tracking',
    code: `
component Example() {
  const a = signal(0);
  const b = signal(0);
  
  effect(() => {
    const aVal = a();
    untrack(() => {
      b(aVal);
    });
  });
  
  return <div>{b()}</div>;
}`,
    expectedPatterns: ['effect(() => {', 'untrack(() => {', 'b(aVal)'],
  },
  {
    name: 'untrack() with return value',
    code: `
component Computed() {
  const x = signal(10);
  
  const getValue = () => {
    return untrack(() => {
      return x() * 2;
    });
  };
  
  return <div>{getValue()}</div>;
}`,
    expectedPatterns: ['return untrack(() => {', 'return x() * 2'],
  },
  {
    name: 'Nested untrack() calls',
    code: `
component Nested() {
  const val = signal(0);
  
  effect(() => {
    untrack(() => {
      console.log('Outer');
      untrack(() => {
        console.log('Inner', val());
      });
    });
  });
  
  return <div>{val()}</div>;
}`,
    expectedPatterns: ['untrack(() => {', "console.log('Outer')", "console.log('Inner', val())"],
  },
  {
    name: 'untrack() in event handler',
    code: `
component Interactive() {
  const data = signal([]);
  
  const handleClick = () => {
    untrack(() => {
      const current = data();
      console.log('Current data:', current);
    });
  };
  
  return <button onClick={handleClick}>Log Data</button>;
}`,
    expectedPatterns: [
      'untrack(() => {',
      'const current = data()',
      "console.log('Current data:', current)",
    ],
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
  console.log(`UNTRACK EXECUTION: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 9 validation: untrack() transformation works correctly');
    console.log('The transformer parses untrack() as a normal function call.');
  } else {
    console.log('❌ Feature 9 validation failed');
    process.exit(1);
  }
})();
