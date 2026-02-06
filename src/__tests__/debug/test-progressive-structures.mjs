/**
 * Test simplified version progressively
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test1 = `
import { useState } from '@pulsar-framework/pulsar.dev';

component Test() {
  const [state, setState] = useState('home');
  
  return (
    <div>
      {/* Comment */}
      <span>Hello</span>
    </div>
  );
}
`;

const test2 = `
import { useState } from '@pulsar-framework/pulsar.dev';

component Test() {
  const [state, setState] = useState('home');
  
  return (
    <div>
      {/* Comment */}
      <div
        onClick={() => setState('test')}
      >
        Click me
      </div>
    </div>
  );
}
`;

const test3 = `
import { useState } from '@pulsar-framework/pulsar.dev';

component Test() {
  const [state, setState] = useState('home');
  
  return (
    <div>
      <div>
        {/* Test Case 1 */}
        <div onClick={() => setState('test')}>Click</div>
      </div>
      {state() !== 'home' && (
        <div>
          <button onClick={() => setState('home')}>Back</button>
        </div>
      )}
    </div>
  );
}
`;

console.log('Testing progressive structures...\n');

const pipeline = createPipeline({ debug: false });

const tests = [
  { name: 'Simple with JSX comment', code: test1 },
  { name: 'With event handler', code: test2 },
  { name: 'With conditional + event handlers', code: test3 },
];

tests.forEach((test) => {
  const result = pipeline.transform(test.code);
  const status = result.code ? '✅' : '❌';
  console.log(`${status} ${test.name}`);

  if (!result.code) {
    const error = result.diagnostics?.find((d) => d.type === 'error');
    console.log(`    Error: ${error?.message}`);
  } else {
    console.log(`    Generated ${result.code.length} chars`);
  }
});
