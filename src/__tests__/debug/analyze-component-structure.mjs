/**
 * Analyze component structure specifically
 */

import { readFileSync } from 'fs';

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('Analyzing component structure...\n');

const lines = source.split('\n');

//  Find component declaration line
const componentLine = lines.findIndex((line) => line.includes('component DebugTestSuitePSR'));
console.log(`Component declared at line: ${componentLine + 1}`);
console.log(`Line content: ${lines[componentLine]}`);

// Count braces after component declaration
let braceCount = 0;
let componentEndLine = -1;

for (let i = componentLine; i < lines.length; i++) {
  const line = lines[i];

  for (const char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;

    if (i > componentLine && braceCount === 0) {
      componentEndLine = i;
      break;
    }
  }

  if (componentEndLine !== -1) break;
}

console.log(`\nComponent body:`);
console.log(`  Starts at line: ${componentLine + 1}`);
console.log(`  Ends at line: ${componentEndLine + 1}`);
console.log(`  Total lines: ${componentEndLine - componentLine + 1}`);

if (componentEndLine === -1) {
  console.log('\n❌ ERROR: Component body never closes! Missing closing brace.');
} else {
  console.log('\n✅ Component body is closed properly');
}

// Show last few lines of component
console.log(`\nLast 5 lines of component:`);
const endLines = lines.slice(Math.max(componentLine, componentEndLine - 4), componentEndLine + 1);
endLines.forEach((line, idx) => {
  const lineNum = componentEndLine - 4 + idx + 1;
  console.log(`  ${String(lineNum).padStart(4, ' ')} | ${line}`);
});
