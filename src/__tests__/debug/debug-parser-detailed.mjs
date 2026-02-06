/**
 * Detailed parser debug - find exact failure point
 */

import { readFileSync } from 'fs';
import { createLexer, createParser } from './packages/pulsar-transformer/dist/index.js';

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('🔍 Detailed Parser Debug\n');

// Step 1: Tokenize
console.log('Step 1: Tokenizing...');
const lexer = createLexer();
const tokens = lexer.tokenize(source);
console.log(`  ✅ Generated ${tokens.length} tokens\n`);

// Step 2: Parse
console.log('Step 2: Parsing...');
const parser = createParser();

try {
  const ast = parser.parse(source);
  console.log('  ✅ Parsing succeeded!');
  console.log(`  AST node count: ${ast.body?.length || 0}`);
} catch (error) {
  console.log('  ❌ Parsing failed!');
  console.log(`  Error: ${error.message}\n`);

  // Get parser errors
  const errors = parser.getErrors();
  console.log(`Parser errors: ${errors.length}`);

  errors.forEach((err, idx) => {
    console.log(`\nError ${idx + 1}:`);
    console.log(`  Message: ${err.message}`);
    if (err.location) {
      console.log(`  Location: line ${err.location.line}, column ${err.location.column}`);

      // Show the problematic line
      const lines = source.split('\n');
      const problemLine = lines[err.location.line - 1];
      const linesBefore = lines.slice(Math.max(0, err.location.line - 3), err.location.line - 1);
      const linesAfter = lines.slice(err.location.line, err.location.line + 3);

      console.log(`\n  Context:`);
      console.log('  ' + '-'.repeat(80));

      linesBefore.forEach((line, i) => {
        const lineNum = err.location.line - linesBefore.length + i;
        console.log(`  ${String(lineNum).padStart(4, ' ')} | ${line}`);
      });

      console.log(`  ${String(err.location.line).padStart(4, ' ')} | ${problemLine}`);
      console.log(
        `  ${' '.repeat(5)} | ${' '.repeat(err.location.column - 1)}${'~'.repeat(Math.min(10, problemLine.length - err.location.column + 1))}`
      );

      linesAfter.forEach((line, i) => {
        const lineNum = err.location.line + i + 1;
        console.log(`  ${String(lineNum).padStart(4, ' ')} | ${line}`);
      });

      console.log('  ' + '-'.repeat(80));
    }
  });
}
