// Script to remove all debug console.log statements
const fs = require('fs');
const path = require('path');

const files = [
  'src/parser/prototype/parse.ts',
  'src/parser/prototype/parse-flow-control.ts',
  'src/parser/prototype/parse-expression.ts',
];

const debugPatterns = [
  /console\.log\(\s*\[.*?DEBUG.*?\].*?\);?\s*\n/gs,
  /console\.log\(\s*'?\[.*?DEBUG.*?\]'?.*?\);?\s*\n/gs,
  /console\.log\(\s*`\[.*?DEBUG.*?\]`.*?\);?\s*\n/gs,
];

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalLines = content.split('\n').length;

  // Remove debug logs
  debugPatterns.forEach((pattern) => {
    content = content.replace(pattern, '');
  });

  // Clean up double blank lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  fs.writeFileSync(filePath, content, 'utf-8');

  const newLines = content.split('\n').length;
  console.log(`  Removed ${originalLines - newLines} lines`);
});

console.log('\n✅ Debug logging removed from all files');
