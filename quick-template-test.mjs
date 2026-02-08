import fs from 'fs/promises';
import { createAnalyzer, createEmitter, createParser } from './dist/index.js';

async function quickTestTemplate() {
  try {
    console.log('🔍 Testing template literal transformation...\n');

    const source = await fs.readFile(
      'e:/Sources/visual-schema-builder/packages/pulsar-ui.dev/src/components/atoms/avatar/avatar.psr',
      'utf-8'
    );

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const result = emitter.emit(ir);

    console.log('📍 Looking for template literal in result...\n');

    // Find lines with template literals or their transformations
    const lines = result.split('\n');
    const templateLines = lines.filter(
      (line) =>
        line.includes('parts[0][0]') ||
        line.includes('parts[parts.length - 1][0]') ||
        line.includes('${') ||
        line.includes('undefined')
    );

    if (templateLines.length > 0) {
      console.log('🎯 Template literal related lines:');
      templateLines.forEach((line, i) => {
        console.log(`${i + 1}: ${line.trim()}`);
      });
    } else {
      console.log('❌ No template literal transformations found');
    }

    console.log('\n✅ Test completed');
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Position:', err.position, 'Line:', err.line, 'Column:', err.column);
  }
}

quickTestTemplate();
