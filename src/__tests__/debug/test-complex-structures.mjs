#!/usr/bin/env node
import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const pipeline = createPipeline({ debug: false });

const testCases = [
  {
    name: '1. Event handlers with type annotations',
    code: `component MyComponent() {
  return (
    <div
      onMouseOver={(e: MouseEvent) => {
        console.log(e);
      }}
      onMouseOut={(e: MouseEvent) => {
        console.log(e);
      }}
    >
      Test
    </div>
  );
}`,
  },
  {
    name: '2. Inline styles with template literals',
    code: `component MyComponent() {
  return (
    <div style={\`padding: 2rem; background: #fff;\`}>
      Test
    </div>
  );
}`,
  },
  {
    name: '3. Template literal in JSX with code example',
    code: `component MyComponent() {
  return (
    <code>
      {\`items().map(item => <div>{item}</div>)\`}
    </code>
  );
}`,
  },
  {
    name: '4. Combination: JSX comment + event handler + template literal',
    code: `component MyComponent() {
  return (
    <div
      onClick={() => console.log('clicked')}
      style="padding: 1rem;"
    >
      {/* Comment */}
      <code>{\`<div>example</div>\`}</code>
    </div>
  );
}`,
  },
  {
    name: '5. Multiple event handlers + JSX comment + styled div',
    code: `component MyComponent() {
  return (
    <div
      onMouseOver={(e: MouseEvent) => {
        console.log('over');
      }}
      onMouseOut={(e: MouseEvent) => {
        console.log('out');
      }}
      style="padding: 2rem; background: #667eea;"
    >
      {/* Test comment */}
      <p>Content</p>
    </div>
  );
}`,
  },
  {
    name: '6. Signal call + JSX comments + event handlers',
    code: `import { useState } from '@pulsar-framework/pulsar.dev';

component MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      {/* Counter display */}
      <p>{count()}</p>
      {/* Button */}
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}`,
  },
  {
    name: '7. Complex nesting with all features',
    code: `import { useState } from '@pulsar-framework/pulsar.dev';

component ComplexComponent() {
  const [active, setActive] = useState('home');
  
  return (
    <div style="padding: 2rem;">
      {/* Header */}
      <h1>Test Suite</h1>
      
      {/* Content */}
      <div
        onClick={() => setActive('test')}
        onMouseOver={(e: MouseEvent) => {
          console.log(e);
        }}
      >
        {/* Code example */}
        <code>{\`<Parent><Child /></Parent>\`}</code>
      </div>
    </div>
  );
}`,
  },
];

console.log('Testing complex PSR structures\n');

for (const test of testCases) {
  try {
    const result = pipeline.transform(test.code);

    if (result.code && result.code.length > test.code.length * 0.5) {
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Input: ${test.code.length} chars → Output: ${result.code.length} chars`);
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(
        `   Input: ${test.code.length} chars → Output: ${result.code?.length || 0} chars`
      );
      if (result.diagnostics && result.diagnostics.length > 0) {
        result.diagnostics.forEach((d) => console.log(`   - ${d.severity}: ${d.message}`));
      }
    }
  } catch (err) {
    console.log(`❌ ${test.name}: ERROR`);
    console.log(`   ${err.message}`);
    if (err.stack) {
      console.log(`   Stack: ${err.stack.split('\n').slice(0, 3).join('\n   ')}`);
    }
  }
  console.log('');
}
