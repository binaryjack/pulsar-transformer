/**
 * Test exact section from lines 13-40
 */

import { createPipeline } from './packages/pulsar-transformer/dist/index.js';

const test = `
import { useState } from '@pulsar-framework/pulsar.dev';
import { EdgeCase1ArrayMapPSR } from './edge-case-1-array-map.psr';
import { EdgeCase2NestedComponentsPSR } from './edge-case-2-nested-components.psr';
import { EdgeCase3ConditionalsPSR } from './edge-case-3-conditionals.psr';

type TestCase = 'home' | 'array-map' | 'nested-components' | 'conditionals';

component DebugTestSuitePSR() {
  const [activeTest, setActiveTest] = useState<TestCase>('home');

  const renderTest = () => {
    const test = activeTest();

    if (test === 'array-map') return EdgeCase1ArrayMapPSR();
    if (test === 'nested-components') return EdgeCase2NestedComponentsPSR();
    if (test === 'conditionals') return EdgeCase3ConditionalsPSR();

    // Home screen
    return (
      <div style="padding: 2rem; max-width: 1000px; margin: 0 auto; font-family: system-ui;">
        <div style="text-align: center; margin-bottom: 3rem;">
          <h1 style="margin: 0; font-size: 3rem; color: #2d3748; margin-bottom: 0.5rem;">
            Test Suite
          </h1>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
          <div>Test Case 1</div>
        </div>
      </div>
    );
  };

  return <div>{renderTest()}</div>;
}
`;

console.log('Testing exact section from lines 13-40...\n');

const pipeline = createPipeline({ debug: false });
const result = pipeline.transform(test);

console.log('Result:', result.code ? '✅ SUCCESS' : '❌ FAILED');

if (!result.code) {
  const error = result.diagnostics?.find((d) => d.type === 'error');
  console.log('\nError:', error?.message);
  if (error?.location) {
    console.log(`Location: line ${error.location.line}, column ${error.location.column}`);
  }
} else {
  console.log('\n✅ Code generated successfully');
  console.log('Length:', result.code.length);
}
