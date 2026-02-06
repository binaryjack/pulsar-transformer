#!/usr/bin/env node
import { createPipeline } from './packages/pulsar-transformer/dist/index.js'

const pipeline = createPipeline({ debug: false });

const testCases = [
  {
    name: '1. Minimal component with JSX comment',
    code: `component MyComponent() {
  return (
    <div>
      {/* comment */}
      <p>Hello</p>
    </div>
  );
}`
  },
  {
    name: '2. Component with template literal',
    code: `component MyComponent() {
  const text = \`Hello World\`;
  return (
    <div>
      {/* comment */}
      <p>{text}</p>
    </div>
  );
}`
  },
  {
    name: '3. Component with multiple children and comments',
    code: `component MyComponent() {
  return (
    <div>
      {/* Comment 1 */}
      <h1>Title</h1>
      {/* Comment 2 */}
      <p>Content</p>
      {/* Comment 3 */}
    </div>
  );
}`
  },
  {
    name: '4. Component with expression and trailing comment',
    code: `component MyComponent() {
  const items = [1, 2, 3];
  return (
    <div>
      {items.map(item => <span>{item}</span>)}
      {/* trailing comment */}
    </div>
  );
}`
  },
  {
    name: '5. Component with conditional and comment',
    code: `component MyComponent() {
  const show = true;
  return (
    <div>
      {show && <p>Visible</p>}
      {/* comment after conditional */}
    </div>
  );
}`
  },
  {
    name: '6. Multiple components in file',
    code: `component Component1() {
  return <div>{/* comment */}Hello</div>;
}

component Component2() {
  return <div>{/* comment */}World</div>;
}`
  },
  {
    name: '7. Component with nested elements and multiple comments',
    code: `component MyComponent() {
  return (
    <div>
      {/* Outer comment */}
      <section>
        {/* Inner comment */}
        <article>
          {/* Nested comment */}
          <p>Deep</p>
        </article>
      </section>
    </div>
  );
}`
  }
];

console.log('Testing minimal component structures with JSX comments\n');

for (const test of testCases) {
  try {
    const result = pipeline.transform(test.code);
    
    // Check if transformation produced code
    if (result.code && result.code.length > test.code.length * 0.5) {
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Input: ${test.code.length} chars → Output: ${result.code.length} chars`);
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Has code: ${!!result.code}`);
      console.log(`   Input: ${test.code.length} chars → Output: ${result.code?.length || 0} chars`);
      if (result.diagnostics && result.diagnostics.length > 0) {
        result.diagnostics.forEach(d => console.log(`   - ${d.message}`));
      }
    }
  } catch (err) {
    console.log(`❌ ${test.name}: ERROR`);
    console.log(`   ${err.message}`);
  }
}
