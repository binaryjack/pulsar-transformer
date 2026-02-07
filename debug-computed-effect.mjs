import { createPipeline } from './dist/pipeline/create-pipeline.js';

const source = `
component Advanced() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  effect(() => {
    console.log('Count:', count());
  });
  
  return <div>{doubled()}</div>;
}`;

const pipeline = createPipeline();
const result = await pipeline.transform(source);

console.log('=== CHECKING computed/effect TRANSFORMATION ===');
console.log('Contains createMemo:', result.code.includes('createMemo'));
console.log('Contains computed:', result.code.includes('computed'));
console.log('Contains createEffect:', result.code.includes('createEffect'));
console.log('Contains effect:', result.code.includes('effect'));

console.log('\n=== CODE ===');
console.log(result.code);
