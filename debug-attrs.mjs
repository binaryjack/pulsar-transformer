import ts from 'typescript';
import transformer from './dist/index.js';

console.log('=== TEST: Attributes ===\n');
const source = `function Input() { return <input type="text" placeholder="Enter text" disabled />; }`;
const result = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    jsxFactory: '__jsx',
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.ESNext,
  },
  transformers: { before: [transformer()] },
});
console.log(result.outputText);
console.log('\nExpecting:');
console.log('- setAttribute("type", "text")');
console.log('- setAttribute("placeholder", "Enter text")');
console.log('- disabled = true');
