import { createPipeline } from './src/index.ts';
import { readFileSync } from 'fs';

const input = readFileSync('./tests/fixtures/real-psr/03-drawer.psr', 'utf-8');
console.log('Input length:', input.length);
console.log('First 100 chars:', input.substring(0, 100));

const pipeline = createPipeline({ debug: true });
try {
  const result = await pipeline.transform(input);
  console.log('Result keys:', Object.keys(result));
  console.log('Code length:', result.code?.length || 0);
  console.log('Success:', result.success);
  console.log('Diagnostics:', result.diagnostics?.length || 0);
  
  if (result.diagnostics?.length > 0) {
    result.diagnostics.forEach(d => console.log(`${d.type}: ${d.message}`));
  }
  
  if (result.code) {
    console.log('First 200 chars of code:', result.code.substring(0, 200));
  } else {
    console.log('CODE IS EMPTY OR UNDEFINED!');
  }
} catch (e) {
  console.error('Error:', e.message);
  console.error('Stack:', e.stack);
}