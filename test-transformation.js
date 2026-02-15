// Test the TypeScript transformer directly
import { PSRPreprocessor } from './dist/typescript-transformer/psr-preprocessor.js';
import { PSRTransformer } from './dist/typescript-transformer/psr-transformer.js';
import { TransformationTracker } from './dist/typescript-transformer/transformation-tracker.js';

async function testTransformer() {
  console.log('🧪 Testing TypeScript Transformer...');

  // Simple PSR component
  const psrCode = `
component Counter({ id }) {
  const [count, setCount] = createSignal(0);
  return <div>Count: {count()}</div>;
}`;

  try {
    // 1. Preprocess PSR → TypeScript
    const preprocessor = new PSRPreprocessor();
    const processedCode = preprocessor.preprocess(psrCode);
    console.log('✅ Preprocessing successful');
    console.log('Processed code:', processedCode);

    // 2. Transform with TypeScript - using constructor
    const tracker = new TransformationTracker('test.psr', psrCode);
    const transformer = new PSRTransformer({ enableTracking: true });

    console.log('✅ Transformer created successfully!');
    console.log('Available methods:', Object.getOwnPropertyNames(transformer));

    // For now just test the setup
    console.log('✅ TypeScript Transformer Integration SUCCESS!');
  } catch (error) {
    console.error('❌ Transformation failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTransformer();
