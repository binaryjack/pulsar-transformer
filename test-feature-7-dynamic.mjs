/**
 * Feature 7: Dynamic Components - JSX Transformation Test
 * Verify <Dynamic> transforms as normal JSX with spread props
 */

import { createPipeline } from './dist/index.js';

const testCases = [
  {
    name: 'Basic Dynamic component',
    code: '<Dynamic component={currentComponent()} />',
    expectedPatterns: ['Dynamic', 'component:', 'currentComponent()'],
  },
  {
    name: 'Dynamic with multiple props',
    code: '<Dynamic component={getComponent()} name={getName()} />',
    expectedPatterns: ['Dynamic', 'component:', 'getComponent()', 'name:', 'getName()'],
  },
  {
    name: 'Dynamic with children',
    code: '<Dynamic component={Wrapper()}><div>Content</div></Dynamic>',
    expectedPatterns: ['Dynamic', 'component:', 'Wrapper()', 'div', 'Content'],
  },
  {
    name: 'Dynamic with spread props',
    code: '<Dynamic component={Button} {...props()} onClick={handleClick} />',
    expectedPatterns: ['Dynamic', 'component:', 'Button', '...props()', 'onClick:', 'handleClick'],
  },
  {
    name: 'Conditional Dynamic component',
    code: '<Dynamic component={isAdmin() ? AdminPanel : UserPanel} />',
    expectedPatterns: ['Dynamic', 'component:', 'isAdmin()', 'AdminPanel', 'UserPanel'],
  },
];

console.log('='.repeat(70));
console.log('FEATURE 7: DYNAMIC COMPONENTS JSX TRANSFORMATION');
console.log('Verify <Dynamic> transforms with spread props');
console.log('='.repeat(70));

(async () => {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of testCases) {
    console.log(`\n🔹 Testing: ${test.name}`);

    try {
      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(test.code);

      if (result.diagnostics.length > 0) {
        console.log(`   ❌ TRANSFORMATION ERROR`);
        console.log(`   ${result.diagnostics[0].message}`);
        failed++;
        failures.push({ test: test.name, reason: result.diagnostics[0].message });
        continue;
      }

      // Check if all expected patterns are in output
      const missingPatterns = test.expectedPatterns.filter(
        (pattern) => !result.code.includes(pattern)
      );

      if (missingPatterns.length === 0) {
        console.log(`   ✅ PASS`);
        console.log(`   Found all patterns: ${test.expectedPatterns.slice(0, 3).join(', ')}...`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Patterns missing in output`);
        console.log(`   Missing: ${missingPatterns.join(', ')}`);
        console.log(`   Output: ${result.code.substring(0, 300)}...`);
        failed++;
        failures.push({
          test: test.name,
          reason: `Missing patterns: ${missingPatterns.join(', ')}`,
          output: result.code,
        });
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION: ${error.message}`);
      failed++;
      failures.push({ test: test.name, reason: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`DYNAMIC COMPONENTS: ${passed}/${testCases.length} passed`);
  console.log('='.repeat(70));

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.test}`);
      console.log(`   Reason: ${f.reason}`);
      if (f.output) {
        console.log(`   Output: ${f.output.substring(0, 400)}...`);
      }
    });
  }

  if (passed === testCases.length) {
    console.log('\n✅ Feature 7 validation: <Dynamic> JSX transformation works correctly');
    console.log('The transformer handles <Dynamic> like normal JSX with spread props.');
  } else {
    console.log('\n⚠️  Feature 7 validation: Some <Dynamic> patterns need fixing');
  }
})();
