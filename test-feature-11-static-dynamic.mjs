#!/usr/bin/env node
/**
 * Test Feature 11: Static/Dynamic Optimization
 * Verify transformer can detect static vs dynamic JSX
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 11: STATIC/DYNAMIC OPTIMIZATION');
console.log('Verify static JSX detection and optimization');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Fully static JSX',
    code: `
component Static() {
  return <div class="container">
    <h1>Hello World</h1>
    <p>This is static content</p>
  </div>;
}`,
    expectedPatterns: [
      "t_element('div'",
      "'container'",
      "'Hello World'",
      "'This is static content'",
    ],
    description: 'All literal values, no reactive expressions',
  },
  {
    name: 'Dynamic text content',
    code: `
component Dynamic() {
  const name = signal('John');
  return <div>Hello {name()}</div>;
}`,
    expectedPatterns: ["t_element('div'", 'name()'],
    description: 'Signal call makes it dynamic',
  },
  {
    name: 'Static structure with dynamic content',
    code: `
component Hybrid() {
  const count = signal(0);
  return <div class="counter">
    <span>Count:</span>
    <span>{count()}</span>
  </div>;
}`,
    expectedPatterns: ["t_element('div'", "'counter'", "t_element('span'", "'Count:'", 'count()'],
    description: 'Static wrapper, dynamic content',
  },
  {
    name: 'Static attributes, dynamic children',
    code: `
component Mixed() {
  const count = signal(3);
  return <ul class="list">
    <li>{count()}</li>
  </ul>;
}`,
    expectedPatterns: ["t_element('ul'", "'list'", "t_element('li'", 'count()'],
    description: 'Static attributes, dynamic content',
  },
  {
    name: 'Fully dynamic JSX',
    code: `
component AllDynamic() {
  const tag = signal('div');
  const cls = signal('box');
  const content = signal('Dynamic');
  return <Dynamic component={tag()} class={cls()}>{content()}</Dynamic>;
}`,
    expectedPatterns: ["t_element('Dynamic'", 'tag()', 'cls()', 'content()'],
    description: 'Everything is dynamic - component, props, content',
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
        console.log(`   Found all patterns\n`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Missing patterns: ${missing.join(', ')}`);
        console.log(`   Output preview:\n${code.substring(0, 400)}...\n`);
        failed++;
      }
    } catch (err) {
      console.log(`   ❌ FAIL - ${err.message}\n`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log(`STATIC/DYNAMIC OPTIMIZATION: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 11 baseline: Transformer handles static/dynamic JSX');
    console.log('Next: Implement optimization to hoist static JSX and use t_element_static()');
  } else {
    console.log('❌ Feature 11 validation failed');
    process.exit(1);
  }
})();
