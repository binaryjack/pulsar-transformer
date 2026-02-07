/**
 * Debug Issue #1 - Inspect IR transformation
 */

import { createPipeline } from './src/pipeline/index.js';

const source = `
component Test() {
  const [user, setUser] = signal({ name: 'Alice' });
  return <div>{user().name}</div>;
}
`;

const pipeline = createPipeline({ debug: false });
const result = pipeline.transform(source);

console.log('=== TRANSFORMED CODE ===');
console.log(result.code);
console.log('\n');

// Check if { name: 'Alice' } is in the output
if (result.code.includes("{ name: 'Alice' }") || result.code.includes('{ name: "Alice" }') || result.code.includes('name: "Alice"') || result.code.includes("name: 'Alice'")) {
  console.log('✅ Object literal IS present in transformed code');
} else {
  console.log('❌ Object literal MISSING from transformed code');
  console.log("   Expected: createSignal({ name: 'Alice' })");
  
  // Check what we got instead
  const match = result.code.match(/createSignal\((.*?)\)/s);
