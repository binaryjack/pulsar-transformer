/**
 * Test Union Types Fix
 *
 * Quick test to verify union types preservation
 */

import { createAnalyzer } from './src/analyzer/create-analyzer.js';
import { createEmitter } from './src/emitter/create-emitter.js';
import { createParser } from './src/parser/create-parser.js';

console.log('=== TESTING UNION TYPES FIX ===');

const source = 'const value: string | number = 42;';
console.log('Source:', source);

try {
  const parser = createParser();
  const ast = parser.parse(source);
  console.log('✅ Parser worked');

  const analyzer = createAnalyzer();
  const ir = analyzer.analyze(ast);
  console.log('✅ Analyzer worked');

  const emitter = createEmitter();
  const output = emitter.emit(ir);
  console.log('✅ Emitter worked');

  console.log('Generated output:', output);

  if (output.includes('string | number')) {
    console.log('✅ SUCCESS: Union type preserved!');
  } else {
    console.log('❌ FAIL: Union type not preserved');
  }
} catch (error) {
  console.log('❌ ERROR:', error.message);
}
