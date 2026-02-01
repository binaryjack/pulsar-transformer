import { createTestContext } from './dist/__tests__/test-helpers.js';
import { createSignalDetector } from './dist/detector/signal-detector.js';

const source = `import { createSignal } from '@pulsar/core';`;
const context = createTestContext(source);

console.log('signalImports:', context.signalImports);
console.log('signalImports size:', context.signalImports.size);

for (const [key, value] of context.signalImports) {
  console.log(`  ${key}:`, value);
}

const detector = createSignalDetector(context);
console.log('\nIs createSignal imported?', detector.isSignalImported('createSignal'));
console.log('Is createMemo imported?', detector.isSignalImported('createMemo'));
