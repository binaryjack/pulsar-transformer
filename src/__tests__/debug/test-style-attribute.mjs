#!/usr/bin/env node
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const pipeline = createPipeline({ debug: false });

const testCases = [
  {
    name: 'Static style attribute',
    code: `component MyComponent() {
  return <div style="padding: 1rem;">Test</div>;
}`,
  },
  {
    name: 'Dynamic style with string variable',
    code: `component MyComponent() {
  const styles = "padding: 1rem;";
  return <div style={styles}>Test</div>;
}`,
  },
  {
    name: 'Dynamic style with template literal',
    code: `component MyComponent() {
  return <div style={\`padding: 1rem;\`}>Test</div>;
}`,
  },
  {
    name: 'Dynamic style with template literal and variable',
    code: `component MyComponent() {
  const padding = "2rem";
  return <div style={\`padding: \${padding};\`}>Test</div>;
}`,
  },
  {
    name: 'Dynamic className with template literal',
    code: `component MyComponent() {
  return <div className={\`my-class\`}>Test</div>;
}`,
  },
  {
    name: 'Static style + other attributes',
    code: `component MyComponent() {
  return <div id="test" style="padding: 1rem;" className="box">Test</div>;
}`,
  },
  {
    name: 'Dynamic style after static attributes',
    code: `component MyComponent() {
  return <div id="test" style={\`padding: 1rem;\`} className="box">Test</div>;
}`,
  },
];

console.log('Testing style attribute variations\n');

for (const test of testCases) {
  try {
    const result = pipeline.transform(test.code);

    if (result.code && result.code.length > 50) {
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Output: ${result.code.length} chars`);
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Output: ${result.code?.length || 0} chars`);
      if (result.diagnostics && result.diagnostics.length > 0) {
        result.diagnostics.forEach((d) => console.log(`   - ${d.message}`));
      }
    }
  } catch (err) {
    console.log(`❌ ${test.name}: ERROR`);
    console.log(`   ${err.message}`);
  }
  console.log('');
}
