/**
 * Test import statement parsing with .psr extension
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
import { foo } from './utils.ts';

component Test() {
  return <div>Hello</div>;
}
`;

const test2 = `
import { foo } from './utils.psr';

component Test() {
  return <div>Hello</div>;
}
`;

const test3 = `
import { EdgeCase1ArrayMapPSR } from './edge-case-1-array-map.psr';
import { EdgeCase2NestedComponentsPSR } from './edge-case-2-nested-components.psr';

component Test() {
  return <div>Hello</div>;
}
`;

console.log('Testing import statement parsing with different extensions...\n');

const pipeline = createPipeline({ debug: false });

console.log('Test 1: .ts extension');
const result1 = pipeline.transform(test1);
console.log('  Result:', result1.code ? '✅ PASS' : '❌ FAIL');
if (!result1.code) {
  const error = result1.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}

console.log('\nTest 2: .psr extension');
const result2 = pipeline.transform(test2);
console.log('  Result:', result2.code ? '✅ PASS' : '❌ FAIL');
if (!result2.code) {
  const error = result2.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}

console.log('\nTest 3: Multiple .psr imports');
const result3 = pipeline.transform(test3);
console.log('  Result:', result3.code ? '✅ PASS' : '❌ FAIL');
if (!result3.code) {
  const error = result3.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}
