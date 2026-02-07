/**
 * Execute In DOM Prototype Method
 *
 * Executes transformed TypeScript code in a DOM environment with mocked Pulsar runtime.
 */

import { JSDOM } from 'jsdom';
import type {
  IPSRTestRunnerInternal,
  IRegistryMock,
  ITestContext,
} from '../psr-test-runner.types.js';

export async function _executeInDOM(
  this: IPSRTestRunnerInternal,
  transformedCode: string
): Promise<ITestContext | null> {
  try {
    // Set up DOM environment if not already available
    if (typeof globalThis.document === 'undefined') {
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      (globalThis as any).document = dom.window.document;
      (globalThis as any).Element = dom.window.Element;
      (globalThis as any).HTMLElement = dom.window.HTMLElement;
      (globalThis as any).window = dom.window;
    }

    // Create container for test
    const container = globalThis.document.createElement('div');
    container.id = `psr-test-container-${Date.now()}`;
    container.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
    globalThis.document.body.appendChild(container);

    // Create mock registry
    const registry: IRegistryMock = this._createMockRegistry();

    // Create global context for execution
    const executionContext = {
      document: globalThis.document,
      Element: globalThis.Element,
      HTMLElement: globalThis.HTMLElement,
      $REGISTRY: registry,
      createSignal: this._mockCreateSignal.bind(this),
      createEffect: this._mockCreateEffect.bind(this),
      createMemo: this._mockCreateMemo.bind(this),
      t_element: this._mockTElement.bind(this, container),
      console: globalThis.console,
    };

    // Strip import statements and exports - we'll provide them via context
    const cleanedCode = transformedCode
      .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '') // Remove import statements
      .replace(/^export\s+\{[^}]*\};?\s*$/gm, '') // Remove export statements
      .replace(/export\s+(function|const|let|var)/g, '$1'); // Remove export keywords

    if (this._config.verbose) {
      console.log('Cleaned code:', cleanedCode);
    }

    // Extract component function name from code
    const functionMatch = cleanedCode.match(/function\s+(\w+)/);
    const componentName = functionMatch ? functionMatch[1] : null;

    if (!componentName) {
      if (this._config.verbose) {
        console.error('Could not find component function name');
      }
      return null;
    }

    if (this._config.verbose) {
      console.log('Component name found:', componentName);
    }

    // Wrap code to execute it and return the component function
    const wrappedCode = `
      ${cleanedCode}
      return ${componentName};
    `;

    // Execute code to get component factory
    let componentFactory: any;
    try {
      componentFactory = new Function(...Object.keys(executionContext), wrappedCode)(
        ...Object.values(executionContext)
      );
    } catch (error) {
      if (this._config.verbose) {
        console.error('Failed to create component function:', error);
      }
      return null;
    }

    let componentResult: unknown = null;
    let rootElement: globalThis.HTMLElement | null = null;

    if (typeof componentFactory === 'function') {
      componentResult = await Promise.resolve(componentFactory());

      if (this._config.verbose) {
        console.log('Component result type:', typeof componentResult);
        console.log('Is HTMLElement?', componentResult instanceof globalThis.HTMLElement);
        console.log('Result:', componentResult);
      }

      if (componentResult instanceof globalThis.HTMLElement) {
        rootElement = componentResult;
        container.appendChild(rootElement);
      }
    } else {
      if (this._config.verbose) {
        console.log('Component factory is not a function, type:', typeof componentFactory);
        console.log('Factory:', componentFactory);
      }
    }

    // Create test context
    const testContext: ITestContext = {
      transformedCode,
      rootElement: rootElement || container,
      container,
      componentResult,
      registry,
      query: (selector: string) => container.querySelector(selector),
      queryAll: (selector: string) => Array.from(container.querySelectorAll(selector)),
      waitForUpdate: (timeout = 100) => new Promise((resolve) => setTimeout(resolve, timeout)),
      getComputedStyle: (selector: string) => {
        const el = container.querySelector(selector);
        if (!el) {
          throw new Error(`Element not found: ${selector}`);
        }
        return globalThis.window.getComputedStyle(el);
      },
    };

    return testContext;
  } catch (error) {
    if (this._config.verbose) {
      console.error('Failed to execute in DOM:', error);
    }
    return null;
  }
}
