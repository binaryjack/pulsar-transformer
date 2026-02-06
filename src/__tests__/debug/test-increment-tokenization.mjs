import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const code = 'for (let i = 0; i < 10; i++) {}';

// Use debug to see tokens
const pipeline = createPipeline({
  debug: true,
  debugLogger: {
    enabled: true,
    console: true,
    timestamps: false,
    performance: false,
    minLevel: 'trace',
  },
});

console.log('\n=== Testing tokenization of: for (let i = 0; i < 10; i++) {} ===\n');
const result = pipeline.transform(`component Test() { ${code} return <div />; }`);

if (!result.success) {
  console.log('\n❌ Transform failed:', result.diagnostics);
} else {
  console.log('\n✅ Transform succeeded');
}
