import { createPipeline } from './dist/pipeline/create-pipeline.js';

const source = `
component Counter() {
  const [count, setCount] = signal(0);
  return <div>{count()}</div>;
}
`;

const pipeline = createPipeline();
const result = await pipeline.transform(source);

console.log('=== RESULT ===');
console.log('Code:', result.code);
console.log('\n=== DIAGNOSTICS ===');
console.log(JSON.stringify(result.diagnostics, null, 2));
