import fs from 'fs/promises';
import { createAnalyzer, createEmitter, createParser } from './dist/index.js';

async function debugAvatarTransformation() {
  try {
    const source = await fs.readFile(
      'e:/Sources/visual-schema-builder/packages/pulsar-ui.dev/src/components/atoms/avatar/avatar.psr',
      'utf-8'
    );

    console.log('=== ORIGINAL SOURCE ===');
    console.log(source.substring(200, 500));

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const result = emitter.emit(ir);

    console.log('\n=== TRANSFORMED OUTPUT ===');
    console.log(result.substring(0, 800));

    // Look for potential syntax issues
    const problemLines = result
      .split('\n')
      .filter((line) => line.includes(':') && (line.includes('=>') || line.includes('function')));

    if (problemLines.length > 0) {
      console.log('\n=== POTENTIAL PROBLEM LINES ===');
      problemLines.forEach((line, i) => {
        console.log(`${i + 1}:`, line.trim());
      });
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
  }
}

debugAvatarTransformation();
