import fs from 'fs';

const content = fs.readFileSync('packages/pulsar-ui.dev/src/debug-tests/index.psr', 'utf8');
const lines = content.split('\n');

console.log('Total file length:', content.length);
console.log('Total lines:', lines.length);

// Find which line contains position 7661
let pos = 0;
for (let i = 0; i < lines.length; i++) {
  const lineStart = pos;
  const lineEnd = pos + lines[i].length + 1; // +1 for newline

  if (lineStart <= 7661 && 7661 < lineEnd) {
    console.log(`\nPosition 7661 is on line ${i + 1}, column ${7661 - lineStart + 1}`);
    console.log('Line content:', JSON.stringify(lines[i]));
    console.log(
      '\n50 chars before pos:',
      JSON.stringify(lines[i].substring(Math.max(0, 7661 - lineStart - 50), 7661 - lineStart))
    );
    console.log(
      'At position:',
      JSON.stringify(lines[i].substring(7661 - lineStart, 7661 - lineStart + 30))
    );
    break;
  }

  pos = lineEnd;
}

// Find special characters
console.log('\n\n=== Looking for special characters ===');
const arrowChar = '\u2190'; // ←
const arrowPos = content.indexOf(arrowChar);
console.log('Arrow ← found at position:', arrowPos);
if (arrowPos >= 0) {
  console.log(
    'Context around arrow:',
    JSON.stringify(content.substring(arrowPos - 30, arrowPos + 50))
  );
  console.log('Arrow char code:', content.charCodeAt(arrowPos));
}

// Check what's around position 7661 exactly
console.log('\n\n=== Content around position 7661 ===');
console.log('Characters 7650-7680:', JSON.stringify(content.substring(7650, 7680)));
console.log(
  'Characters 7660-7670:',
  content
    .substring(7660, 7670)
    .split('')
    .map((c, i) => `[${7660 + i}]: ${JSON.stringify(c)} (code: ${c.charCodeAt(0)})`)
    .join('\n')
);
