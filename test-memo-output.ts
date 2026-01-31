import * as ts from 'typescript';
import transformer from './dist/index.js';

const code = `
export const Sidebar = ({ width, open }: { width: number; open: boolean }) => {
  return (
    <aside style={{ width: width + 'px' }}>
      <div>Item 1</div>
      <div>Item 2</div>
    </aside>
  );
};
`;

const sourceFile = ts.createSourceFile(
  'test.tsx',
  code,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TSX
);

const compilerHost = ts.createCompilerHost({});
const program = ts.createProgram(['test.tsx'], { jsx: ts.JsxEmit.Preserve }, compilerHost);

const transformerFactory = transformer(program);
const result = ts.transform(sourceFile, [transformerFactory]);
const printer = ts.createPrinter();
const output = printer.printFile(result.transformed[0] as ts.SourceFile);

console.log('=== TRANSFORMED CODE ===');
console.log(output);

result.dispose();
