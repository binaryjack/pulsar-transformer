import { readFileSync } from 'fs'
import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const filePath = './packages/pulsar-ui.dev/src/debug-tests/edge-case-1-array-map.psr';
const source = readFileSync(filePath, 'utf-8');

console.log('Testing:', filePath);
console.log('Source length:', source.length, 'chars\n');

const timeout = setTimeout(() => {
  console.log('\n❌ PROCESS HANGING - Force exit after 10 seconds');
  process.exit(1);
}, 10000);

try {
  const pipeline = createPipeline({ debug: false });
  const result = pipeline.transform(source);
  clearTimeout(timeout);
  
  if (!result.code || result.code.length === 0) {
    console.log('❌ NO CODE GENERATED');
  } else {
    console.log('✅ CODE GENERATED:', result.code.length, 'chars');
  }
  
  console.log('Diagnostics:', result.diagnostics?.length || 0);
  
  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\nDiagnostics:');
    result.diagnostics.slice(0, 10).forEach((d, i) => {
      console.log(`${i + 1}. ${d.message}`);
      if (d.range) {
        console.log(`   Location: Line ${d.range.start.line}, Col ${d.range.start.column}`);
      }
    });
  }
} catch (error) {
  clearTimeout(timeout);
  console.log('\n❌ EXCEPTION:', error.message);
  console.log('\nStack trace (first 10 lines):');
  console.log(error.stack.split('\n').slice(0, 10).join('\n'));
}
