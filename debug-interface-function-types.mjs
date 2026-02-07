/**
 * Debug script to analyze interface with function types parsing
 */

import { createParser } from './src/parser/create-parser.js';

const source = `interface IEventHandler {
  onClick: (event: MouseEvent) => void;
  onSubmit: (data: FormData) => Promise<void>;
}`;

console.log('Source:');
console.log(source);
console.log('\n---\n');

try {
  const parser = createParser();
  const ast = parser.parse(source);

  console.log('Success! AST:');
  console.log(JSON.stringify(ast, null, 2));
} catch (error) {
  console.error('Parse Error:', error.message);
  console.error('\nFull error:', error);
}
