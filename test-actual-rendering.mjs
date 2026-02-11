#!/usr/bin/env node
/**
 * ACTUAL RENDERING TEST - Transform + Execute + Render
 * From simplest to most complex - ALL MUST PASS
 */

import { JSDOM } from 'jsdom';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPipeline } from './dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║           ACTUAL RENDERING TEST - PSR → DOM                          ║');
console.log('║     Simplest to Most Complex - ALL MUST PASS OR JAIL TIME           ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const failures = [];

// Setup jsdom
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;

async function testRender(name, psrCode, validator) {
  console.log(`\n🧪 ${name}`);

  try {
    // Step 1: Transform PSR to JS
    const pipeline = createPipeline({ debug: false });
    const result = await pipeline.transform(psrCode);

    if (result.diagnostics.some((d) => d.type === 'error')) {
      throw new Error(`Transform error: ${result.diagnostics[0].message}`);
    }

    console.log('   ✓ Transformed successfully');

    // Step 2: Import runtime
    const runtime = await import('@pulsar-framework/pulsar.dev');
    const { $REGISTRY, t_element, createSignal, createEffect, batch, untrack, defer } = runtime;

    // Step 3: Prepare transformed code
    let componentCode = result.code;

    // Remove import statements - we'll provide everything in context
    componentCode = componentCode.replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*/g, '');

    // Remove TypeScript type annotations
    // Remove return type annotations: function Name(): Type { => function Name() {
    componentCode = componentCode.replace(/\)\s*:\s*\w+\s*{/g, ') {');
    // Remove parameter type annotations: (param: Type) => (param)
    componentCode = componentCode.replace(/(\w+)\s*:\s*\w+(\[?\]?)/g, '$1');

    // Debug: Print first test's transformed code
    if (
      name === 'Test 1: Static div' ||
      name === 'Test 2: Static div with class' ||
      name === 'Test 6: Multiple signals'
    ) {
      console.log('   📝 Transformed code preview:');
      console.log(componentCode.substring(0, 500));
      console.log('   ...\n');
    }

    // Extract the component function name
    const funcMatch = componentCode.match(/function\s+(\w+)\s*\(/);
    if (!funcMatch) {
      throw new Error('Could not find component function in transformed code');
    }
    const componentName = funcMatch[1];

    // Step 4: Create execution context with all runtime functions
    // Make them globally available for the closure to access
    global.$REGISTRY = $REGISTRY;
    global.t_element = t_element;
    global.createSignal = createSignal;
    global.createEffect = createEffect;
    global.batch = batch;
    global.untrack = untrack;
    global.defer = defer;

    const context = {
      $REGISTRY,
      t_element,
      createSignal,
      createEffect,
      batch,
      untrack,
      defer,
      console,
    };

    // Step 5: Execute the transformed code in context
    const fn = new Function(...Object.keys(context), componentCode + `\nreturn ${componentName};`);
    const Component = fn(...Object.values(context));

    console.log('   ✓ Code executed');

    // Step 6: Render component
    const element = Component();

    if (!element) {
      throw new Error('Component returned null/undefined');
    }

    console.log('   ✓ Component rendered');

    // Step 7: Validate output
    await validator(element, runtime);

    console.log('   ✅ PASS\n');
    passed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    failures.push({ name, error: error.message, stack: error.stack });
    failed++;
  }
}

// ============================================================================
// TEST 1: Simplest - Static div
// ============================================================================
await testRender(
  'Test 1: Static div',
  `
component StaticDiv() {
  return <div>Hello World</div>;
}`,
  async (element) => {
    if (element.tagName !== 'DIV') {
      throw new Error(`Expected DIV, got ${element.tagName}`);
    }
    if (element.textContent !== 'Hello World') {
      throw new Error(`Expected "Hello World", got "${element.textContent}"`);
    }
  }
);

// ============================================================================
// TEST 2: Static with attributes
// ============================================================================
await testRender(
  'Test 2: Static div with class',
  `
component StyledDiv() {
  return <div class="container">Styled</div>;
}`,
  async (element) => {
    if (element.className !== 'container') {
      throw new Error(`Expected class="container", got "${element.className}"`);
    }
    if (element.textContent !== 'Styled') {
      throw new Error(`Expected "Styled", got "${element.textContent}"`);
    }
  }
);

// ============================================================================
// TEST 3: Nested elements
// ============================================================================
await testRender(
  'Test 3: Nested elements',
  `
component Nested() {
  return <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>;
}`,
  async (element) => {
    const h1 = element.querySelector('h1');
    const p = element.querySelector('p');

    if (!h1 || h1.textContent !== 'Title') {
      throw new Error('h1 not found or wrong content');
    }
    if (!p || p.textContent !== 'Paragraph') {
      throw new Error('p not found or wrong content');
    }
  }
);

// ============================================================================
// TEST 4: Reactive signal
// ============================================================================
await testRender(
  'Test 4: Signal rendering',
  `
component Counter() {
  const [count, setCount] = createSignal(0);
  return <div>{count()}</div>;
}`,

  async (element, runtime) => {
    // Initial render
    if (element.textContent !== '0') {
      throw new Error(`Expected "0", got "${element.textContent}"`);
    }

    // Note: Testing signal updates requires effect tracking
    // For now, validate initial render works
  }
);

// ============================================================================
// TEST 5: Signal with expression
// ============================================================================
await testRender(
  'Test 5: Signal with expression',
  `
component Doubled() {
  const [num, setNum] = createSignal(5);
  return <div>{num() * 2}</div>;
}`,

  async (element) => {
    if (element.textContent !== '10') {
      throw new Error(`Expected "10", got "${element.textContent}"`);
    }
  }
);

// ============================================================================
// TEST 6: Multiple signals
// ============================================================================
await testRender(
  'Test 6: Multiple signals',
  `
component MultiSignal() {
  const [first, setFirst] = createSignal('John');
  const [last, setLast] = createSignal('Doe');
  return <div>{first()} {last()}</div>;
}`,

  async (element) => {
    if (element.textContent !== 'John Doe') {
      throw new Error(`Expected "John Doe", got "${element.textContent}"`);
    }
  }
);

// ============================================================================
// FINAL VERDICT
// ============================================================================
console.log('═'.repeat(70));
console.log('RENDERING TEST RESULTS');
console.log('═'.repeat(70));
console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\n❌ FAILED TESTS:\n');
  failures.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name}`);
    console.log(`   Error: ${f.error}\n`);
  });
  console.log('🔒 JAIL TIME - Rendering does not work!\n');
  process.exit(1);
} else {
  console.log('\n🎉 ALL RENDERING TESTS PASS!\n');
  console.log('Transformer → Runtime integration verified!\n');
  process.exit(0);
}
