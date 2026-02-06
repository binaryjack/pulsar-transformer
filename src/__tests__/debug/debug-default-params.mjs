/**
 * Debug default parameters parsing
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'Simple param no default',
    code: `component Test({ size }) { return <div>{size}</div>; }`,
  },
  {
    name: 'Simple param with default',
    code: `component Test({ size = 'md' }) { return <div>{size}</div>; }`,
  },
  {
    name: 'Two params with defaults',
    code: `component Test({ size = 'md', color = 'blue' }) { return <div></div>; }`,
  },
  {
    name: 'Mix params with and without defaults',
    code: `component Test({ size = 'md', name }) { return <div></div>; }`,
  },
];

const pipeline = createPipeline({ debug: true });

testCases.forEach((testCase) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(60));
  console.log(`CODE: ${testCase.code}\n`);

  try {
    const result = pipeline.transform(testCase.code);

    if (!result.code || result.code.trim().length === 0) {
      console.log('❌ FAILED - No code generated');
      if (result.diagnostics && result.diagnostics.length > 0) {
        console.log('Diagnostics:');
        result.diagnostics.forEach((diag) => {
          console.log(`  - ${diag.message}`);
          if (diag.range) {
            console.log(`    at line ${diag.range.start.line}, column ${diag.range.start.column}`);
          }
        });
      }
    } else {
      console.log('✅ SUCCESS');
      console.log('Generated code:');
      console.log(result.code);
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
    console.log(error.stack);
  }
});
