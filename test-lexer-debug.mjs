import { createParser } from './src/parser/create-parser.js';

const parser = createParser();
console.log('Parser created');
console.log('_lexer type:', typeof parser._lexer);
console.log('_lexer:', parser._lexer);
console.log('enterTypeContext:', typeof parser._lexer?.enterTypeContext);

try {
  parser.parse('function test(x: number) {}');
  console.log('Parse succeeded');
} catch (error) {
  console.log('Parse failed:', error.message);
}
