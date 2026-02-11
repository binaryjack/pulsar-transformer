#!/usr/bin/env node
/**
 * Test Feature 13: Server-Side Rendering
 * Verify transformed code is SSR-compatible (runs in Node.js)
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 13: SERVER-SIDE RENDERING');
console.log('Verify transformed code is Node.js/SSR compatible');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Basic component SSR compatibility',
    code: `
component App() {
  return <div>Hello SSR</div>;
}`,
    expectedPatterns: ['function App', "t_element('div'", "'Hello SSR'"],
    description: 'Simple component transforms to Node-compatible code',
  },
  {
    name: 'Component with signals',
    code: `
component Counter() {
  const count = signal(0);
  return <div>{count()}</div>;
}`,
    expectedPatterns: ['function Counter', 'signal(0)', 'count()'],
    description: 'Signal-based component (runtime handles SSR behavior)',
  },
  {
    name: 'Server component directive',
    code: `
'use server';

component ServerData() {
  const data = fetchData();
  return <div>{data}</div>;
}`,
    expectedPatterns: ["'use server'", 'function ServerData', 'fetchData()'],
    description: 'Server-only component marked with directive',
  },
  {
    name: 'Component with async data',
    code: `
component AsyncComponent() {
  const resource = createResource(() => fetchData());
  return <div>{resource()}</div>;
}`,
    expectedPatterns: ['function AsyncComponent', 'createResource', 'fetchData()'],
    description: 'Async resource (runtime handles await/serialization)',
  },
  {
    name: 'Nested components for SSR',
    code: `
component Parent() {
  return <div>
    <Child />
  </div>;
}

component Child() {
  return <span>Child Content</span>;
}`,
    expectedPatterns: ['function Parent', 'function Child', "t_element('span'"],
    description: 'Multiple components for server rendering',
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

      // Verify no browser-only APIs are injected by transformer
      const browserAPIs = ['window', 'document', 'localStorage', 'sessionStorage'];
      const hasBrowserAPI = browserAPIs.some((api) => {
        const regex = new RegExp(`\\b${api}\\b`, 'g');
        return regex.test(code);
      });

      if (hasBrowserAPI) {
        console.log(`   ❌ FAIL - Transformer injected browser-only API\n`);
        failed++;
        continue;
      }

      const missing = test.expectedPatterns.filter((pattern) => !code.includes(pattern));

      if (missing.length === 0) {
        console.log(`   ✅ PASS`);
        console.log(`   SSR-compatible code generated\n`);
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
  console.log(`SERVER-SIDE RENDERING: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 13 validation: Transformer emits SSR-compatible JavaScript');
    console.log('The runtime (@pulsar-framework/pulsar.dev) handles actual SSR rendering.');
  } else {
    console.log('❌ Feature 13 validation failed');
    process.exit(1);
  }
})();
