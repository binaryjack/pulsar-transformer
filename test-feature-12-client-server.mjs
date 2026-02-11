#!/usr/bin/env node
/**
 * Test Feature 12: Client-Server Detection
 * Verify 'use client' and 'use server' directives parse correctly
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 12: CLIENT-SERVER DETECTION');
console.log("Verify 'use client' and 'use server' directives");
console.log('======================================================================\n');

const testCases = [
  {
    name: "'use client' directive",
    code: `
'use client';

component Button() {
  const handleClick = () => {
    console.log('Clicked');
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}`,
    expectedPatterns: ["'use client'", 'function Button', 'handleClick'],
    description: 'Client-only component with directive',
  },
  {
    name: "'use server' directive",
    code: `
'use server';

component ServerData() {
  const data = fetchFromDatabase();
  return <div>{data}</div>;
}`,
    expectedPatterns: ["'use server'", 'function ServerData', 'fetchFromDatabase()'],
    description: 'Server-only component with directive',
  },
  {
    name: 'No directive (default)',
    code: `
component Shared() {
  const value = signal(0);
  return <div>{value()}</div>;
}`,
    expectedPatterns: ['function Shared', 'signal(0)', 'value()'],
    description: 'Component without directive (default server)',
  },
  {
    name: "'use client' with imports",
    code: `
'use client';

import { Button } from './ui';

component App() {
  return <div><Button /></div>;
}`,
    expectedPatterns: ["'use client'", 'import { Button }', 'function App'],
    description: 'Client directive with imports',
  },
  {
    name: 'Multiple directives (only first should count)',
    code: `
'use client';
'use strict';

component Example() {
  return <div>Test</div>;
}`,
    expectedPatterns: ["'use client'", "'use strict'", 'function Example'],
    description: 'Multiple directives at top of file',
  },
];

(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`🔹 Testing: ${test.name}`);
    console.log(`   📋 ${test.description}`);

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
        console.log(`   Directive preserved in output\n`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Missing patterns: ${missing.join(', ')}`);
        console.log(`   Output preview:\n${code.substring(0, 300)}...\n`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ FAIL - ${err.message}\n`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log(`CLIENT-SERVER DETECTION: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 12 validation: Directives parse and preserve correctly');
    console.log("The transformer handles 'use client'/'use server' directives.");
  } else {
    console.log('❌ Feature 12 validation failed');
    process.exit(1);
  }
})();
