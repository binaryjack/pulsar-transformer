import ts from 'typescript';
import transformer from './dist/index.js';

// Use the ACTUAL test file
const sourceCode = `import { useState } from '@pulsar-framework/pulsar.dev';

export const TestSimpleInteractive = (): HTMLElement => {
  const [count, setCount] = useState(0);
  return <div>Count: {count()}</div>;
};`;

const sourceFile = ts.createSourceFile(
  'test-simple-interactive.tsx',
  sourceCode,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TSX
);

const transformerFactory = transformer();
const result = ts.transform(sourceFile, [transformerFactory]);
const printer = ts.createPrinter();
const output = printer.printFile(result.transformed[0]);

console.log('=== INPUT ===');
console.log(sourceCode);
console.log('\n=== OUTPUT ===');
console.log(output);

result.dispose();
