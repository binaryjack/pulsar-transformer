/**
 * Run Test Prototype Method
 *
 * Executes a single PSR test through the full transformation and validation pipeline.
 */

import type {
    IPSRTestInput,
    IPSRTestResult,
    IPSRTestRunnerInternal,
    ITestError,
} from '../psr-test-runner.types.js'

export async function runTest(
  this: IPSRTestRunnerInternal,
  input: IPSRTestInput
): Promise<IPSRTestResult> {
  const startTime = performance.now();

  const result: IPSRTestResult = {
    passed: false,
    description: input.description,
    transformationSuccess: false,
    executionSuccess: false,
    domValidation: [],
    styleValidation: [],
    reactivityResults: [],
    eventResults: [],
    customAssertionResults: [],
    errors: [],
    warnings: [],
    executionTime: 0,
  };

  try {
    // Phase 1: Transform PSR to TypeScript
    if (this._config.verbose) {
      console.log(`\n=== Transforming: ${input.description} ===`);
    }

    const transformResult = await (this._pipeline as any).transform(input.source);

    if (!transformResult?.code) {
      const error: ITestError = {
        type: 'transformation',
        message: 'Transformation failed: No code generated',
      };
      result.errors.push(error);
      return result;
    }

    if (transformResult.diagnostics && transformResult.diagnostics.length > 0) {
      const errors = transformResult.diagnostics.filter((d: any) => d.type === 'error');
      if (errors.length > 0) {
        const error: ITestError = {
          type: 'transformation',
          message: `Transformation errors: ${errors.map((e: any) => e.message).join(', ')}`,
        };
        result.errors.push(error);
        return result;
      }

      const warnings = transformResult.diagnostics.filter((d: any) => d.type === 'warning');
      result.warnings.push(...warnings.map((w: any) => w.message));
    }

    result.transformationSuccess = true;
    result.transformedCode = transformResult.code;

    if (this._config.verbose) {
      console.log('Transformed code:');
      console.log(transformResult.code);
    }

    // Phase 2: Execute transformed code in DOM environment
    if (this._config.verbose) {
      console.log('\n=== Executing transformed code ===');
    }

    const context = await this._executeInDOM(transformResult.code);

    if (!context) {
      const error: ITestError = {
        type: 'execution',
        message: 'Failed to execute transformed code',
      };
      result.errors.push(error);
      return result;
    }

    result.executionSuccess = true;

    // Phase 3: Validate DOM structure
    if (input.expectedDOM && input.expectedDOM.length > 0) {
      if (this._config.verbose) {
        console.log('\n=== Validating DOM structure ===');
      }

      for (const domAssertion of input.expectedDOM) {
        const validationResult = await this._validateDOM(context, domAssertion);
        result.domValidation.push(validationResult);

        if (!validationResult.passed) {
          result.warnings.push(`DOM validation failed: ${validationResult.assertion}`);
        }
      }
    }

    // Phase 4: Validate styles/CSS
    if (input.expectedStyles && input.expectedStyles.length > 0) {
      if (this._config.verbose) {
        console.log('\n=== Validating styles ===');
      }

      for (const styleAssertion of input.expectedStyles) {
        const validationResult = await this._validateStyles(context, styleAssertion);
        result.styleValidation.push(validationResult);

        if (!validationResult.passed) {
          result.warnings.push(`Style validation failed: ${validationResult.assertion}`);
        }
      }
    }

    // Phase 5: Test reactivity
    if (input.reactivityTests && input.reactivityTests.length > 0) {
      if (this._config.verbose) {
        console.log('\n=== Testing reactivity ===');
      }

      for (const reactivityTest of input.reactivityTests) {
        const reactivityResult = await this._testReactivity(context, reactivityTest);
        result.reactivityResults.push(reactivityResult);

        if (!reactivityResult.passed) {
          result.warnings.push(`Reactivity test failed: ${reactivityTest.description}`);
        }
      }
    }

    // Phase 6: Test event handlers
    if (input.eventTests && input.eventTests.length > 0) {
      if (this._config.verbose) {
        console.log('\n=== Testing event handlers ===');
      }

      for (const eventTest of input.eventTests) {
        const eventResult = await this._testEvent(context, eventTest);
        result.eventResults.push(eventResult);

        if (!eventResult.passed) {
          result.warnings.push(`Event test failed: ${eventTest.description}`);
        }
      }
    }

    // Phase 7: Run custom assertions
    if (input.customAssertions && input.customAssertions.length > 0) {
      if (this._config.verbose) {
        console.log('\n=== Running custom assertions ===');
      }

      for (const customAssertion of input.customAssertions) {
        try {
          customAssertion(context);
          result.customAssertionResults.push({
            passed: true,
            assertion: 'Custom assertion',
            expected: 'Passes without error',
            actual: 'Passed',
          });
        } catch (error) {
          result.customAssertionResults.push({
            passed: false,
            assertion: 'Custom assertion',
            expected: 'Passes without error',
            actual: error instanceof Error ? error.message : String(error),
            errorMessage: error instanceof Error ? error.message : String(error),
          });
          result.warnings.push(`Custom assertion failed: ${error}`);
        }
      }
    }

    // Determine overall pass/fail
    result.passed =
      result.transformationSuccess &&
      result.executionSuccess &&
      result.domValidation.every((v) => v.passed) &&
      result.styleValidation.every((v) => v.passed) &&
      result.reactivityResults.every((r) => r.passed) &&
      result.eventResults.every((e) => e.passed) &&
      result.customAssertionResults.every((c) => c.passed);

    // Cleanup
    if (this._config.autoCleanup) {
      context.container.remove();
    }
  } catch (error) {
    const testError: ITestError = {
      type: 'unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    result.errors.push(testError);
  }

  result.executionTime = performance.now() - startTime;

  if (this._config.verbose) {
    console.log(`\n=== Test completed in ${result.executionTime.toFixed(2)}ms ===`);
    console.log(`Result: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
  }

  this._testResults.push(result);

  return result;
}
