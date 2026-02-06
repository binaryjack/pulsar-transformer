/**
 * Test exact avatar.psr file
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const avatarPath = './packages/pulsar-ui.dev/src/components/atoms/avatar/avatar.psr';
const source = readFileSync(avatarPath, 'utf-8');

console.log('Testing avatar.psr');
console.log('='.repeat(70));
console.log(`File: ${avatarPath}`);
console.log(`Source length: ${source.length} chars`);
console.log('='.repeat(70));

const pipeline = createPipeline({ debug: true });

try {
  const result = pipeline.transform(source);

  if (!result.code || result.code.trim().length === 0) {
    console.log('\n❌ FAILED - No code generated\n');
    if (result.diagnostics && result.diagnostics.length > 0) {
      console.log('Diagnostics:');
      result.diagnostics.forEach((diag, i) => {
        console.log(`\n${i + 1}. ${diag.message}`);
        if (diag.range) {
          console.log(`   Line ${diag.range.start.line}, Column ${diag.range.start.column}`);
        }
      });
    }
  } else {
    console.log('\n✅ SUCCESS\n');
    console.log(`Generated ${result.code.split('\n').length} lines of code`);
  }
} catch (error) {
  console.log('\n❌ EXCEPTION\n');
  console.log(`Error: ${error.message}`);
  console.log('\nStack:');
  console.log(error.stack);
}
