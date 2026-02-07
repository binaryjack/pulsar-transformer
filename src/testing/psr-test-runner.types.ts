/**
 * PSR Test Runner Type Definitions
 *
 * Types for comprehensive PSR transformation and runtime testing.
 *
 * @package @pulsar-framework/transformer
 */

/// <reference lib="dom" />

/**
 * Test input configuration
 */
export interface IPSRTestInput {
  /**
   * PSR source code
   */
  source: string;

  /**
   * Test description
   */
  description: string;

  /**
   * Expected DOM structure
   */
  expectedDOM?: IDOMAssertion[];

  /**
   * Expected CSS/styles
   */
  expectedStyles?: IStyleAssertion[];

  /**
   * Reactivity test cases
   */
  reactivityTests?: IReactivityTest[];

  /**
   * Event handler tests
   */
  eventTests?: IEventTest[];

  /**
   * Custom assertions
   */
  customAssertions?: Array<(context: ITestContext) => void>;
}

/**
 * DOM assertion
 */
export interface IDOMAssertion {
  /**
   * CSS selector to find element
   */
  selector: string;

  /**
   * Expected tag name
   */
  tagName?: string;

  /**
   * Expected text content
   */
  textContent?: string;

  /**
   * Expected attributes
   */
  attributes?: Record<string, string>;

  /**
   * Expected children count
   */
  childrenCount?: number;

  /**
   * Expected class list
   */
  classList?: string[];

  /**
   * Custom DOM assertion function
   */
  customAssertion?: (element: Element) => void;
}

/**
 * Style assertion
 */
export interface IStyleAssertion {
  /**
   * CSS selector to find element
   */
  selector: string;

  /**
   * Expected computed styles
   */
  computedStyles?: Record<string, string>;

  /**
   * Expected inline styles
   */
  inlineStyles?: Record<string, string>;

  /**
   * Expected CSS classes presence
   */
  hasClasses?: string[];

  /**
   * Expected CSS classes absence
   */
  missingClasses?: string[];
}

/**
 * Reactivity test
 */
export interface IReactivityTest {
  /**
   * Description of reactivity test
   */
  description: string;

  /**
   * Setup function to trigger state change
   */
  trigger: (context: ITestContext) => void;

  /**
   * Expected DOM changes after trigger
   */
  expectedChanges: IDOMAssertion[];

  /**
   * Timeout in ms
   */
  timeout?: number;
}

/**
 * Event test
 */
export interface IEventTest {
  /**
   * Description of event test
   */
  description: string;

  /**
   * Selector for element to trigger event on
   */
  selector: string;

  /**
   * Event type
   */
  eventType: string;

  /**
   * Event init options
   */
  eventInit?: EventInit;

  /**
   * Expected behavior after event
   */
  expectedBehavior: IDOMAssertion[];
}

/**
 * Test execution context
 */
export interface ITestContext {
  /**
   * Transformed TypeScript code
   */
  transformedCode: string;

  /**
   * Root DOM element
   */
  rootElement: HTMLElement;

  /**
   * Container element
   */
  container: HTMLElement;

  /**
   * Executed component result
   */
  componentResult: unknown;

  /**
   * Access to $REGISTRY for inspection
   */
  registry: IRegistryMock;

  /**
   * Query helper
   */
  query: (selector: string) => Element | null;

  /**
   * Query all helper
   */
  queryAll: (selector: string) => Element[];

  /**
   * Wait for DOM update
   */
  waitForUpdate: (timeout?: number) => Promise<void>;

  /**
   * Get computed style
   */
  getComputedStyle: (selector: string) => CSSStyleDeclaration;
}

/**
 * Registry mock for testing
 */
export interface IRegistryMock {
  /**
   * Execute component
   */
  execute<T>(id: string, parentId: string | null, factory: () => T): T;

  /**
   * Wire reactive property
   */
  wire(el: Element, path: string, source: unknown): () => void;

  /**
   * Get current context
   */
  getCurrent(): { id: string; parentId: string | null } | undefined;

  /**
   * Reset registry
   */
  reset(): void;

  /**
   * Get all registered components
   */
  getComponents(): string[];

  /**
   * Get all wired elements
   */
  getWiredElements(): Element[];

  /**
   * Inspection data
   */
  _inspectionData: {
    executedComponents: string[];
    wiredProperties: Array<{ element: Element; path: string; source: unknown }>;
    currentEffects: number;
  };
}

/**
 * Test result
 */
export interface IPSRTestResult {
  /**
   * Test passed
   */
  passed: boolean;

  /**
   * Test description
   */
  description: string;

  /**
   * Transformation successful
   */
  transformationSuccess: boolean;

  /**
   * Transformed code
   */
  transformedCode?: string;

  /**
   * Execution successful
   */
  executionSuccess: boolean;

  /**
   * DOM validation results
   */
  domValidation: IValidationResult[];

  /**
   * Style validation results
   */
  styleValidation: IValidationResult[];

  /**
   * Reactivity test results
   */
  reactivityResults: IReactivityTestResult[];

  /**
   * Event test results
   */
  eventResults: IEventTestResult[];

  /**
   * Custom assertion results
   */
  customAssertionResults: IValidationResult[];

  /**
   * Errors encountered
   */
  errors: ITestError[];

  /**
   * Warnings
   */
  warnings: string[];

  /**
   * Execution time in ms
   */
  executionTime: number;
}

/**
 * Validation result
 */
export interface IValidationResult {
  /**
   * Validation passed
   */
  passed: boolean;

  /**
   * What was validated
   */
  assertion: string;

  /**
   * Expected value/state
   */
  expected: unknown;

  /**
   * Actual value/state
   */
  actual: unknown;

  /**
   * Error message if failed
   */
  errorMessage?: string;
}

/**
 * Reactivity test result
 */
export interface IReactivityTestResult {
  /**
   * Test description
   */
  description: string;

  /**
   * Test passed
   */
  passed: boolean;

  /**
   * Validations performed
   */
  validations: IValidationResult[];

  /**
   * Error if failed
   */
  error?: string;
}

/**
 * Event test result
 */
export interface IEventTestResult {
  /**
   * Test description
   */
  description: string;

  /**
   * Event triggered successfully
   */
  eventTriggered: boolean;

  /**
   * Test passed
   */
  passed: boolean;

  /**
   * Validations performed
   */
  validations: IValidationResult[];

  /**
   * Error if failed
   */
  error?: string;
}

/**
 * Test error
 */
export interface ITestError {
  /**
   * Error type
   */
  type: 'transformation' | 'execution' | 'validation' | 'assertion' | 'timeout' | 'unknown';

  /**
   * Error message
   */
  message: string;

  /**
   * Stack trace
   */
  stack?: string;

  /**
   * Location in code
   */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Test runner configuration
 */
export interface IPSRTestRunnerConfig {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Default timeout for reactivity tests (ms)
   */
  defaultTimeout?: number;

  /**
   * Enable DOM cleanup after each test
   */
  autoCleanup?: boolean;

  /**
   * Custom registry implementation
   */
  customRegistry?: unknown;

  /**
   * Enable performance profiling
   */
  enableProfiling?: boolean;

  /**
   * Stop on first failure
   */
  stopOnFailure?: boolean;
}

/**
 * PSR Test Runner interface
 */
export interface IPSRTestRunner {
  /**
   * Run a single test
   */
  runTest(input: IPSRTestInput): Promise<IPSRTestResult>;

  /**
   * Run multiple tests
   */
  runTests(inputs: IPSRTestInput[]): Promise<IPSRTestResult[]>;

  /**
   * Get configuration
   */
  getConfig(): IPSRTestRunnerConfig;
}

/**
 * Internal PSR Test Runner interface (extends public interface)
 */
export interface IPSRTestRunnerInternal extends IPSRTestRunner {
  _config: Required<IPSRTestRunnerConfig>;
  _pipeline: unknown; // IPipeline from pipeline module
  _testResults: IPSRTestResult[];

  // Internal helper methods
  _executeInDOM(transformedCode: string): Promise<ITestContext | null>;
  _createMockRegistry(): IRegistryMock;
  _mockCreateSignal<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void];
  _mockCreateEffect(fn: () => void | (() => void)): () => void;
  _mockCreateMemo<T>(fn: () => T): () => T;
  _mockTElement(
    container: HTMLElement,
    tag: string,
    attrs?: Record<string, unknown>,
    isSSR?: boolean
  ): Element;
  _validateDOM(context: ITestContext, assertion: IDOMAssertion): Promise<IValidationResult>;
  _validateStyles(context: ITestContext, assertion: IStyleAssertion): Promise<IValidationResult>;
  _testReactivity(context: ITestContext, test: IReactivityTest): Promise<IReactivityTestResult>;
  _testEvent(context: ITestContext, test: IEventTest): Promise<IEventTestResult>;
}
