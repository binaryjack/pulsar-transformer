// Test JSX Fragment Specifically
import { createParser } from './src/parser/create-parser.js';

const parser = createParser();
const result = parser.parse('<></>');

console.log('=== JSX Fragment Test ===');
console.log('Result body:', result.body);
console.log('First statement:', result.body[0]);
console.log('Statement type:', result.body[0]?.type);
console.log('Debug marker:', result.body[0]?._DEBUG_FROM_STATEMENT);

if (result.body[0]?.type === 'ExpressionStatement') {
  console.log('Expression:', result.body[0]?.expression);
  console.log('Expression type:', result.body[0]?.expression?.type);
  console.log('Expression debug marker:', result.body[0]?.expression?._DEBUG_FROM_STATEMENT);
}
