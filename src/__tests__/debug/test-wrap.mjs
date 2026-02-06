import ts from 'typescript';
import pulsarTransformer from './packages/pulsar-transformer/dist/index.js';

const code = `
import { useState } from '@pulsar-framework/pulsar.dev';

export const UserCard = (props): HTMLElement => {
  return (
    <div>
      <h2>{props.user.name}</h2>
    </div>
  );
};
`;

const transformer = pulsarTransformer();
const sourceFile = ts.createSourceFile(
  'test.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);
const result = ts.transform(sourceFile, [transformer]);
const printer = ts.createPrinter();
const outputCode = printer.printFile(result.transformed[0]);

console.log('=== TRANSFORMED OUTPUT ===');
console.log(outputCode);
