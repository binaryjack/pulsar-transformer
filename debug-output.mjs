import ts from 'typescript';
import transformer from './dist/index.js';

console.log('=== TEST 1: Simple JSX ===\n');
const source1 = `function App() { return <div>Hello World</div>; }`;
const result1 = ts.transpileModule(source1, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    jsxFactory: '__jsx',
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.ESNext,
  },
  transformers: { before: [transformer()] },
});
console.log(result1.outputText);
console.log('Contains $REGISTRY.execute?', result1.outputText.includes('$REGISTRY.execute'));
console.log('Contains createElement?', result1.outputText.includes('createElement'));
console.log('Contains textContent?', result1.outputText.includes('textContent'));

console.log('\n\n=== TEST 2: Signal Interpolation ===\n');
const source2 = `import { createSignal } from "@pulsar/core";
function Counter() {
  const [count, setCount] = createSignal(0);
  return <div>{count()}</div>;
}`;
const result2 = ts.transpileModule(source2, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    jsxFactory: '__jsx',
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.ESNext,
  },
  transformers: { before: [transformer()] },
});
console.log(result2.outputText);
console.log('Contains $REGISTRY.execute?', result2.outputText.includes('$REGISTRY.execute'));
console.log('Contains $REGISTRY.wire?', result2.outputText.includes('$REGISTRY.wire'));
console.log('Contains () => count()?', result2.outputText.includes('() => count()'));

console.log('\n\n=== TEST 3: Event Handlers ===\n');
const source3 = `function Button() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Click</button>;
}`;
const result3 = ts.transpileModule(source3, {
  compilerOptions: {
    jsx: ts.JsxEmit.React,
    jsxFactory: '__jsx',
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.ESNext,
  },
  transformers: { before: [transformer()] },
});
console.log(result3.outputText);
console.log('Contains addEventListener?', result3.outputText.includes('addEventListener'));
console.log('Contains click?', result3.outputText.includes('click'));
console.log('Contains handleClick?', result3.outputText.includes('handleClick'));
