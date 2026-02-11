/**
 * Test component with simple generic type
 */

import { createPipeline } from './dist/index.js';

const code = 'component Box<T>(value: T) { return <div></div>; }';

console.log('Testing component with simple generic...');
console.log(`\nInput: ${code}`);

try {
  const pipeline = createPipeline({ debug: true });
  const result = await pipeline.transform(code);

  console.log(`\nOutput: ${result.code}`);
  console.log(`\nDiagnostics: ${JSON.stringify(result.diagnostics, null, 2)}`);
} catch (error) {
  console.error(`\nError: ${error.message}`);
}
