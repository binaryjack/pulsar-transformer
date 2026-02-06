/**
 * Check JSX tag matching in index.psr
 */

import { readFileSync } from 'fs'

const source = readFileSync('./packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf-8');

console.log('Checking JSX tag matching...\n');

const tagStack = [];
const lines = source.split('\n');
const tagPattern = /<\/?([A-Za-z][A-Za-z0-9]*)/g;

let lineNum = 0;
for (const line of lines) {
  lineNum++;
  let match;
  tagPattern.lastIndex = 0;
  
  while ((match = tagPattern.exec(line)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];
    
    if (fullMatch.startsWith('</')) {
      // Closing tag
      if (tagStack.length === 0) {
        console.log(`❌ Line ${lineNum}: Unexpected closing tag </${tagName}>`);
      } else {
        const expected = tagStack.pop();
        if (expected !== tagName) {
          console.log(`❌ Line ${lineNum}: Mismatched tags - expected </${expected}>, found </${tagName}>`);
        }
      }
    } else {
      // Opening tag - check if self-closing  
      const restOfLine = line.substring(match.index);
      if (!restOfLine.includes('/>')) {
        tagStack.push(tagName);
      }
    }
  }
}

console.log(`\n📊 Result:`);
if (tagStack.length > 0) {
  console.log(`❌ Unclosed tags: ${tagStack.length}`);
  console.log(`  Missing closing tags for:`);
  tagStack.reverse().forEach(tag => {
    console.log(`    </${tag}>`);
  });
} else {
  console.log(`✅ All tags properly closed`);
}
