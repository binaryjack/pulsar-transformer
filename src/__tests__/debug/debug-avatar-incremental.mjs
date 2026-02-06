/**
 * Narrow down avatar.psr issue by testing specific patterns
 */

import { readFileSync } from 'fs';
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const pipeline = createPipeline({ debug: false });

// Start minimal and build up
const tests = [
  { name: 'Only imports and getInitials', lines: [1, 19] },
  { name: 'Add component declaration start', lines: [1, 35] },
  { name: 'Add sizeClasses object', lines: [1, 41] },
  { name: 'Add all class objects', lines: [1, 60] },
  { name: 'Add cn() call', lines: [1, 68] },
  { name: 'Add initials line', lines: [1, 70] },
  { name: 'Add return start', lines: [1, 72] },
  { name: 'Add full JSX', lines: [1, 88] },
];

const avatarPath = './packages/pulsar-ui.dev/src/components/atoms/avatar/avatar.psr';
const fullSource = readFileSync(avatarPath, 'utf-8');
const allLines = fullSource.split('\n');

tests.forEach((test) => {
  const source = allLines.slice(test.lines[0] - 1, test.lines[1]).join('\n');

  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${test.name} (lines ${test.lines[0]}-${test.lines[1]})`);
  console.log('='.repeat(70));

  try {
    const result = pipeline.transform(source);

    if (!result.code || result.code.trim().length === 0) {
      console.log('❌ FAILED - No code generated');
      if (result.diagnostics && result.diagnostics.length > 0) {
        console.log(`Error: ${result.diagnostics[0].message}`);
      }
    } else {
      console.log('✅ SUCCESS');
      console.log(`Generated ${result.code.split('\n').length} lines`);
    }
  } catch (error) {
    console.log('❌ EXCEPTION');
    console.log(`Error: ${error.message}`);
  }
});
