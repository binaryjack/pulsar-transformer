/**
 * Analyze index.psr structure for mismatched brackets/braces
 */

import { readFileSync } from 'fs';

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('Analyzing index.psr structure...\n');

const lines = source.split('\n');

// Count various bracket types
let braceStack = [];
let bracketStack = [];
let parenStack = [];
let jsxStack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const context = line.substring(Math.max(0, j - 20), j + 20);

    switch (char) {
      case '{':
        braceStack.push({ line: lineNum, col: j, context });
        break;
      case '}':
        if (braceStack.length === 0) {
          console.log(`❌ Unmatched closing ] at line ${lineNum}, col ${j}`);
          console.log(`   Context: ${context}`);
        } else {
          braceStack.pop();
        }
        break;
      case '(':
        parenStack.push({ line: lineNum, col: j, context });
        break;
      case ')':
        if (parenStack.length === 0) {
          console.log(`❌ Unmatched closing ) at line ${lineNum}, col ${j}`);
          console.log(`   Context: ${context}`);
        } else {
          parenStack.pop();
        }
        break;
      case '[':
        bracketStack.push({ line: lineNum, col: j, context });
        break;
      case ']':
        if (bracketStack.length === 0) {
          console.log(`❌ Unmatched closing ] at line ${lineNum}, col ${j}`);
          console.log(`   Context: ${context}`);
        } else {
          bracketStack.pop();
        }
        break;
      case '<':
        // Check if this looks like JSX
        if (j + 1 < line.length && /[A-Za-z]/.test(line[j + 1])) {
          jsxStack.push({ line: lineNum, col: j, tag: line.substring(j, j + 20) });
        }
        break;
    }
  }
}

console.log('\n📊 Balance Report:');
console.log(`  Unclosed braces ({): ${braceStack.length}`);
console.log(`  Unclosed parens ((): ${parenStack.length}`);
console.log(`  Unclosed brackets ([): ${bracketStack.length}`);

if (braceStack.length > 0) {
  console.log(`\n❌ Unclosed braces:`);
  braceStack.slice(0, 5).forEach((item) => {
    console.log(`   Line ${item.line}, col ${item.col}`);
    console.log(`   Context: ...${item.context}...`);
  });
}

if (parenStack.length > 0) {
  console.log(`\n❌ Unclosed parens:`);
  parenStack.slice(0, 5).forEach((item) => {
    console.log(`   Line ${item.line}, col ${item.col}`);
    console.log(`   Context: ...${item.context}...`);
  });
}

if (bracketStack.length > 0) {
  console.log(`\n❌ Unclosed brackets:`);
  bracketStack.slice(0, 5).forEach((item) => {
    console.log(`   Line ${item.line}, col ${item.col}`);
    console.log(`   Context: ...${item.context}...`);
  });
}

if (braceStack.length === 0 && parenStack.length === 0 && bracketStack.length === 0) {
  console.log('\n✅ All brackets/braces/parens are balanced!');
}
