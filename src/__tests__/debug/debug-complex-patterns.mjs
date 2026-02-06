import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const testCases = [
  {
    name: 'Arrow function with type annotation in event handler',
    code: `component Test() { return <button onMouseOver={(e: MouseEvent) => console.log(e)}>Click</button>; }`
  },
  {
    name: 'Filter with arrow function',
    code: `component Test() { const x = [1,2,3].filter(item => item > 1); return <div>{x}</div>; }`
  },
  {
    name: 'Map with arrow function',
    code: `component Test() { const x = [1,2,3].map((item, index) => item * 2); return <div>{x}</div>; }`
  },
  {
    name: 'JSX map with elements',
    code: `component Test() { return <div>{[1,2,3].map((item, index) => <span key={index}>{item}</span>)}</div>; }`
  },
  {
    name: 'Type cast in event handler',
    code: `component Test() { return <button onClick={(e: MouseEvent) => (e.currentTarget as HTMLElement).style.color = 'red'}>Click</button>; }`
  }
];

const pipeline = createPipeline({ debug: false });

testCases.forEach(({ name, code }, i) => {
  console.log(`\n${i + 1}. Testing: ${name}`);
  console.log('Code:', code.substring(0, 80) + '...');
  
  const timeout = setTimeout(() => {
    console.log('❌ HANGING - Timeout after 3 seconds');
    process.exit(1);
  }, 3000);
  
  try {
    const result = pipeline.transform(code);
    clearTimeout(timeout);
    console.log('✅ SUCCESS -', result.code?.length || 0, 'chars');
  } catch (error) {
    clearTimeout(timeout);
    console.log('❌ ERROR -', error.message.substring(0, 100));
  }
});

console.log('\n✅ All tests completed!');
