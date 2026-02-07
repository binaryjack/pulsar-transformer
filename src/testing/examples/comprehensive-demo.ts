/**
 * PSR Test Runner - Complete Feature Demonstration
 *
 * This file demonstrates ALL testing capabilities with real-world examples.
 */

import { createPSRTestRunner } from '../create-psr-test-runner.js'
import type { IPSRTestInput } from '../psr-test-runner.types.js'

/**
 * Run comprehensive feature tests
 */
export async function runComprehensiveTests() {
  const runner = createPSRTestRunner({
    verbose: true,
    defaultTimeout: 1000,
    autoCleanup: true,
  });

  console.log('\n🧪 === PSR TEST RUNNER - COMPREHENSIVE DEMO ===\n');

  // Test 1: Simple Component
  console.log('📋 Test 1: Simple Component\n');
  const test1: IPSRTestInput = {
    description: 'Hello World Component',
    source: `
component HelloWorld() {
  return <div class="greeting">Hello, World!</div>;
}`,
    expectedDOM: [
      {
        selector: 'div.greeting',
        tagName: 'div',
        textContent: 'Hello, World!',
        classList: ['greeting'],
      },
    ],
  };

  const result1 = await runner.runTest(test1);
  console.log(`Result: ${result1.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Time: ${result1.executionTime.toFixed(2)}ms\n`);

  // Test 2: Signal Reactivity
  console.log('📋 Test 2: Signal Reactivity\n');
  const test2: IPSRTestInput = {
    description: 'Counter with Signal',
    source: `
component Counter() {
  const [count, setCount] = signal(0);
  
  return (
    <div>
      <span class="count">{count()}</span>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}`,
    expectedDOM: [
      {
        selector: '.count',
        textContent: '0',
      },
      {
        selector: 'button',
        textContent: 'Increment',
      },
    ],
    reactivityTests: [
      {
        description: 'Clicking button increments count',
        trigger: (context) => {
          const button = context.query('button');
          button?.dispatchEvent(new Event('click'));
        },
        expectedChanges: [
          {
            selector: '.count',
            textContent: '1',
          },
        ],
      },
    ],
  };

  const result2 = await runner.runTest(test2);
  console.log(`Result: ${result2.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Reactivity: ${result2.reactivityResults[0]?.passed ? '✅' : '❌'}`);
  console.log(`Time: ${result2.executionTime.toFixed(2)}ms\n`);

  // Test 3: Multiple Signals
  console.log('📋 Test 3: Multiple Signals\n');
  const test3: IPSRTestInput = {
    description: 'Form with Multiple Signals',
    source: `
component UserForm() {
  const [firstName, setFirstName] = signal('John');
  const [lastName, setLastName] = signal('Doe');
  
  return (
    <div class="form">
      <span class="first-name">{firstName()}</span>
      <span class="last-name">{lastName()}</span>
      <span class="full-name">{firstName()} {lastName()}</span>
    </div>
  );
}`,
    expectedDOM: [
      { selector: '.first-name', textContent: 'John' },
      { selector: '.last-name', textContent: 'Doe' },
      { selector: '.full-name', textContent: 'John Doe' },
    ],
  };

  const result3 = await runner.runTest(test3);
  console.log(`Result: ${result3.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`DOM Validations: ${result3.domValidation.filter((v) => v.passed).length}/${result3.domValidation.length} passed`);
  console.log(`Time: ${result3.executionTime.toFixed(2)}ms\n`);

  // Test 4: Event Handlers
  console.log('📋 Test 4: Event Handlers\n');
  const test4: IPSRTestInput = {
    description: 'Toggle with Event Handler',
    source: `
component Toggle() {
  const [isOn, setIsOn] = signal(false);
  
  return (
    <div>
      <button onClick={() => setIsOn(!isOn())}>Toggle</button>
      <span class="status">{isOn() ? 'ON' : 'OFF'}</span>
    </div>
  );
}`,
    eventTests: [
      {
        description: 'Toggle button changes status',
        selector: 'button',
        eventType: 'click',
        expectedBehavior: [
          {
            selector: '.status',
            textContent: 'ON',
          },
        ],
      },
    ],
  };

  const result4 = await runner.runTest(test4);
  console.log(`Result: ${result4.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Event Tests: ${result4.eventResults.filter((e) => e.passed).length}/${result4.eventResults.length} passed`);
  console.log(`Time: ${result4.executionTime.toFixed(2)}ms\n`);

  // Test 5: Styles & CSS
  console.log('📋 Test 5: Styles & CSS\n');
  const test5: IPSRTestInput = {
    description: 'Styled Component',
    source: `
component StyledButton() {
  return (
    <button 
      class="primary large" 
      style="color: red; font-size: 20px;"
    >
      Click Me
    </button>
  );
}`,
    expectedStyles: [
      {
        selector: 'button',
        hasClasses: ['primary', 'large'],
        missingClasses: ['disabled', 'hidden'],
        inlineStyles: {
          color: 'red',
          'font-size': '20px',
        },
      },
    ],
  };

  const result5 = await runner.runTest(test5);
  console.log(`Result: ${result5.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Style Validations: ${result5.styleValidation.filter((v) => v.passed).length}/${result5.styleValidation.length} passed`);
  console.log(`Time: ${result5.executionTime.toFixed(2)}ms\n`);

  // Test 6: Complex Structure
  console.log('📋 Test 6: Complex Structure\n');
  const test6: IPSRTestInput = {
    description: 'Todo List with Multiple Items',
    source: `
component TodoList() {
  return (
    <div class="todo-list">
      <h2>My Tasks</h2>
      <div class="item" data-id="1">Task 1</div>
      <div class="item" data-id="2">Task 2</div>
      <div class="item" data-id="3">Task 3</div>
    </div>
  );
}`,
    expectedDOM: [
      {
        selector: '.todo-list',
        childrenCount: 4, // h2 + 3 items
      },
      {
        selector: '.todo-list h2',
        textContent: 'My Tasks',
      },
      {
        selector: '.item[data-id="1"]',
        textContent: 'Task 1',
        attributes: { 'data-id': '1' },
      },
      {
        selector: '.item[data-id="2"]',
        textContent: 'Task 2',
        attributes: { 'data-id': '2' },
      },
      {
        selector: '.item[data-id="3"]',
        textContent: 'Task 3',
        attributes: { 'data-id': '3' },
      },
    ],
  };

  const result6 = await runner.runTest(test6);
  console.log(`Result: ${result6.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`DOM Validations: ${result6.domValidation.filter((v) => v.passed).length}/${result6.domValidation.length} passed`);
  console.log(`Time: ${result6.executionTime.toFixed(2)}ms\n`);

  // Test 7: Custom Assertions
  console.log('📋 Test 7: Custom Assertions\n');
  const test7: IPSRTestInput = {
    description: 'Component with Custom Validation',
    source: `
component CustomComponent() {
  return (
    <div id="custom" data-version="1.0">
      <span class="label">Label</span>
      <span class="value">Value</span>
    </div>
  );
}`,
    customAssertions: [
      (context) => {
        const root = context.query('#custom');
        if (!root) throw new Error('Root element not found');

        const version = (root as HTMLElement).dataset.version;
        if (version !== '1.0') {
          throw new Error(`Expected version 1.0, got ${version}`);
        }

        const children = context.queryAll('#custom span');
        if (children.length !== 2) {
          throw new Error(`Expected 2 children, got ${children.length}`);
        }
      },
    ],
  };

  const result7 = await runner.runTest(test7);
  console.log(`Result: ${result7.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Custom Assertions: ${result7.customAssertionResults.filter((c) => c.passed).length}/${result7.customAssertionResults.length} passed`);
  console.log(`Time: ${result7.executionTime.toFixed(2)}ms\n`);

  // Summary
  console.log('\n📊 === TEST SUMMARY ===\n');
  const allResults = [result1, result2, result3, result4, result5, result6, result7];
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  const totalTime = allResults.reduce((sum, r) => sum + r.executionTime, 0);

  console.log(`Total Tests: ${allResults.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Total Execution Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time per Test: ${(totalTime / allResults.length).toFixed(2)}ms`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! PSR Test Runner is fully functional.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check output above for details.\n');
  }

  return allResults;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await runComprehensiveTests();
}
