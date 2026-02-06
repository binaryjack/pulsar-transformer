import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

// Start with minimal array map version
const minimalVersion = `
import { useState } from '@pulsar-framework/pulsar.dev';

component MinimalArrayMap() {
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);

  return (
    <div>
      {items().map((item, index) => (
        <div key={index}><span>{item}</span></div>
      ))}
    </div>
  );
}

export { MinimalArrayMap };
`;

console.log('Testing minimal array map with better error handling...\n');

try {
  // Wrap the transformation in a try-catch to get stack
  const pipeline = createPipeline({ debug: true }); // Enable debug mode
  const result = pipeline.transform(minimalVersion);
  
  console.log('✅ Transformed successfully!');
  console.log('Code length:', result.code?.length || 0);
  console.log('\nGenerated code:');
  console.log('= '.repeat(40));
  console.log(result.code || 'NO CODE');
  console.log('= '.repeat(40));
  
  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\nDiagnostics:');
    result.diagnostics.forEach((d, i) => {
      console.log(`${i + 1}. ${d.severity}: ${d.message}`);
      if (d.range) {
        console.log(`   Line ${d.range.start.line}, Col ${d.range.start.column}`);
      }
    });
  }
} catch (error) {
  console.log('❌ EXCEPTION THROWN');
  console.log('\nError:', error.message);
  console.log('\nFull Stack:');
  console.log(error.stack);
}
