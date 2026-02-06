/**
 * Debug specific template literal patterns
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const testCases = [
  {
    name: 'Template with array access',
    code: `const getInitials = (name) => {
  const parts = name.split(' ');
  return \`\${parts[0]}\`;
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'Template with nested array access',
    code: `const getInitials = (name) => {
  const parts = name.split(' ');
  return \`\${parts[0][0]}\`;
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'Template with method call',
    code: `const getInitials = (name) => {
  return \`\${name}\`.toUpperCase();
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'Template with two expressions',
    code: `const getInitials = (name) => {
  const parts = name.split(' ');
  return \`\${parts[0][0]}\${parts[1][0]}\`;
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'With type annotations (like avatar)',
    code: `const getInitials = (name: string): string => {
  const parts = name.split(' ');
  return \`\${parts[0][0]}\${parts[1][0]}\`;
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'With complex expression',
    code: `const getInitials = (name: string): string => {
  const parts = name.split(' ');
  return \`\${parts[0][0]}\${parts[parts.length - 1][0]}\`;
};
component Test() { return <div>test</div>; }`,
  },
  {
    name: 'With method call on template with expressions',
    code: `const getInitials = (name: string): string => {
  const parts = name.split(' ');
  return \`\${parts[0][0]}\${parts[1][0]}\`.toUpperCase();
};
component Test() { return <div>test</div>; }`,
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
      }
    } else {
      console.log('✅ SUCCESS');
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
  }
});
