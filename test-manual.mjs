/**
 * Manual Test Script - PSR Transformation
 *
 * Tests the complete transformation pipeline.
 */

import { createPipeline } from './src/pipeline/create-pipeline.js';

async function testTransformation() {
  console.log('=== PSR Transformation Test ===\n');

  const pipeline = createPipeline();

  // Test 1: Signal transformation
  console.log('Test 1: Signal Transformation');
  const signalTest = `
component Counter() {
  const [count, setCount] = signal(0);
  return <div>{count()}</div>;
}`;

  try {
    const result1 = await pipeline.transform(signalTest);
    console.log('✓ Transformation completed');
    console.log('Contains createSignal():', result1.code.includes('createSignal'));
    console.log('Contains signal():', result1.code.includes('signal('));
    console.log('\nGenerated code:');
    console.log(result1.code);
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
  }

  // Test 2: Unicode escaping
  console.log('\n\nTest 2: Unicode Escaping');
  const unicodeTest = `
component Tamil() {
  return <div>தமிழ் 中文 😀</div>;
}`;

  try {
    const result2 = await pipeline.transform(unicodeTest);
    console.log('✓ Transformation completed');
    console.log('Contains unicode escapes:', result2.code.includes('\\u'));
    console.log('\nGenerated code:');
    console.log(result2.code);
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
  }

  // Test 3: Multiple reactivity primitives
  console.log('\n\nTest 3: Multiple Reactivity Primitives');
  const multiTest = `
component Advanced() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  effect(() => {
    console.log('Count:', count());
  });
  
  return <div>{doubled()}</div>;
}`;

  try {
    const result3 = await pipeline.transform(multiTest);
    console.log('✓ Transformation completed');
    console.log('Contains createSignal:', result3.code.includes('createSignal'));
    console.log('Contains createMemo:', result3.code.includes('createMemo'));
    console.log('Contains createEffect:', result3.code.includes('createEffect'));
    console.log('Contains signal():', result3.code.includes('signal('));
    console.log('Contains computed():', result3.code.includes('computed('));
    console.log('Contains effect():', result3.code.includes('effect('));
    console.log('\nGenerated code:');
    console.log(result3.code);
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
  }

  console.log('\n\n=== Test Complete ===');
}

testTransformation().catch(console.error);
