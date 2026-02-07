/**
 * Mock Pulsar Runtime Functions
 *
 * Mock implementations of Pulsar runtime functions for testing.
 */

import type { IPSRTestRunnerInternal } from '../psr-test-runner.types.js'

/**
 * Mock createSignal
 */
export function _mockCreateSignal<T>(
  this: IPSRTestRunnerInternal,
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void] {
  let _value = initialValue;
  const subscribers = new Set<() => void>();

  const getter: any = () => {
    // Track dependency (simplified)
    return _value;
  };

  getter._isSignal = true;
  getter.subscribers = subscribers;

  const setter = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(_value) : newValue;

    if (_value !== nextValue) {
      _value = nextValue;

      // Notify subscribers
      subscribers.forEach((sub) => sub());
    }
  };

  return [getter as () => T, setter];
}

/**
 * Mock createEffect
 */
export function _mockCreateEffect(this: IPSRTestRunnerInternal, fn: () => void | (() => void)): () => void {
  const cleanup = fn();
  const disposer = typeof cleanup === 'function' ? cleanup : () => {};

  return disposer;
}

/**
 * Mock createMemo
 */
export function _mockCreateMemo<T>(this: IPSRTestRunnerInternal, fn: () => T): () => T {
  let cachedValue: T;
  let isInitialized = false;

  const getter: any = () => {
    if (!isInitialized) {
      cachedValue = fn();
      isInitialized = true;
    }
    return cachedValue;
  };

  getter._isSignal = true;

  return getter as () => T;
}

/**
 * Mock t_element
 */
export function _mockTElement(
  this: IPSRTestRunnerInternal,
  container: globalThis.HTMLElement,
  tag: string,
  attrs: Record<string, unknown> = {},
  isSSR = false
): globalThis.Element {
  const el = globalThis.document.createElement(tag);

  // Apply attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) {
      // Event listener
      const eventName = key.toLowerCase().substring(2);
      if (typeof value === 'function') {
        el.addEventListener(eventName, value as globalThis.EventListener);
      }
    } else if (value !== null && value !== undefined) {
      // Check if it's a signal or getter
      const isSignal = typeof value === 'object' && '_isSignal' in value && (value as any)._isSignal;
      const isGetter = typeof value === 'function' && !isSignal;

      if (isSignal || isGetter) {
        // Reactive property - wire it (this would normally use $REGISTRY.wire)
        // For now, just evaluate once
        const evaluatedValue = typeof value === 'function' ? (value as any)() : value;
        (el as any)[key] = evaluatedValue;
      } else if (key === 'style' && typeof value === 'object') {
        // Handle style object
        const styleObj = value as Record<string, string>;
        for (const [styleProp, styleValue] of Object.entries(styleObj)) {
          (el as globalThis.HTMLElement).style[styleProp as any] = styleValue;
        }
      } else if (key === 'className') {
        el.setAttribute('class', typeof value === 'string' ? value : '');
      } else if (key.startsWith('data-') || key.startsWith('aria-')) {
        el.setAttribute(key, typeof value === 'string' ? value : String(value));
      } else if (key === 'style' && typeof value === 'string') {
        el.setAttribute('style', value);
      } else {
        (el as any)[key] = value;
      }
    }
  }

  return el;
}
