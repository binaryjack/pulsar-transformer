import { readFileSync } from 'fs'
import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const filePath = './packages/pulsar-ui.dev/src/debug-tests/edge-case-1-array-map.psr';
const source = readFileSync(filePath, 'utf-8');

console.log('Testing:', filePath);
console.log('Source length:', source.length);

try {
  const pipeline = createPipeline({ debug: false });
  const result = pipeline.transform(source);
  
  console.log('\n✅ SUCCESS');
  console.log('Code length:', result.code?.length || 0);
  console.log('Lines:', result.code?.split('\n').length || 0);
  console.log('Diagnostics:', result.diagnostics?.length || 0);
  
  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\nDiagnostics:');
    result.diagnostics.forEach((d, i) => {
      console.log(`${i + 1}. ${d.message}`);
    });
  }
} catch (error) {
  console.log('\n❌ ERROR');
  console.log('Message:', error.message);
  console.log('\nStack:');
  console.log(error.stack);
}
