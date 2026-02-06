import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const testCases = [
  {
    name: 'Simple component',
    code: `component Test() { return <div>Hello</div>; }`
  },
  {
    name: 'Template literal (no embedded expression)',
    code: `component Test() { const x = \`hello\`; return <div>{x}</div>; }`
  },
  {
    name: 'Template literal with embedded expression',
    code: `component Test() { const x = \`hello \${world}\`; return <div>{x}</div>; }`
  }
];

const pipeline = createPipeline({ debug: false });

testCases.forEach(({ name, code }) => {
  console.log(`\nTesting: ${name}`);
  console.log('Code:', code);
  
  const timeout = setTimeout(() => {
    console.log('❌ HANGING - Timeout after 2 seconds\n');
    process.exit(1);
  }, 2000);
  
  try {
    const result = pipeline.transform(code);
    clearTimeout(timeout);
    console.log('✅ SUCCESS -', result.code?.length || 0, 'chars\n');
  } catch (error) {
    clearTimeout(timeout);
    console.log('❌ ERROR -', error.message, '\n');
  }
});

console.log('All tests completed!');
