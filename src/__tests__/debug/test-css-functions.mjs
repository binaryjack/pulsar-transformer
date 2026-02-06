/**
 * Test CSS functions in style attributes
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
component Test() {
  return <div style="display: grid;">Hello</div>;
}
`;

const test2 = `
component Test() {
  return <div style="display: grid; grid-template-columns: 1fr 1fr;">Hello</div>;
}
`;

const test3 = `
component Test() {
  return <div style="display: grid; grid-template-columns: repeat(2, 1fr);">Hello</div>;
}
`;

const test4 = `
component Test() {
  return <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">Hello</div>;
}
`;

console.log('Testing CSS functions in style attributes...\n');

const pipeline = createPipeline({ debug: false });

const tests = [
  { name: 'Simple grid', code: test1 },
  { name: 'Grid with columns', code: test2 },
  { name: 'Grid with repeat()', code: test3 },
  { name: 'Grid with repeat() + minmax()', code: test4 },
];

tests.forEach((test) => {
  const result = pipeline.transform(test.code);
  const status = result.code ? '✅' : '❌';
  console.log(`${status} ${test.name}`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    console.log(`    Error: ${error?.message}`);
  }
});
