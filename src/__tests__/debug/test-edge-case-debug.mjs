/**
 * Test edge-case-1-array-map.psr with debug logging
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

console.log('Loading edge-case-1-array-map.psr...');
const source = readFileSync(
  './packages/pulsar-ui.dev/src/debug-tests/edge-case-1-array-map.psr',
  'utf-8'
);

console.log(`Source: ${source.length} chars`);
console.log('Creating pipeline...');

const pipeline = createPipeline({ debug: false });

console.log('Starting transformation...');
console.log('Phase 1: Lexing...');

// Manually run each phase to identify the blocker
const lexer = pipeline.lexer;
const parser = pipeline.parser;
const analyzer = pipeline.analyzer;
const transformer = pipeline.transformer;
const emitter = pipeline.emitter;

const tokens = lexer.tokenize(source);
console.log(`✅ Lexing complete: ${tokens.length} tokens`);

console.log('Phase 2: Parsing...');
const ast = parser.parse(tokens);
console.log(`✅ Parsing complete: ${ast.children?.length || 0} top-level nodes`);

console.log('Phase 3: Analyzing...');
const ir = analyzer.analyze(ast);
console.log(`✅ Analysis complete: IR type = ${ir.type}`);

console.log('Phase 4: Transforming...');
const optimizedIR = transformer.transform(ir);
console.log(`✅ Transform complete: IR type = ${optimizedIR.type}`);

console.log('Phase 5: Emitting...');
console.log('Watch for [EMITTER DEBUG] log messages every 1000 iterations\n');

try {
  const code = emitter.emit(optimizedIR);

  console.log('\n✅ SUCCESS!');
  console.log(`Generated code: ${code.length} chars`);
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\nStack:', error.stack);
}
