import { createParser } from './dist/parser/create-parser.js';

// Simple test to debug async/await parsing
console.log('Testing async/await parsing...');

const parser = createParser();

// Test 1: Simple async function
const test1 = 'async function test() { await promise; }';
console.log('\n=== Test 1: Simple async function ===');
console.log('Source:', test1);
try {
  const ast1 = parser.parse(test1);
  console.log('✅ PARSED SUCCESSFULLY');
  const func = ast1.body[0];
  console.log('Function async:', func.async);
  console.log('Body statement count:', func.body.body.length);
  if (func.body.body[0]?.expression?.type === 'AwaitExpression') {
    console.log('✅ AWAIT EXPRESSION DETECTED');
  }
} catch (error) {
  console.log('❌ PARSE ERROR:', error.message);
}

// Test 2: Await with call expression
const test2 = 'async function test() { await fetch(); }';
console.log('\n=== Test 2: Await with call ===');
console.log('Source:', test2);
try {
  const ast2 = parser.parse(test2);
  console.log('✅ PARSED SUCCESSFULLY');
} catch (error) {
  console.log('❌ PARSE ERROR:', error.message);
}
