import { createPipeline } from './dist/pipeline/create-pipeline.js';

const source = `
component TamilText() {
  return <div>தமிழ்</div>;
}`;

const pipeline = createPipeline();
const result = await pipeline.transform(source);

console.log('=== CODE ===');
console.log(result.code);

console.log('\n=== CHECKING ===');
console.log('Contains Tamil characters:', result.code.includes('தமிழ்'));
console.log('Contains escaped \\u0BA4:', result.code.includes('\\u0BA4'));
console.log('Contains escaped u0BA4:', result.code.includes('u0BA4'));
