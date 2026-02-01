import { readFileSync } from 'fs';
import ts from 'typescript';
import transformer from './dist/index.js';

const sourceCode = readFileSync(
  'E:/Sources/visual-schema-builder/packages/pulsar-ui.dev/src/test-simple-interactive.tsx',
  'utf-8'
);

const sourceFile = ts.createSourceFile(
  'test-simple-interactive.tsx',
  sourceCode,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TSX
);

const transformerFactory = transformer();
const result = ts.transform(sourceFile, [transformerFactory]);
const transformedFile = result.transformed[0];

const printer = ts.createPrinter();
const output = printer.printFile(transformedFile);

console.log('=== TRANSFORMED OUTPUT ===');
console.log(output);

result.dispose();
