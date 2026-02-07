/**
 * Create Mock Registry Prototype Method
 *
 * Creates a mock $REGISTRY for testing Pulsar components.
 */

import type { IPSRTestRunnerInternal, IRegistryMock } from '../psr-test-runner.types.js'

export function _createMockRegistry(this: IPSRTestRunnerInternal): IRegistryMock {
  const executedComponents: string[] = [];
  const wiredProperties: Array<{ element: globalThis.Element; path: string; source: unknown }> = [];
  const contextStack: Array<{ id: string; parentId: string | null }> = [];
  let currentEffect: any = null;
  const wiredElements: globalThis.Element[] = [];

  const registry: IRegistryMock = {
    execute<T>(id: string, parentId: string | null, factory: () => T): T {
      executedComponents.push(id);
      contextStack.push({ id, parentId });

      try {
        const result = factory();
        return result;
      } finally {
        contextStack.pop();
      }
    },

    wire(el: globalThis.Element, path: string, source: unknown): () => void {
      wiredProperties.push({ element: el, path, source });

      if (!wiredElements.includes(el)) {
        wiredElements.push(el);
      }

      // Create effect for reactive updates
      const effect = () => {
        let value: unknown;

        // Handle signal
        if (typeof source === 'object' && source !== null && '_isSignal' in source) {
          value = (source as any)();
        }
        // Handle getter function
        else if (typeof source === 'function') {
          value = (source as any)();
        }
        // Static value
        else {
          value = source;
        }

        // Apply to DOM
        const parts = path.split('.');
        let target: any = el;

        for (let i = 0; i < parts.length - 1; i++) {
          target = target[parts[i]];
        }

        const lastKey = parts.at(-1) as string;

        if (target[lastKey] !== value) {
          target[lastKey] = value;
        }
      };

      // Subscribe if signal
      if (typeof source === 'object' && source !== null && 'subscribers' in source) {
        (source as any).subscribers = (source as any).subscribers || new Set();
        (source as any).subscribers.add(effect);
      }

      // Initial run
      effect();

      // Return disposer
      return () => {
        if (typeof source === 'object' && source !== null && 'subscribers' in source) {
          (source as any).subscribers.delete(effect);
        }
      };
    },

    getCurrent(): { id: string; parentId: string | null } | undefined {
      return contextStack.at(-1);
    },

    reset(): void {
      executedComponents.length = 0;
      wiredProperties.length = 0;
      contextStack.length = 0;
      wiredElements.length = 0;
      currentEffect = null;
    },

    getComponents(): string[] {
      return [...executedComponents];
    },

    getWiredElements(): globalThis.Element[] {
      return [...wiredElements];
    },

    _inspectionData: {
      get executedComponents() {
        return executedComponents;
      },
      get wiredProperties() {
        return wiredProperties;
      },
      get currentEffects() {
        return 0;
      },
    },
  };

  return registry;
}
