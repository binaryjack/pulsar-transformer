// Simple test to verify JSX fragment parsing
import { createParser } from './src/parser/create-parser.js';

async function testJSXFragment() {
  try {
    console.log('=== Testing JSX Fragment ===');

    const parser = createParser();
    const source = '<></>';
    console.log('Source:', source);

    const result = parser.parse(source);
    console.log('Result type:', result.type);
    console.log('Body length:', result.body.length);

    if (result.body.length > 0) {
      const first = result.body[0];
      console.log('First statement type:', first.type);
      console.log('Expected: PSRFragment');
      console.log('Actual: ' + first.type);
      console.log('Match:', first.type === 'PSRFragment');

      if (first.expression) {
        console.log('Expression type:', first.expression.type);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testJSXFragment();
