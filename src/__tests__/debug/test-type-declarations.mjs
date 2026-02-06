/**
 * Test TypeScript type declaration in PSR
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
type Foo = 'a' | 'b' | 'c';

component Test() {
  return <div>Hello</div>;
}
`;

const test2 = `
import { useState } from '@pulsar-framework/pulsar.dev';

type TestCase = 'home' | 'array-map' | 'nested-components';

component Test() {
  const [activeTest, setActiveTest] = useState<TestCase>('home');
  return <div>Hello</div>;
}
`;

const test3 = `
import { useState } from '@pulsar-framework/pulsar.dev';
import { EdgeCase1ArrayMapPSR } from './edge-case-1-array-map.psr';

type TestCase = 'home' | 'array-map';

component DebugTestSuitePSR() {
  const [activeTest, setActiveTest] = useState<TestCase>('home');
  
  const renderTest = () => {
    const test = activeTest();
    if (test === 'array-map') return EdgeCase1ArrayMapPSR();
    return <div>Home</div>;
  };
  
  return <div>{renderTest()}</div>;
}
`;

console.log('Testing TypeScript type declarations in PSR...\n');

const pipeline = createPipeline({ debug: false });

console.log('Test 1: Simple type declaration');
const result1 = pipeline.transform(test1);
console.log('  Result:', result1.code ? '✅ PASS' : '❌ FAIL');
if (!result1.code) {
  const error = result1.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}

console.log('\nTest 2: Type + useState');
const result2 = pipeline.transform(test2);
console.log('  Result:', result2.code ? '✅ PASS' : '❌ FAIL');
if (!result2.code) {
  const error = result2.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}

console.log('\nTest 3: Full pattern with renderTest function');
const result3 = pipeline.transform(test3);
console.log('  Result:', result3.code ? '✅ PASS' : '❌ FAIL');
if (!result3.code) {
  const error = result3.diagnostics?.find((d) => d.type === 'error');
  console.log('  Error:', error?.message);
}
