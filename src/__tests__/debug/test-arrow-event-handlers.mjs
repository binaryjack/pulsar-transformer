/**
 * Test arrow function with block body in event handler
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const test1 = `
component Test() {
  return (
    <div onClick={() => console.log('click')}>Test</div>
  );
}
`;

const test2 = `
component Test() {
  return (
    <div onClick={(e) => console.log('click')}>Test</div>
  );
}
`;

const test3 = `
component Test() {
  return (
    <div onClick={(e) => {
      console.log('click');
    }}>Test</div>
  );
}
`;

const test4 = `
component Test() {
  return (
    <div onMouseOver={(e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
    }}>Test</div>
  );
}
`;

console.log('Testing arrow functions in event handlers...\n');

const pipeline = createPipeline({ debug: false });

const tests = [
  { name: 'Simple arrow', code: test1 },
  { name: 'Arrow with param', code: test2 },
  { name: 'Arrow with block body', code: test3 },
  { name: 'Arrow with type annotation + block + property access', code: test4 },
];

tests.forEach((test) => {
  const result = pipeline.transform(test.code);
  const status = result.code ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
  
  if (!result.code) {
    const error = result.diagnostics?.find(d => d.type === 'error');
    console.log(`    Error: ${error?.message}`);
  }
});
