/**
 * Test generic type parsing with AST output
 */

import { createPipeline } from './dist/index.js';

console.log('Testing generic type parsing...');

try {
  const pipeline = createPipeline({ debug: false });
  const code = 'function identity<T>(value: T): T { return value; }';

  console.log(`\nInput: ${code}`);

  // Get AST to inspect
  const lexer = (await import('./dist/index.js')).createLexer(code);
  const tokens = lexer.scanTokens();
  const parser = (await import('./dist/index.js')).createParser(tokens);
  const ast = parser.parse();

  console.log('\nAST (formatted):');
  console.log(JSON.stringify(ast.body[0], null, 2).substring(0, 1500));

  const result = await pipeline.transform(code);

  console.log(`\nOutput: ${result.code}`);
} catch (error) {
  console.error(`\nError: ${error.message}`);
}
