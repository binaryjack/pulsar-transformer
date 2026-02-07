/**
 * PSR Transformer Comprehensive Test Runner
 *
 * This script tests ALL Pulsar features through the PSR Test Runner
 * and documents issues in TESTING-ISSUES.md
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createPSRTestRunner } from './src/testing/index.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track results
interface TestResult {
  category: string;
  description: string;
  passed: boolean;
  errors?: string[];
  transformedCode?: string;
  executionTime: number;
}

const allResults: TestResult[] = [];
let issueCounter = 1;

// Initialize test runner
const runner = createPSRTestRunner({ verbose: true });

console.log('🚀 Starting PSR Transformer Comprehensive Testing\n');
console.log('='.repeat(80));
console.log('Testing Strategy: 14 Feature Categories');
console.log('='.repeat(80) + '\n');

// Helper to document issues
function documentIssue(result: TestResult, feature: string) {
  const issue = `
## Issue #${issueCounter}: ${result.description} - Transformation Failed

**Severity:** Critical  
**Status:** Open  
**Feature:** ${feature}  
**Found:** ${new Date().toISOString().split('T')[0]}  

### Description

Test failed: ${result.description}

### Test Case

\`\`\`psr
${result.transformedCode || 'Source code not available'}
\`\`\`

### Errors

${result.errors?.map((e) => `- ${e}`).join('\n') || 'No error details available'}

### Expected Transformation

Should transform PSR syntax to valid TypeScript with proper imports and $REGISTRY wrapping.

### Root Cause

**Phase:** Unknown (needs investigation)  
**Error:** ${result.errors?.[0] || 'Unknown error'}  

### Suggested Fix

1. Identify which phase fails (Lexer/Parser/Analyzer/Transform/Emitter)
2. Add logging to trace the transformation
3. Fix the root cause
4. Add regression test

---

`;

  const issuesFile = join(__dirname, 'TESTING-ISSUES.md');
  const currentContent = readFileSync(issuesFile, 'utf-8');

  // Insert issue after the "## Issues" section
  const issuesSectionIndex = currentContent.indexOf('## Issues');
  if (issuesSectionIndex > -1) {
    const insertIndex = currentContent.indexOf('\n\n', issuesSectionIndex) + 2;
    const newContent =
      currentContent.slice(0, insertIndex) + issue + currentContent.slice(insertIndex);
    writeFileSync(issuesFile, newContent, 'utf-8');
  }

  issueCounter++;
}

// Update testing progress
function updateProgress(category: string, tests: number, passed: number, failed: number) {
  const issuesFile = join(__dirname, 'TESTING-ISSUES.md');
  const content = readFileSync(issuesFile, 'utf-8');

  const status = failed === 0 ? '✅ Complete' : failed > 0 ? '❌ Failures' : '🔄 In Progress';
  const regex = new RegExp(`\\| ${category} \\| [^|]+ \\| \\d+ \\| \\d+ \\| \\d+ \\| [^|]+ \\|`);

  if (regex.test(content)) {
    const newLine = `| ${category} | ${status} | ${tests} | ${passed} | ${failed} | ${failed} |`;
    const newContent = content.replace(regex, newLine);
    writeFileSync(issuesFile, newContent, 'utf-8');
  }
}

// =============================================================================
// CATEGORY 1: SIGNAL PRIMITIVES
// =============================================================================
async function testSignals() {
  console.log('\n📊 CATEGORY 1: Signal Primitives');
  console.log('-'.repeat(80));

  const tests = [
    {
      description: 'Basic signal creation with number',
      source: `
        component SignalTest() {
          const [count, setCount] = signal(0);
          return <div>{count()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '0' }],
    },
    {
      description: 'Signal with string value',
      source: `
        component StringSignalTest() {
          const [text, setText] = signal('Hello');
          return <span>{text()}</span>;
        }
      `,
      expectedDOM: [{ selector: 'span', textContent: 'Hello' }],
    },
    {
      description: 'Signal with object value',
      source: `
        component ObjectSignalTest() {
          const [user, setUser] = signal({ name: 'Alice' });
          return <div>{user().name}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: 'Alice' }],
    },
    {
      description: 'Signal with array value',
      source: `
        component ArraySignalTest() {
          const [items, setItems] = signal([1, 2, 3]);
          return <div>{items().length}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '3' }],
    },
    {
      description: 'Multiple signals in one component',
      source: `
        component MultiSignalTest() {
          const [a, setA] = signal(1);
          const [b, setB] = signal(2);
          const [c, setC] = signal(3);
          return <div>{a()} {b()} {c()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '1 2 3' }],
    },
    {
      description: 'Signal write operation',
      source: `
        component SignalWriteTest() {
          const [count, setCount] = signal(0);
          setCount(42);
          return <div>{count()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '42' }],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const result = await runner.runTest(test);
      const executionTime = Date.now() - startTime;

      const testResult: TestResult = {
        category: 'Signals',
        description: test.description,
        passed: result.passed,
        errors: result.passed ? undefined : result.errors,
        transformedCode: result.transformedCode,
        executionTime,
      };

      allResults.push(testResult);

      if (result.passed) {
        console.log(`   ✅ ${test.description} (${executionTime}ms)`);
        passed++;
      } else {
        console.log(`   ❌ ${test.description} (${executionTime}ms)`);
        console.log(`      Errors: ${result.errors?.join(', ')}`);
        documentIssue(testResult, 'Signals');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.description} - EXCEPTION`);
      console.log(`      ${(error as Error).message}`);
      allResults.push({
        category: 'Signals',
        description: test.description,
        passed: false,
        errors: [(error as Error).message],
        executionTime: Date.now() - startTime,
      });
      failed++;
    }
  }

  updateProgress('Signals', tests.length, passed, failed);
  console.log(`\n   Summary: ${passed}/${tests.length} passed, ${failed} failed`);
}

// =============================================================================
// CATEGORY 2: EFFECTS
// =============================================================================
async function testEffects() {
  console.log('\n🔄 CATEGORY 2: Effects');
  console.log('-'.repeat(80));

  const tests = [
    {
      description: 'Basic effect that runs on mount',
      source: `
        component EffectTest() {
          const [log, setLog] = signal('');
          effect(() => {
            setLog('Effect ran');
          });
          return <div>{log()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: 'Effect ran' }],
    },
    {
      description: 'Effect that depends on signal',
      source: `
        component EffectDependencyTest() {
          const [count, setCount] = signal(0);
          const [doubled, setDoubled] = signal(0);
          effect(() => {
            setDoubled(count() * 2);
          });
          return <div>{doubled()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '0' }],
    },
    {
      description: 'Multiple effects in one component',
      source: `
        component MultiEffectTest() {
          const [a, setA] = signal(1);
          const [b, setB] = signal(0);
          const [c, setC] = signal(0);
          
          effect(() => setB(a() * 2));
          effect(() => setC(b() * 2));
          
          return <div>{a()} {b()} {c()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '1 2 4' }],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const result = await runner.runTest(test);
      const executionTime = Date.now() - startTime;

      const testResult: TestResult = {
        category: 'Effects',
        description: test.description,
        passed: result.passed,
        errors: result.passed ? undefined : result.errors,
        transformedCode: result.transformedCode,
        executionTime,
      };

      allResults.push(testResult);

      if (result.passed) {
        console.log(`   ✅ ${test.description} (${executionTime}ms)`);
        passed++;
      } else {
        console.log(`   ❌ ${test.description} (${executionTime}ms)`);
        console.log(`      Errors: ${result.errors?.join(', ')}`);
        documentIssue(testResult, 'Effects');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.description} - EXCEPTION`);
      console.log(`      ${(error as Error).message}`);
      failed++;
    }
  }

  updateProgress('Effects', tests.length, passed, failed);
  console.log(`\n   Summary: ${passed}/${tests.length} passed, ${failed} failed`);
}

// =============================================================================
// CATEGORY 3: COMPUTED / MEMOS
// =============================================================================
async function testComputed() {
  console.log('\n🧮 CATEGORY 3: Computed/Memos');
  console.log('-'.repeat(80));

  const tests = [
    {
      description: 'Basic computed value',
      source: `
        component ComputedTest() {
          const [a, setA] = signal(2);
          const [b, setB] = signal(3);
          const sum = computed(() => a() + b());
          return <div>{sum()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '5' }],
    },
    {
      description: 'Computed with string concatenation',
      source: `
        component ComputedStringTest() {
          const [first, setFirst] = signal('Hello');
          const [last, setLast] = signal('World');
          const full = computed(() => first() + ' ' + last());
          return <div>{full()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: 'Hello World' }],
    },
    {
      description: 'Multiple computed values',
      source: `
        component MultiComputedTest() {
          const [x, setX] = signal(10);
          const doubled = computed(() => x() * 2);
          const quadrupled = computed(() => doubled() * 2);
          return <div>{quadrupled()}</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: '40' }],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const result = await runner.runTest(test);
      const executionTime = Date.now() - startTime;

      const testResult: TestResult = {
        category: 'Computed',
        description: test.description,
        passed: result.passed,
        errors: result.passed ? undefined : result.errors,
        transformedCode: result.transformedCode,
        executionTime,
      };

      allResults.push(testResult);

      if (result.passed) {
        console.log(`   ✅ ${test.description} (${executionTime}ms)`);
        passed++;
      } else {
        console.log(`   ❌ ${test.description} (${executionTime}ms)`);
        console.log(`      Errors: ${result.errors?.join(', ')}`);
        documentIssue(testResult, 'Computed');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.description} - EXCEPTION`);
      console.log(`      ${(error as Error).message}`);
      failed++;
    }
  }

  updateProgress('Computed/Memos', tests.length, passed, failed);
  console.log(`\n   Summary: ${passed}/${tests.length} passed, ${failed} failed`);
}

// =============================================================================
// CATEGORY 4: JSX ELEMENTS
// =============================================================================
async function testJSXElements() {
  console.log('\n🏗️  CATEGORY 4: JSX Elements');
  console.log('-'.repeat(80));

  const tests = [
    {
      description: 'Simple div element',
      source: `
        component DivTest() {
          return <div>Hello</div>;
        }
      `,
      expectedDOM: [{ selector: 'div', textContent: 'Hello' }],
    },
    {
      description: 'Nested elements',
      source: `
        component NestedTest() {
          return (
            <div>
              <span>Nested</span>
            </div>
          );
        }
      `,
      expectedDOM: [{ selector: 'div' }, { selector: 'span', textContent: 'Nested' }],
    },
    {
      description: 'Self-closing elements',
      source: `
        component SelfClosingTest() {
          return (
            <div>
              <input type="text" />
              <br />
            </div>
          );
        }
      `,
      expectedDOM: [{ selector: 'div' }, { selector: 'input', attributes: { type: 'text' } }],
    },
    {
      description: 'Multiple children',
      source: `
        component MultiChildTest() {
          return (
            <div>
              <h1>Title</h1>
              <p>Paragraph</p>
              <span>Span</span>
            </div>
          );
        }
      `,
      expectedDOM: [
        { selector: 'h1', textContent: 'Title' },
        { selector: 'p', textContent: 'Paragraph' },
        { selector: 'span', textContent: 'Span' },
      ],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const result = await runner.runTest(test);
      const executionTime = Date.now() - startTime;

      const testResult: TestResult = {
        category: 'JSX Elements',
        description: test.description,
        passed: result.passed,
        errors: result.passed ? undefined : result.errors,
        transformedCode: result.transformedCode,
        executionTime,
      };

      allResults.push(testResult);

      if (result.passed) {
        console.log(`   ✅ ${test.description} (${executionTime}ms)`);
        passed++;
      } else {
        console.log(`   ❌ ${test.description} (${executionTime}ms)`);
        console.log(`      Errors: ${result.errors?.join(', ')}`);
        documentIssue(testResult, 'JSX Elements');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.description} - EXCEPTION`);
      console.log(`      ${(error as Error).message}`);
      failed++;
    }
  }

  updateProgress('JSX Elements', tests.length, passed, failed);
  console.log(`\n   Summary: ${passed}/${tests.length} passed, ${failed} failed`);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================
async function runAllTests() {
  const overallStart = Date.now();

  try {
    await testSignals();
    await testEffects();
    await testComputed();
    await testJSXElements();

    // TODO: Add remaining 10 categories:
    // - Attributes
    // - Event Handlers
    // - Conditional Rendering
    // - Lists/Iteration
    // - Component Composition
    // - Props
    // - TypeScript Integration
    // - Advanced Syntax
    // - Registry Pattern
    // - Error Handling
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
  }

  const overallTime = Date.now() - overallStart;

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('🏁 TESTING COMPLETE');
  console.log('='.repeat(80));

  const totalTests = allResults.length;
  const totalPassed = allResults.filter((r) => r.passed).length;
  const totalFailed = totalTests - totalPassed;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Total Time: ${overallTime}ms`);
  console.log(`📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

  if (totalFailed > 0) {
    console.log(`\n⚠️  ${issueCounter - 1} issue(s) documented in TESTING-ISSUES.md`);
  }

  console.log('\n' + '='.repeat(80));
}

// Run all tests
runAllTests().catch(console.error);
