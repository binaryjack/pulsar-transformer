import { IRNodeType } from './dist/analyzer/ir/ir-node-types.js';

// Create a simple test IR structure
const testIR = {
  type: IRNodeType.COMPONENT_IR,
  name: 'Test',
  body: [
    {
      type: IRNodeType.VARIABLE_DECLARATION_IR,
      kind: 'const',
      id: { type: IRNodeType.IDENTIFIER_IR, name: 'doubled' },
      initializer: {
        type: IRNodeType.CALL_EXPRESSION_IR,
        callee: {
          type: IRNodeType.IDENTIFIER_IR,
          name: 'computed',
        },
        arguments: [],
      },
    },
    {
      type: IRNodeType.CALL_EXPRESSION_IR,
      callee: {
        type: IRNodeType.IDENTIFIER_IR,
        name: 'effect',
      },
      arguments: [],
    },
  ],
};

console.log('=== BEFORE TRANSFORMATION ===');
console.log(JSON.stringify(testIR, null, 2));

// Import and apply transformation
const { transformReactivity } = await import('./dist/transformer/reactivity-transformer.js');
const transformed = transformReactivity(testIR);

console.log('\n=== AFTER TRANSFORMATION ===');
console.log(JSON.stringify(transformed, null, 2));

console.log('\n=== CHECKING ===');
const varDecl = transformed.body[0];
console.log('Variable declaration initializer callee name:', varDecl.initializer.callee.name);
console.log('Expected: createMemo, Got:', varDecl.initializer.callee.name);

const bareCall = transformed.body[1];
console.log('Bare call callee name:', bareCall.callee.name);
console.log('Expected: createEffect, Got:', bareCall.callee.name);
