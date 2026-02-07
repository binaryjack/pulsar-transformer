/**
 * PSR Test Runner - Comprehensive Test Suite
 *
 * Demonstrates all testing capabilities for PSR transformation and runtime validation.
 */

import { describe, expect, it } from 'vitest'
import { createPSRTestRunner } from '../create-psr-test-runner.js'
import type { IPSRTestInput } from '../psr-test-runner.types.js'

describe('PSR Test Runner - Comprehensive Tests', () => {
  describe('Basic Component Rendering', () => {
    it('should validate simple component DOM structure', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Simple Hello World component',
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

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.transformationSuccess).toBe(true);
      expect(result.executionSuccess).toBe(true);
      expect(result.domValidation).toHaveLength(1);
      expect(result.domValidation[0].passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate component with attributes', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with data attributes',
        source: `
component DataComponent() {
  return <div data-test-id="my-component" data-value="42">Content</div>;
}`,
        expectedDOM: [
          {
            selector: '[data-test-id="my-component"]',
            attributes: {
              'data-test-id': 'my-component',
              'data-value': '42',
            },
            textContent: 'Content',
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.domValidation[0].passed).toBe(true);
    });

    it('should validate nested elements', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with nested elements',
        source: `
component NestedComponent() {
  return (
    <div class="container">
      <h1>Title</h1>
      <p>Paragraph</p>
    </div>
  );
}`,
        expectedDOM: [
          {
            selector: '.container',
            childrenCount: 2,
          },
          {
            selector: '.container h1',
            textContent: 'Title',
          },
          {
            selector: '.container p',
            textContent: 'Paragraph',
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.domValidation).toHaveLength(3);
      expect(result.domValidation.every((v) => v.passed)).toBe(true);
    });
  });

  describe('Signal Reactivity', () => {
    it('should validate signal updates trigger DOM updates', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Counter with signal',
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
        ],
        reactivityTests: [
          {
            description: 'Clicking button increments count',
            trigger: (context) => {
              const button = context.query('button');
              if (button) {
                button.dispatchEvent(new Event('click'));
              }
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

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.reactivityResults).toHaveLength(1);
      expect(result.reactivityResults[0].passed).toBe(true);
    });

    it('should validate multiple signals', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with multiple signals',
        source: `
component MultiSignal() {
  const [firstName, setFirstName] = signal('John');
  const [lastName, setLastName] = signal('Doe');
  
  return (
    <div>
      <span class="first-name">{firstName()}</span>
      <span class="last-name">{lastName()}</span>
    </div>
  );
}`,
        expectedDOM: [
          {
            selector: '.first-name',
            textContent: 'John',
          },
          {
            selector: '.last-name',
            textContent: 'Doe',
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.domValidation).toHaveLength(2);
      expect(result.domValidation.every((v) => v.passed)).toBe(true);
    });
  });

  describe('Event Handlers', () => {
    it('should validate onClick events', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Button with onClick handler',
        source: `
component ClickButton() {
  const [clicked, setClicked] = signal(false);
  
  return (
    <div>
      <button onClick={() => setClicked(true)}>Click Me</button>
      <span class="status">{clicked() ? 'Clicked' : 'Not Clicked'}</span>
    </div>
  );
}`,
        eventTests: [
          {
            description: 'Click button updates status',
            selector: 'button',
            eventType: 'click',
            expectedBehavior: [
              {
                selector: '.status',
                textContent: 'Clicked',
              },
            ],
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.eventResults).toHaveLength(1);
      expect(result.eventResults[0].passed).toBe(true);
    });
  });

  describe('Style Validation', () => {
    it('should validate inline styles', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with inline styles',
        source: `
component StyledComponent() {
  return <div style="color: red; font-size: 16px;">Styled Text</div>;
}`,
        expectedStyles: [
          {
            selector: 'div',
            inlineStyles: {
              color: 'red',
              'font-size': '16px',
            },
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.styleValidation).toHaveLength(1);
      expect(result.styleValidation[0].passed).toBe(true);
    });

    it('should validate CSS classes', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with CSS classes',
        source: `
component ClassComponent() {
  return <div class="primary large active">Content</div>;
}`,
        expectedStyles: [
          {
            selector: 'div',
            hasClasses: ['primary', 'large', 'active'],
            missingClasses: ['disabled', 'hidden'],
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.styleValidation[0].passed).toBe(true);
    });
  });

  describe('Custom Assertions', () => {
    it('should execute custom assertions', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Component with custom validation',
        source: `
component CustomComponent() {
  return <div id="custom">Custom Content</div>;
}`,
        customAssertions: [
          (context) => {
            const element = context.query('#custom');
            if (!element) {
              throw new Error('Element not found');
            }
            if (element.id !== 'custom') {
              throw new Error(`Expected id "custom", got "${element.id}"`);
            }
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(true);
      expect(result.customAssertionResults).toHaveLength(1);
      expect(result.customAssertionResults[0].passed).toBe(true);
    });
  });

  describe('Multiple Tests', () => {
    it('should run multiple tests', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const tests: IPSRTestInput[] = [
        {
          description: 'Test 1',
          source: 'component Test1() { return <div>Test 1</div>; }',
          expectedDOM: [{ selector: 'div', textContent: 'Test 1' }],
        },
        {
          description: 'Test 2',
          source: 'component Test2() { return <div>Test 2</div>; }',
          expectedDOM: [{ selector: 'div', textContent: 'Test 2' }],
        },
        {
          description: 'Test 3',
          source: 'component Test3() { return <div>Test 3</div>; }',
          expectedDOM: [{ selector: 'div', textContent: 'Test 3' }],
        },
      ];

      const results = await runner.runTests(tests);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.passed)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle transformation errors', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Invalid PSR syntax',
        source: 'component Invalid() { return <div', // Invalid syntax
        expectedDOM: [],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(false);
      expect(result.transformationSuccess).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle DOM validation failures', async () => {
      const runner = createPSRTestRunner({ verbose: false });

      const testInput: IPSRTestInput = {
        description: 'Wrong expected text',
        source: 'component Test() { return <div>Actual Text</div>; }',
        expectedDOM: [
          {
            selector: 'div',
            textContent: 'Expected Text', // Wrong expectation
          },
        ],
      };

      const result = await runner.runTest(testInput);

      expect(result.passed).toBe(false);
      expect(result.domValidation[0].passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
