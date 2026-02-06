/**
 * Test getInitials function alone
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const source1 = `const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return \`\${parts[0][0]}\${parts[parts.length - 1][0]}\`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};`;

const source2 = `const getInitials = (name: string): string => {
  return \`\${name[0]}\`.toUpperCase();
};`;

const source3 = `const getInitials = (name) => {
  return name.substring(0, 2);
};`;

const pipeline = createPipeline({ debug: false });

[
  { name: 'Avatar getInit ials exact', code: source1 },
  { name: 'Simplified getInitials', code: source2 },
  { name: 'Minimal arrow function', code: source3 },
].forEach((test) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${test.name}`);
  console.log('='.repeat(70));

  try {
    const result = pipeline.transform(test.code);

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
