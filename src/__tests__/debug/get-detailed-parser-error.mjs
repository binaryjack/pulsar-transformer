/**
 * Get detailed parser error with location
 */

import { readFileSync } from 'fs';
import { createParser } from './packages/pulsar-transformer/dist/index.js';

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');
const lines = source.split('\n');

console.log('Parsing index.psr with detailed error reporting...\n');

const parser = createParser();

try {
  parser.parse(source);
  console.log('✅ Parsing succeeded!');
} catch (error) {
  console.log('❌ Parsing failed!');
  console.log(`Error: ${error.message}\n`);

  if (parser.hasErrors()) {
    const errors = parser.getErrors();

    errors.forEach((err, idx) => {
      console.log(`\nError ${idx + 1}:`);
      console.log(`  Message: ${err.message}`);

      if (err.location) {
        // Location might be absolute character position
        // Try to convert to line/column
        let errorLine = err.location.line - 1;
        let errorCol = err.location.column - 1;

        // If column seems too large, it might be absolute position
        if (errorCol > 1000) {
          // Calculate line from absolute position
          let absolutePos = errorCol;
          let currentPos = 0;

          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (currentPos + lineLength > absolutePos) {
              errorLine = i;
              errorCol = absolutePos - currentPos;
              break;
            }
            currentPos += lineLength;
          }
        }

        console.log(`  Line: ${errorLine + 1}, Column: ${errorCol + 1}`);

        // Show context
        const contextBefore = lines.slice(Math.max(0, errorLine - 2), errorLine);
        const problemLine = lines[errorLine];
        const contextAfter = lines.slice(errorLine + 1, errorLine + 3);

        console.log(`\n  Context:`);
        console.log('  ' + '─'.repeat(80));

        contextBefore.forEach((line, i) => {
          const lineNum = errorLine - contextBefore.length + i + 1;
          console.log(`  ${String(lineNum).padStart(4, ' ')} | ${line}`);
        });

        console.log(`  ${String(errorLine + 1).padStart(4, ' ')} | ${problemLine}`);
        console.log(`  ${' '.repeat(5)} | ${' '.repeat(Math.max(0, errorCol))}^^^`);

        contextAfter.forEach((line, i) => {
          const lineNum = errorLine + i + 2;
          console.log(`  ${String(lineNum).padStart(4, ' ')} | ${line}`);
        });

        console.log('  ' + '─'.repeat(80));
      }
    });
  }
}
