/**
 * Test template literal with braces and JSX inside
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
component Test() {
  return (
    <code>{${'`{condition() ? <A /> : <B />}`'}}</code>
  );
}
`;

const test2 = `
component Test() {
  return (
    <code>{${'`condition() ? <A /> : <B />`'}}</code>
  );
}
`;

console.log('Testing template literals with problematic content...\n');

const pipeline = createPipeline({ debug: false });

console.log('Test 1: Template with leading brace + JSX');
const result1 = pipeline.transform(test1);
console.log('  Result:', result1.code ? '✅ PASS' : '❌ FAIL');
if (!result1.code) {
  const error = result1.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}

console.log('\nTest 2: Template without leading brace');
const result2 = pipeline.transform(test2);
console.log('  Result:', result2.code ? '✅ PASS' : '❌ FAIL');
if (!result2.code) {
  const error = result2.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}
