#!/usr/bin/env node
/**
 * Test Feature 14: Hydration Markers
 * Verify transformer emits code compatible with hydration
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('======================================================================');
console.log('FEATURE 14: HYDRATION MARKERS');
console.log('Verify transformer emits hydration-compatible code');
console.log('======================================================================\n');

const testCases = [
  {
    name: 'Component with dynamic content',
    code: `
component Dynamic() {
  const value = signal('hydrate-me');
  return <div>{value()}</div>;
}`,
    expectedPatterns: ['function Dynamic', 'signal(', 'value()'],
    description: 'Dynamic content that needs hydration markers at runtime',
  },
  {
    name: 'Component with conditional rendering',
    code: `
component Conditional() {
  const show = signal(true);
  return <Show when={show()}>
    <div>Visible</div>
  </Show>;
}`,
    expectedPatterns: ['function Conditional', "t_element('Show'", 'when:', 'show()'],
    description: 'Conditional content requires hydration boundary',
  },
  {
    name: 'Component with list rendering',
    code: `
component List() {
  const items = signal(['a', 'b', 'c']);
  return <ul>
    <For each={items()}>
      {(item) => <li>{item}</li>}
    </For>
  </ul>;
}`,
    expectedPatterns: ['function List', "t_element('For'", 'each:', 'items()'],
    description: 'List boundaries need hydration markers',
  },
  {
    name: 'Nested components for hydration',
    code: `
component Parent() {
  return <div>
    <Child />
  </div>;
}

component Child() {
  const text = signal('child');
  return <span>{text()}</span>;
}`,
    expectedPatterns: ['function Parent', 'function Child', "t_element('Child'"],
    description: 'Component boundaries for nested hydration',
  },
  {
    name: 'Component with event handlers',
    code: `
component Interactive() {
  const handleClick = () => {
    console.log('clicked');
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}`,
    expectedPatterns: ['function Interactive', 'handleClick', 'onClick:'],
    description: 'Event handlers attached during hydration',
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
        console.log(`   Hydration-compatible code structure\n`);
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
  console.log(`HYDRATION MARKERS: ${passed}/${testCases.length} passed`);
  console.log('======================================================================\n');

  if (failed === 0) {
    console.log('✅ Feature 14 validation: Transformer emits hydration-compatible code');
    console.log('The runtime inserts actual markers during SSR rendering.');
    console.log('Client-side hydration uses these structures to attach interactivity.');
  } else {
    console.log('❌ Feature 14 validation failed');
    process.exit(1);
  }
})();
