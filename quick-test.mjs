// Quick JSX whitespace test
import { createTransformer } from '../dist/index.js';

console.log('Testing JSX whitespace...');

const transformer = createTransformer();
const source = `
component Test() {
  const [first] = createSignal('John');
  const [last] = createSignal('Doe');
  return <div>{first()} {last()}</div>;
}`;

try {
  const result = await transformer.transformPSR(source);
  console.log('Generated code:');
  console.log(result.code);

  // Check if space is preserved
  if (result.code.includes("' '")) {
    console.log('\n✅ SUCCESS: Space preserved in JSX!');
  } else {
    console.log('\n❌ FAILED: Space missing in JSX');
  }
} catch (error) {
  console.error('Error:', error.message);
}
