import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

console.log('Testing edge-case-2-nested-components.psr...\n');

const psrCode = readFileSync(
  './packages/pulsar-ui.dev/src/debug-tests/edge-case-2-nested-components.psr',
  'utf-8'
);

const pipeline = createPipeline({
  debug: true,
  debugLogger: {
    enabled: true,
    console: true,
    timestamps: true,
    performance: true,
    minLevel: 'trace',
  },
});

try {
  const result = pipeline.transform(psrCode);

  if (result.success && result.code) {
    console.log('\n✅ SUCCESS!');
    console.log(`Generated ${result.code.length} chars, ${result.code.split('\n').length} lines`);
    console.log('\nFirst 500 chars of output:');
    console.log(result.code.substring(0, 500));
  } else {
    console.log('\n❌ FAILED');
    console.log('Diagnostics:', result.diagnostics?.length || 0);
    result.diagnostics?.forEach((d, i) => {
      console.log(`${i + 1}. ${d.message}`);
    });
  }
} catch (error) {
  console.log('\n❌ ERROR THROWN');
  console.log(error.message);
  console.log(error.stack);
}
