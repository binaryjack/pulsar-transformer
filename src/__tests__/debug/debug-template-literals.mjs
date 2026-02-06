/**
 * Debug template literals
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'Simple template literal (no expressions)',
    code: `component Test() { const str = \`hello\`; return <div>test</div>; }`,
  },
  {
    name: 'Template literal with expression',
    code: `component Test() { const str = \`hello \${name}\`; return <div>test</div>; }`,
  },
  {
    name: 'Template literal in arrow function',
    code: `const getInitials = (name) => {
  return \`\${name[0]}\`.toUpperCase();
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'Avatar getInitials exact pattern',
    code: `const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return \`\${parts[0][0]}\${parts[parts.length - 1][0]}\`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

component Avatar() { return <div>test</div>; }`,
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
        });
      }
    } else {
      console.log('✅ SUCCESS');
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
  }
});
