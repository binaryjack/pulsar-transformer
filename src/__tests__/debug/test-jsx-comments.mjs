/**
 * Test JSX comments
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
component Test() {
  return (
    <div>
      {/* This is a comment */}
      <span>Hello</span>
    </div>
  );
}
`;

const test2 = `
component Test() {
  return (
    <div>
      <span>Before</span>
      {/* Test Case 1 - Array Mapping */}
      <span>After</span>
    </div>
  );
}
`;

console.log('Testing JSX comments...\n');

const pipeline = createPipeline({ debug: false });

const tests = [
  { name: 'Simple JSX comment', code: test1 },
  { name: 'JSX comment between elements', code: test2 },
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
