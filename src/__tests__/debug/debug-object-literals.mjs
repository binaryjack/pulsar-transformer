/**
 * Debug object literals with string keys
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'Simple object literal',
    code: `component Test() { const obj = { a: 1, b: 2 }; return <div>test</div>; }`,
  },
  {
    name: 'Object with identifier keys',
    code: `component Test() { const obj = { xs: 'small', sm: 'medium' }; return <div>test</div>; }`,
  },
  {
    name: 'Object with string key (single)',
    code: `component Test() { const obj = { '2xl': 'value' }; return <div>test</div>; }`,
  },
  {
    name: 'Object with mixed keys (identifier + string)',
    code: `component Test() { const obj = { xs: 'small', '2xl': 'xlarge' }; return <div>test</div>; }`,
  },
  {
    name: 'Avatar sizeClasses pattern',
    code: `component Test() {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };
  return <div>test</div>;
}`,
  },
  {
    name: 'Full avatar.psr (first 30 lines)',
    code: `import { cn } from '@pulsar-framework/design-tokens';

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return \`\${parts[0][0]}\${parts[parts.length - 1][0]}\`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

component Avatar({ size = 'md', src, name }: any) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    '2xl': 'w-20 h-20 text-2xl',
  };
  
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
