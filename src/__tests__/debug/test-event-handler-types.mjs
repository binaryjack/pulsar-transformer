/**
 * Test event handler with type annotation
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCase1 = `
component Test() {
  return (
    <div
      onClick={() => console.log('click')}
    >Test</div>
  );
}
`;

const testCase2 = `
component Test() {
  return (
    <div
      onClick={(e: MouseEvent) => {
        console.log('click');
      }}
    >Test</div>
  );
}
`;

const testCase3 = `
component Test() {
  return (
    <div
      onMouseOver={(e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
      }}
    >Test</div>
  );
}
`;

console.log('Testing event handlers with type annotations...\n');

const pipeline = createPipeline({ debug: false });

console.log('Test 1: Simple arrow function');
const result1 = pipeline.transform(testCase1);
console.log('  Result:', result1.code ? '✅ PASS' : '❌ FAIL');
if (!result1.code && result1.diagnostics?.length) {
  console.log('  Error:', result1.diagnostics.find((d) => d.type === 'error')?.message);
}

console.log('\nTest 2: Arrow function with type annotation');
const result2 = pipeline.transform(testCase2);
console.log('  Result:', result2.code ? '✅ PASS' : '❌ FAIL');
if (!result2.code && result2.diagnostics?.length) {
  console.log('  Error:', result2.diagnostics.find((d) => d.type === 'error')?.message);
}

console.log('\nTest 3: Arrow function with type annotation and type assertion');
const result3 = pipeline.transform(testCase3);
console.log('  Result:', result3.code ? '✅ PASS' : '❌ FAIL');
if (!result3.code && result3.diagnostics?.length) {
  console.log('  Error:', result3.diagnostics.find((d) => d.type === 'error')?.message);
}
