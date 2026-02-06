/**
 * Debug conditional/logical expressions with parentheses
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'Simple logical OR',
    code: `component Test() { const x = a || b; return <div>test</div>; }`,
  },
  {
    name: 'Logical OR with string',
    code: `component Test() { const x = a || 'default'; return <div>test</div>; }`,
  },
  {
    name: 'Logical OR in parentheses',
    code: `component Test() { const x = (a || 'default'); return <div>test</div>; }`,
  },
  {
    name: 'NOT operator with logical OR',
    code: `component Test() { const x = !a && b; return <div>test</div>; }`,
  },
  {
    name: 'NOT with parentheses and logical OR',
    code: `component Test() { const x = !src && (bg || 'default'); return <div>test</div>; }`,
  },
  {
    name: 'Avatar exact pattern line 66',
    code: `component Test({ src, bg }) {
  const x = !src && (bg || 'bg-gray-300 dark:bg-gray-600');
  return <div>test</div>;
}`,
  },
  {
    name: 'Function call with conditional in args',
    code: `component Test({ src, bg, className }) {
  const x = cn(
    'classes',
    sizeClasses[size],
    !src && (bg || 'bg-gray-300 dark:bg-gray-600'),
    className
  );
  return <div>test</div>;
}`,
  },
];

const pipeline = createPipeline({ debug: false });

testCases.forEach((testCase) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(70));

  try {
    const result = pipeline.transform(testCase.code);

    if (!result.code || result.code.trim().length === 0) {
      console.log('❌ FAILED');
      if (result.diagnostics && result.diagnostics.length > 0) {
        console.log(`Error: ${result.diagnostics[0].message}`);
        if (result.diagnostics[0].range) {
          console.log(
            `Line ${result.diagnostics[0].range.start.line}, Column ${result.diagnostics[0].range.start.column}`
          );
        }
      }
    } else {
      console.log('✅ SUCCESS');
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
  }
});
