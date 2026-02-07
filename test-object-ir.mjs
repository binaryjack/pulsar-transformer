/**
 * Quick test - Check what IR is generated for object argument
 */

import { createPipeline } from './src/pipeline/index.js';

const source1 = `component T1() { const [x] = signal(5); return <div/>;  }`;
const source2 = `component T2() { const [x] = signal({ name: 'Alice' }); return <div/>; }`;

const pipeline = createPipeline({ debug: true });

console.log('=== Test 1: Number argument ===');
const result1 = pipeline.transform(source1);
console.log(result1.code);
console.log('\n');

console.log('=== Test 2: Object argument ===');
const result2 = pipeline.transform(source2);
console.log(result2.code);
console.log('\nDiagnostics:', JSON.stringify(result2.diagnostics, null, 2));
