import { readFileSync } from 'fs';
import { createPipeline } from './dist/index.js';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node test-parser.js <file.psr>');
  process.exit(1);
}

const source = readFileSync(filePath, 'utf-8');
const pipeline = createPipeline();

try {
  const result = pipeline.transform(source);
  console.log('\n📊 Result:', {
    success: result.success,
    diagnostics: result.diagnostics?.length || 0,
    errors: result.errors?.length || 0,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\n🔍 Diagnostics:');
    result.diagnostics.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.message}`);
      console.log(`     Position: ${d.position}, Line: ${d.line || 'unknown'}`);
    });
  }

  if (result.errors && result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.message || e}`);
    });
  }
} catch (error) {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
