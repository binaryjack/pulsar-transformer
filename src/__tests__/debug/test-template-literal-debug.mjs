#!/usr/bin/env node
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const pipeline = createPipeline({ debug: true });

const code = `component MyComponent() {
  return <div style={\`padding: 1rem;\`}>Test</div>;
}`;

console.log('Testing dynamic style with template literal\n');
console.log('Input code:');
console.log(code);
console.log('\n---\n');

try {
  const result = pipeline.transform(code);

  console.log('Success:', result.code ? 'YES' : 'NO');
  console.log('Output length:', result.code?.length || 0);

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\nDiagnostics:');
    result.diagnostics.forEach((d) => {
      console.log(`  [${d.severity}] ${d.message}`);
      if (d.location) {
        console.log(`    at line ${d.location.line}, column ${d.location.column}`);
      }
    });
  }

  if (result.code) {
    console.log('\nOutput code:');
    console.log(result.code);
  }
} catch (err) {
  console.log('ERROR:', err.message);
  console.log('\nStack trace:');
  console.log(err.stack);
}
