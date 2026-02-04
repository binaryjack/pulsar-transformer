import { createParser } from './dist/parser/index.js';

const parser = createParser();

// Test 1: Simple arrow function (should work)
try {
  const result1 = parser.parse('const fn = () => 42');
  console.log('✓ Test 1 passed: Simple arrow function');
} catch (e) {
  console.log('✗ Test 1 failed:', e.message);
}

// Test 2: Arrow function as argument
try {
  const result2 = parser.parse('const x = items.reduce((sum, item) => sum + item, 0)');
  console.log('✓ Test 2 passed: Arrow function as argument');
} catch (e) {
  console.log('✗ Test 2 failed:', e.message);
}

// Test 3: Simple function call
try {
  const result3 = parser.parse('const x = func(a, b)');
  console.log('✓ Test 3 passed: Simple function call');
} catch (e) {
  console.log('✗ Test 3 failed:', e.message);
}
