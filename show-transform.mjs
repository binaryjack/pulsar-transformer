import { writeFileSync } from 'fs';
import { createPipeline } from './src/pipeline/index.js';

const sources = [
  { name: 'number', code: `component T1() { const [x] = signal(5); return <div/>; }` },
  {
    name: 'object',
    code: `component T2() { const [x] = signal({ name: 'Alice' }); return <div/>; }`,
  },
  { name: 'array', code: `component T3() { const [x] = signal([1, 2, 3]); return <div/>; }` },
];

const pipeline = createPipeline({ debug: false });

let output = '';

for (const { name, code } of sources) {
  output += `\n=== ${name} ===\n`;
  output += `Source: ${code}\n\n`;
  try {
    const result = pipeline.transform(code);
    output += `Transformed:\n${result.code || 'undefined'}\n`;
    if (result.diagnostics && result.diagnostics.length > 0) {
      output += `\nDiagnostics:\n${JSON.stringify(result.diagnostics, null, 2)}\n`;
    }
  } catch (error) {
    output += `ERROR: ${error.message}\n${error.stack}\n`;
  }
}

writeFileSync('E:/transform-output.txt', output);
console.log('✅ Output written to E:/transform-output.txt');
