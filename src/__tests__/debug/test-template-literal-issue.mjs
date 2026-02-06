/**
 * Test minimal reproduction of template literal issue
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCase1 = `
component Test() {
  return <div>{${'`simple template`'}}</div>;
}
`;

const testCase2 = `
component Test() {
  return <div>{${'`{code inside}`'}}</div>;
}
`;

const testCase3 = `
component Test() {
  return (
    <code>{${'`{condition() ? <A /> : <B />}`'}}</code>
  );
}
`;

console.log('Testing template literal parsing...\n');

const pipeline = createPipeline({ debug: false });

console.log('Test 1: Simple template literal');
const result1 = pipeline.transform(testCase1);
console.log('  Result:', result1.code ? '✅ PASS' : '❌ FAIL');
if (result1.diagnostics?.length) {
  console.log('  Error:', result1.diagnostics[0].message);
}

console.log('\nTest 2: Template with braces');
const result2 = pipeline.transform(testCase2);
console.log('  Result:', result2.code ? '✅ PASS' : '❌ FAIL');
if (result2.diagnostics?.length) {
  console.log('  Error:', result2.diagnostics[0].message);
}

console.log('\nTest 3: Template with JSX-like syntax');
const result3 = pipeline.transform(testCase3);
console.log('  Result:', result3.code ? '✅ PASS' : '❌ FAIL');
if (result3.diagnostics?.length) {
  console.log('  Error:', result3.diagnostics[0].message);
}
