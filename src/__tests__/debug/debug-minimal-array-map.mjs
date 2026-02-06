import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

// Start with a reduced version of edge-case-1-array-map.psr
const minimalVersion = `
import { useState } from '@pulsar-framework/pulsar.dev';

component MinimalArrayMap() {
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);

  return (
    <div>
      <h1>Array Map Test</h1>
      <div>
        {items().map((item, index) => (
          <div key={index}>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { MinimalArrayMap };
`;

console.log('Testing minimal version of edge-case-1-array-map.psr...\n');

const timeout = setTimeout(() => {
  console.log('❌ HANGING - Killing process');
  process.exit(1);
}, 5000);

try {
  const pipeline = createPipeline({ debug: false });
  const result = pipeline.transform(minimalVersion);
  clearTimeout(timeout);
  
  console.log('✅ SUCCESS!');
  console.log('Code length:', result.code?.length || 0);
  console.log('Diagnostics:', result.diagnostics?.length || 0);
  
  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('\nDiagnostics:');
    result.diagnostics.forEach((d, i) => {
      console.log(`${i + 1}. ${d.message}`);
    });
  }
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ ERROR:', error.message);
}
