# PSR Test Runner

**Comprehensive testing utility for PSR transformation and runtime validation**

---

## 🤖 For AI Agents

| Document | Purpose | Time | Priority |
|----------|---------|------|----------|
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | Condensed cheat sheet | 2 min | ⭐ START HERE |
| **[AI-AGENT-TESTING-PROMPT.md](./AI-AGENT-TESTING-PROMPT.md)** | Complete testing instructions | 10 min | ⭐⭐⭐ REQUIRED |
| **[HANDOFF-DOCUMENTATION.md](./HANDOFF-DOCUMENTATION.md)** | Context, workflow, examples | 5 min | ⭐⭐ IMPORTANT |
| **[../../TESTING-ISSUES.md](../../TESTING-ISSUES.md)** | Issue tracking template | Ongoing | 📝 WORKING DOC |

**Quick start for AI agents:**
1. Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) (2 min)
2. Read [AI-AGENT-TESTING-PROMPT.md](./AI-AGENT-TESTING-PROMPT.md) (10 min)
3. Start Phase 1: Setup

---

## Overview

The PSR Test Runner is a complete testing framework for validating Pulsar PSR (Pulsar Syntax Runtime) transformations from source code through to DOM rendering and reactivity. It ensures that:

1. ✅ **Transformation succeeds** - PSR → TypeScript compilation works
2. ✅ **Code executes** - Transformed code runs without errors
3. ✅ **DOM renders correctly** - Expected elements, attributes, and structure
4. ✅ **Reactivity works** - Signal updates trigger DOM updates
5. ✅ **Events work** - Event handlers respond correctly
6. ✅ **Styles apply** - CSS classes and inline styles are correct

---

## Features

### Core Capabilities

- **Full Pipeline Testing** - Tests entire transformation pipeline
- **DOM Validation** - Validates element structure, attributes, text content
- **Reactivity Testing** - Verifies signals trigger DOM updates
- **Event Testing** - Tests event handlers (onClick, onChange, etc.)
- **Style Validation** - Checks inline styles and CSS classes
- **Custom Assertions** - Flexible custom validation functions
- **Performance Metrics** - Tracks execution time
- **Comprehensive Reporting** - Detailed pass/fail results

### Generic Design

The test runner is designed to handle **ALL** Pulsar features:

- ✅ Signals (`signal()`, `createSignal()`)
- ✅ Effects (`effect()`, `createEffect()`)
- ✅ Computed (`computed()`, `createMemo()`)
- ✅ Components (`component Foo() {}`)
- ✅ JSX elements (`<div>`, `<button>`, etc.)
- ✅ Event handlers (`onClick`, `onInput`, etc.)
- ✅ Directives (future)
- ✅ Conditional rendering (future)
- ✅ Lists/iteration (future)

---

## Installation

The PSR Test Runner is built into the transformer package:

```bash
npm install @pulsar-framework/transformer
```

---

## Quick Start

### Basic Usage

```typescript
import { createPSRTestRunner } from '@pulsar-framework/transformer/testing';

const runner = createPSRTestRunner({ verbose: true });

const testInput = {
  description: 'Simple counter component',
  source: `
component Counter() {
  const [count, setCount] = signal(0);
  
  return (
    <div>
      <span class="count">{count()}</span>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}`,
  expectedDOM: [
    { selector: '.count', textContent: '0' },
    { selector: 'button', textContent: '+' }
  ]
};

const result = await runner.runTest(testInput);

console.log(`Test ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
console.log(`Execution time: ${result.executionTime.toFixed(2)}ms`);
```

---

## API Reference

### `createPSRTestRunner(config?)`

Create a test runner instance.

**Parameters:**
- `config` (optional): Configuration object

**Returns:** `IPSRTestRunner`

**Example:**

```typescript
const runner = createPSRTestRunner({
  verbose: false,
  defaultTimeout: 1000,
  autoCleanup: true,
  stopOnFailure: false
});
```

---

### `runner.runTest(input)`

Execute a single test.

**Parameters:**
- `input`: Test input configuration

**Returns:** `Promise<IPSRTestResult>`

**Example:**

```typescript
const result = await runner.runTest({
  description: 'Test description',
  source: 'component Test() { ... }',
  expectedDOM: [{ selector: 'div', textContent: 'Hello' }]
});
```

---

### `runner.runTests(inputs)`

Execute multiple tests.

**Parameters:**
- `inputs`: Array of test input configurations

**Returns:** `Promise<IPSRTestResult[]>`

**Example:**

```typescript
const results = await runner.runTests([test1, test2, test3]);
console.log(`${results.filter(r => r.passed).length}/${results.length} passed`);
```

---

## Test Input Configuration

### `IPSRTestInput`

```typescript
interface IPSRTestInput {
  description: string;              // Test description
  source: string;                   // PSR source code
  expectedDOM?: IDOMAssertion[];    // DOM structure expectations
  expectedStyles?: IStyleAssertion[]; // Style expectations
  reactivityTests?: IReactivityTest[]; // Reactivity tests
  eventTests?: IEventTest[];        // Event handler tests
  customAssertions?: Array<(context: ITestContext) => void>;
}
```

### DOM Assertions

```typescript
interface IDOMAssertion {
  selector: string;                 // CSS selector
  tagName?: string;                 // Expected tag name
  textContent?: string;             // Expected text content
  attributes?: Record<string, string>; // Expected attributes
  childrenCount?: number;           // Expected children count
  classList?: string[];             // Expected CSS classes
  customAssertion?: (element: Element) => void;
}
```

**Example:**

```typescript
expectedDOM: [
  {
    selector: '.greeting',
    tagName: 'div',
    textContent: 'Hello, World!',
    classList: ['greeting', 'active'],
    attributes: { 'data-test-id': 'greeting' }
  }
]
```

### Style Assertions

```typescript
interface IStyleAssertion {
  selector: string;
  computedStyles?: Record<string, string>;
  inlineStyles?: Record<string, string>;
  hasClasses?: string[];
  missingClasses?: string[];
}
```

**Example:**

```typescript
expectedStyles: [
  {
    selector: '.button',
    inlineStyles: { color: 'red', 'font-size': '16px' },
    hasClasses: ['primary', 'active'],
    missingClasses: ['disabled']
  }
]
```

### Reactivity Tests

```typescript
interface IReactivityTest {
  description: string;
  trigger: (context: ITestContext) => void;
  expectedChanges: IDOMAssertion[];
  timeout?: number;
}
```

**Example:**

```typescript
reactivityTests: [
  {
    description: 'Increment updates count',
    trigger: (ctx) => {
      ctx.query('button')?.click();
    },
    expectedChanges: [
      { selector: '.count', textContent: '1' }
    ]
  }
]
```

### Event Tests

```typescript
interface IEventTest {
  description: string;
  selector: string;
  eventType: string;
  eventInit?: EventInit;
  expectedBehavior: IDOMAssertion[];
}
```

**Example:**

```typescript
eventTests: [
  {
    description: 'Click toggles visibility',
    selector: 'button.toggle',
    eventType: 'click',
    expectedBehavior: [
      { selector: '.content', classList: ['visible'] }
    ]
  }
]
```

---

## Test Context

When writing custom assertions or trigger functions, you have access to a rich test context:

```typescript
interface ITestContext {
  transformedCode: string;          // Generated TypeScript
  rootElement: HTMLElement;         // Root element
  container: HTMLElement;           // Test container
  componentResult: unknown;         // Component result
  registry: IRegistryMock;          // Mock $REGISTRY
  query: (selector: string) => Element | null;
  queryAll: (selector: string) => Element[];
  waitForUpdate: (timeout?: number) => Promise<void>;
  getComputedStyle: (selector: string) => CSSStyleDeclaration;
}
```

**Example:**

```typescript
customAssertions: [
  (context) => {
    const button = context.query('button');
    if (!button) throw new Error('Button not found');
    
    const style = context.getComputedStyle('button');
    if (style.color !== 'rgb(255, 0, 0)') {
      throw new Error('Button color incorrect');
    }
  }
]
```

---

## Complete Examples

### Example 1: Signal Reactivity

```typescript
const testInput = {
  description: 'Counter increments on click',
  source: `
component Counter() {
  const [count, setCount] = signal(0);
  
  return (
    <div>
      <span class="count">{count()}</span>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}`,
  expectedDOM: [
    { selector: '.count', textContent: '0' }
  ],
  reactivityTests: [
    {
      description: 'Click increments count',
      trigger: (ctx) => {
        ctx.query('button')?.dispatchEvent(new Event('click'));
      },
      expectedChanges: [
        { selector: '.count', textContent: '1' }
      ]
    }
  ]
};

const result = await runner.runTest(testInput);
```

### Example 2: Multiple Signals

```typescript
const testInput = {
  description: 'Form with multiple inputs',
  source: `
component UserForm() {
  const [firstName, setFirstName] = signal('');
  const [lastName, setLastName] = signal('');
  
  return (
    <div>
      <input class="first" onInput={(e) => setFirstName(e.target.value)} />
      <input class="last" onInput={(e) => setLastName(e.target.value)} />
      <div class="full-name">{firstName()} {lastName()}</div>
    </div>
  );
}`,
  expectedDOM: [
    { selector: '.first', tagName: 'input' },
    { selector: '.last', tagName: 'input' },
    { selector: '.full-name', textContent: ' ' }
  ]
};
```

### Example 3: Style Validation

```typescript
const testInput = {
  description: 'Styled button',
  source: `
component StyledButton() {
  return (
    <button 
      class="primary large" 
      style="background: blue; color: white;"
    >
      Click Me
    </button>
  );
}`,
  expectedStyles: [
    {
      selector: 'button',
      hasClasses: ['primary', 'large'],
      inlineStyles: {
        background: 'blue',
        color: 'white'
      }
    }
  ]
};
```

### Example 4: Nested Components

```typescript
const testInput = {
  description: 'Nested list structure',
  source: `
component TodoList() {
  return (
    <div class="list">
      <div class="item">Item 1</div>
      <div class="item">Item 2</div>
      <div class="item">Item 3</div>
    </div>
  );
}`,
  expectedDOM: [
    { selector: '.list', childrenCount: 3 },
    { selector: '.list .item:nth-child(1)', textContent: 'Item 1' },
    { selector: '.list .item:nth-child(2)', textContent: 'Item 2' },
    { selector: '.list .item:nth-child(3)', textContent: 'Item 3' }
  ]
};
```

---

## Test Results

### `IPSRTestResult`

```typescript
interface IPSRTestResult {
  passed: boolean;                  // Overall pass/fail
  description: string;
  transformationSuccess: boolean;
  transformedCode?: string;
  executionSuccess: boolean;
  domValidation: IValidationResult[];
  styleValidation: IValidationResult[];
  reactivityResults: IReactivityTestResult[];
  eventResults: IEventTestResult[];
  customAssertionResults: IValidationResult[];
  errors: ITestError[];
  warnings: string[];
  executionTime: number;            // ms
}
```

**Example usage:**

```typescript
const result = await runner.runTest(testInput);

if (!result.passed) {
  console.error('Test failed:');
  console.error('Errors:', result.errors);
  console.error('Warnings:', result.warnings);
  
  result.domValidation
    .filter(v => !v.passed)
    .forEach(v => console.error(`DOM: ${v.errorMessage}`));
}
```

---

## Configuration

### `IPSRTestRunnerConfig`

```typescript
interface IPSRTestRunnerConfig {
  verbose?: boolean;                // Enable detailed logging
  defaultTimeout?: number;          // Default reactivity timeout (ms)
  autoCleanup?: boolean;            // Auto-remove DOM after test
  stopOnFailure?: boolean;          // Stop on first failure
  enableProfiling?: boolean;        // Track performance metrics
}
```

**Example:**

```typescript
const runner = createPSRTestRunner({
  verbose: true,
  defaultTimeout: 500,
  autoCleanup: true,
  stopOnFailure: false
});
```

---

## Advanced Usage

### Batch Testing

```typescript
const tests = [
  { description: 'Test 1', source: '...', expectedDOM: [...] },
  { description: 'Test 2', source: '...', expectedDOM: [...] },
  { description: 'Test 3', source: '...', expectedDOM: [...] }
];

const results = await runner.runTests(tests);

console.log(`Passed: ${results.filter(r => r.passed).length}`);
console.log(`Failed: ${results.filter(r => !r.passed).length}`);
console.log(`Total time: ${results.reduce((sum, r) => sum + r.executionTime, 0)}ms`);
```

### Custom Validation

```typescript
const testInput = {
  description: 'Complex validation',
  source: '...',
  customAssertions: [
    (context) => {
      // Access any DOM element
      const elements = context.queryAll('.item');
      
      // Perform complex validations
      if (elements.length < 3) {
        throw new Error('Expected at least 3 items');
      }
      
      // Check computed styles
      const firstItem = elements[0];
      const style = window.getComputedStyle(firstItem);
      
      if (style.display !== 'flex') {
        throw new Error('Items should use flexbox');
      }
    }
  ]
};
```

---

## Best Practices

1. **Start Simple** - Begin with basic DOM assertions
2. **Build Up** - Add reactivity and event tests incrementally
3. **Use Specific Selectors** - Avoid ambiguous selectors
4. **Test One Thing** - Each test should verify one behavior
5. **Add Timeouts** - Give reactivity time to propagate
6. **Cleanup** - Enable `autoCleanup` in tests
7. **Verbose Mode** - Use during development, disable in CI

---

## Troubleshooting

### Test Fails with "Element not found"

**Problem:** Selector doesn't match any element

**Solution:** Check selector syntax and transformed code

```typescript
if (!result.passed && result.executionSuccess) {
  console.log('Transformed code:', result.transformedCode);
  // Check what was actually generated
}
```

### Reactivity Test Fails

**Problem:** DOM doesn't update after trigger

**Solution:** Increase timeout or check signal wiring

```typescript
reactivityTests: [{
  timeout: 1000, // Increase timeout
  trigger: async (ctx) => {
    ctx.query('button')?.click();
    await ctx.waitForUpdate(500); // Wait for update
  },
  // ...
}]
```

### Transformation Fails

**Problem:** PSR syntax error

**Solution:** Check diagnostics and errors

```typescript
if (!result.transformationSuccess) {
  console.error('Transformation errors:', result.errors);
}
```

---

## Integration with Vitest

```typescript
import { describe, it, expect } from 'vitest';
import { createPSRTestRunner } from '@pulsar-framework/transformer/testing';

describe('My Components', () => {
  const runner = createPSRTestRunner({ verbose: false });
  
  it('Counter component works', async () => {
    const result = await runner.runTest({
      description: 'Counter',
      source: '...',
      expectedDOM: [...]
    });
    
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

---

## API Type Exports

All types are exported for TypeScript users:

```typescript
import type {
  IPSRTestRunner,
  IPSRTestRunnerConfig,
  IPSRTestInput,
  IPSRTestResult,
  IDOMAssertion,
  IStyleAssertion,
  IReactivityTest,
  IEventTest,
  ITestContext,
  IValidationResult
} from '@pulsar-framework/transformer/testing';
```

---

## Performance

The test runner is optimized for speed:

- ✅ Lightweight mocks for runtime
- ✅ Efficient DOM queries
- ✅ Parallel-safe (each test isolated)
- ✅ Memory cleanup after tests

Typical performance:
- Simple component: **~50ms**
- Complex component: **~200ms**
- Reactivity test: **~150ms**

---

## License

MIT

---

## Contributing

See main transformer [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**Made with ❤️ by the Pulsar Framework team**
