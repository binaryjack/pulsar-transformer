import { createAnalyzer } from './dist/analyzer/create-analyzer.js';
import { createEmitter } from './dist/emitter/create-emitter.js';
import { createParser } from './dist/parser/create-parser.js';
import { transformReactivity } from './dist/transformer/reactivity-transformer.js';

const source = `
component Test() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  effect(() => console.log(count()));
  return <div></div>;
}
`;

console.log('=== PARSING ===');
const parser = createParser();
const ast = parser.parse(source);

console.log('=== ANALYZING ===');
const analyzer = createAnalyzer();
const ir = analyzer.analyze(ast);

console.log('IR type:', ir.type);
console.log('IR structure:', JSON.stringify(ir, null, 2));
console.log('IR body length:', ir.body?.length);
if (ir.body && ir.body.length > 0) {
  const component = ir.body[0];
  console.log('Component type:', component.type);
  console.log('Component body length:', component.body?.length);

  if (component.body) {
    component.body.forEach((stmt, i) => {
      console.log(`Statement ${i}: ${stmt.type}`);
      if (stmt.type === 'VariableDeclarationIR' && stmt.initializer) {
        console.log(`  - Initializer: ${stmt.initializer.type}`);
        if (stmt.initializer.type === 'CallExpressionIR') {
          console.log(`  - Callee name: ${stmt.initializer.callee.name}`);
        }
      } else if (stmt.type === 'CallExpressionIR') {
        console.log(`  - Callee name: ${stmt.callee.name}`);
      }
    });
  }
}

console.log('\n=== TRANSFORMING ===');
const transformedIR = transformReactivity(ir);

console.log('After transformation:');
if (transformedIR.body && transformedIR.body.length > 0) {
  const component = transformedIR.body[0];
  if (component.body) {
    component.body.forEach((stmt, i) => {
      console.log(`Statement ${i}: ${stmt.type}`);
      if (stmt.type === 'VariableDeclarationIR' && stmt.initializer) {
        console.log(`  - Initializer: ${stmt.initializer.type}`);
        if (stmt.initializer.type === 'CallExpressionIR') {
          console.log(`  - Callee name: ${stmt.initializer.callee.name}`);
        }
      } else if (stmt.type === 'CallExpressionIR') {
        console.log(`  - Callee name: ${stmt.callee.name}`);
      }
    });
  }
}

console.log('\n=== EMITTING ===');
const emitter = createEmitter();
const code = emitter.emit(transformedIR);

console.log('Generated code:');
console.log(code);

console.log('\n=== VERIFICATION ===');
console.log('Contains createSignal:', code.includes('createSignal'));
console.log('Contains signal(:', code.includes('signal('));
console.log('Contains createMemo:', code.includes('createMemo'));
console.log('Contains computed(:', code.includes('computed('));
console.log('Contains createEffect:', code.includes('createEffect'));
console.log('Contains effect(:', code.includes('effect('));
