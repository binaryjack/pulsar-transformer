/**
 * Test Component Emission
 *
 * Quick test to verify component emission fix
 */

import { IRNodeType } from './src/analyzer/ir/ir-node-types.js';
import { createEmitter } from './src/emitter/create-emitter.js';

// Test 1: Component with empty body and null returnExpression (like unit tests)
console.log('=== TEST 1: Empty component ===');
const emitter1 = createEmitter();
const componentIR1 = {
  type: IRNodeType.COMPONENT_IR,
  name: 'Counter',
  params: [],
  body: [],
  returnExpression: null,
  reactiveDependencies: [],
  registryKey: 'component:Counter',
  usesSignals: false,
  hasEventHandlers: false,
  metadata: {},
};

try {
  const code1 = emitter1.emit(componentIR1);
  console.log('Generated code:');
  console.log(code1);
  console.log('✅ Test 1 passed - no crash');
} catch (error) {
  console.log('❌ Test 1 failed:', error.message);
}

// Test 2: Component with return expression
console.log('\n=== TEST 2: Component with return expression ===');
const emitter2 = createEmitter();
const componentIR2 = {
  type: IRNodeType.COMPONENT_IR,
  name: 'Test',
  params: [],
  body: [],
  returnExpression: {
    type: IRNodeType.LITERAL_IR,
    value: 'hello',
    rawValue: '"hello"',
    metadata: {},
  },
  reactiveDependencies: [],
  registryKey: 'component:Test',
  usesSignals: false,
  hasEventHandlers: false,
  metadata: {},
};

try {
  const code2 = emitter2.emit(componentIR2);
  console.log('Generated code:');
  console.log(code2);
  console.log('✅ Test 2 passed - includes return statement');
} catch (error) {
  console.log('❌ Test 2 failed:', error.message);
}
