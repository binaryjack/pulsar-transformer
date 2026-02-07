import { createPipeline } from './src/pipeline/index.js';

const source = `component T() { const [x] = signal({ name: 'Alice' }); return <div/>; }`;

console.log('Testing object signal transformation\n');

const pipeline = createPipeline({ debug: false });
const result = pipeline.transform(source);

console.log('Result object keys:', Object.keys(result));
console.log('\nCode:', result.code);
console.log('\nHas diagnostics?', result.diagnostics?.length || 0);
if (result.diagnostics?.length > 0) {
  console.log('Diagnostics:', JSON.stringify(result.diagnostics, null, 2));
}

// Check if object is in code
if (result.code) {
  if (
    result.code.includes('name:') ||
    result.code.includes('"Alice"') ||
    result.code.includes("'Alice'")
  ) {
    console.log('\n✅ Object literal properties ARE in code');
  } else {
    console.log('\n❌ Object literal properties MISSING');
    const match = result.code.match(/createSignal\(([^)]*)\)/);
    if (match) {
      console.log('createSignal argument:', match[1] || '(empty)');
    }
  }
}
