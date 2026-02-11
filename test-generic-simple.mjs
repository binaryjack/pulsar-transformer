/**
 * Simple generic test
 */

import { createLexer, createParser, createPipeline } from './dist/index.js';

console.log('Testing generic type parsing...');

try {
  const pipeline = createPipeline({ debug: true });
  const code = 'function identity<T>(value: T): T { return value; }';

  console.log(`\nInput: ${code}`);

  // First, let's see the AST
  const lexer = createLexer(code);
  const tokens = lexer.scanTokens();
  const parser = createParser(tokens);
  const ast = parser.parse();

  console.log('\n=== AST (first statement params) ===');
  if (ast.body[0] && ast.body[0].params) {
    console.log(JSON.stringify(ast.body[0].params, null, 2));
  }

  const result = await pipeline.transform(code);

  console.log(`\nOutput: ${result.code}`);
  console.log(`\nDiagnostics: ${JSON.stringify(result.diagnostics, null, 2)}`);
} catch (error) {
  console.error(`\nError: ${error.message}`);
  console.error(error.stack);
}
