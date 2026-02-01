import ts from 'typescript';
import transformer from './dist/index.js';

const code = `
export const TestSimpleInteractive = (): HTMLElement => {
  const [count, setCount] = useState(0);
  return <div>Count: {count()}</div>;
};
`;

const sourceFile = ts.createSourceFile(
  'test.tsx',
  code,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TSX
);

const transformerFactory = transformer();
const result = ts.transform(sourceFile, [transformerFactory]);
const printer = ts.createPrinter();
const output = printer.printFile(result.transformed[0]);

console.log('=== TRANSFORMED CODE ===');
console.log(output);

result.dispose();
