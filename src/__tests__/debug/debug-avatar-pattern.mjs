/**
 * Debug avatar.psr specific patterns
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'With type annotation (like avatar.psr)',
    code: `component Test({ size = 'md' }: Props) { return <div>{size}</div>; }`,
  },
  {
    name: 'With spread operator',
    code: `component Test({ size, ...rest }) { return <div {...rest}>{size}</div>; }`,
  },
  {
    name: 'With default + spread',
    code: `component Test({ size = 'md', ...rest }) { return <div {...rest}>{size}</div>; }`,
  },
  {
    name: 'With default + spread + type (full avatar pattern)',
    code: `component Test({ size = 'md', name, ...rest }: Props) { return <div>{size}</div>; }`,
  },
  {
    name: 'Avatar actual first line',
    code: `component Avatar({
  size = 'md',
  src,
  alt,
  name,
  status,
  bg,
  className,
  ...rest
}: IAvatarProps) { return <div></div>; }`,
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
      console.log(`Generated ${result.code.split('\n').length} lines`);
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
  }
});
