/**
 * recursion-detector.test.ts
 * Tests for RecursionDetector
 *
 * @see docs/architecture/transformation-issues/agents/recursion-detector-agent.md
 * @see .github/05-TESTING-STANDARDS.md
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { createRecursionDetector } from '../create-recursion-detector';

import type { IRecursionDetector } from '../recursion-detector.types';

describe('RecursionDetector', () => {
  let detector: IRecursionDetector;

  beforeEach(() => {
    detector = createRecursionDetector();
  });

  describe('enterComponent', () => {
    it('should add component to call stack', () => {
      detector.enterComponent('ComponentA');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA']);
    });

    it('should add multiple components to call stack', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentC');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA', 'ComponentB', 'ComponentC']);
    });

    it('should allow same component multiple times (for nested scenarios)', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentA');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA', 'ComponentB', 'ComponentA']);
    });
  });

  describe('exitComponent', () => {
    it('should remove component from call stack', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');

      detector.exitComponent('ComponentB');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA']);
    });

    it('should remove last occurrence when component appears multiple times', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentA');

      detector.exitComponent('ComponentA');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA', 'ComponentB']);
    });

    it('should handle exit when component not in stack', () => {
      detector.enterComponent('ComponentA');

      detector.exitComponent('ComponentB'); // Not in stack

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA']); // Unchanged
    });

    it('should handle empty call stack gracefully', () => {
      expect(() => {
        detector.exitComponent('ComponentA');
      }).not.toThrow();

      const stack = detector.getCallStack();
      expect(stack).toEqual([]);
    });
  });

  describe('checkRecursion', () => {
    it('should detect self-recursion (direct)', () => {
      detector.enterComponent('ComponentA');

      const hasRecursion = detector.checkRecursion('ComponentA');

      expect(hasRecursion).toBe(true);
    });

    it('should not detect recursion for different component', () => {
      detector.enterComponent('ComponentA');

      const hasRecursion = detector.checkRecursion('ComponentB');

      expect(hasRecursion).toBe(false);
    });

    it('should detect recursion in nested call stack', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentC');

      const hasRecursion = detector.checkRecursion('ComponentA');

      expect(hasRecursion).toBe(true);
    });

    it('should not detect recursion after component exits', () => {
      detector.enterComponent('ComponentA');
      detector.exitComponent('ComponentA');

      const hasRecursion = detector.checkRecursion('ComponentA');

      expect(hasRecursion).toBe(false);
    });

    it('should handle empty call stack', () => {
      const hasRecursion = detector.checkRecursion('ComponentA');

      expect(hasRecursion).toBe(false);
    });
  });

  describe('getCallStack', () => {
    it('should return empty array initially', () => {
      const stack = detector.getCallStack();

      expect(stack).toEqual([]);
    });

    it('should return copy of call stack', () => {
      detector.enterComponent('ComponentA');

      const stack1 = detector.getCallStack();
      const stack2 = detector.getCallStack();

      expect(stack1).toEqual(stack2);
      expect(stack1).not.toBe(stack2); // Different instances
    });

    it("should return read-only stack (changes don't affect internal state)", () => {
      detector.enterComponent('ComponentA');

      const stack = detector.getCallStack() as string[];
      stack.push('ComponentB'); // Try to modify

      const actualStack = detector.getCallStack();
      expect(actualStack).toEqual(['ComponentA']); // Unchanged
    });
  });

  describe('clear', () => {
    it('should clear entire call stack', () => {
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentC');

      detector.clear();

      const stack = detector.getCallStack();
      expect(stack).toEqual([]);
    });

    it('should handle clearing empty stack', () => {
      expect(() => {
        detector.clear();
      }).not.toThrow();

      const stack = detector.getCallStack();
      expect(stack).toEqual([]);
    });

    it('should allow new components after clear', () => {
      detector.enterComponent('ComponentA');
      detector.clear();
      detector.enterComponent('ComponentB');

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentB']);
    });
  });

  describe('integration scenarios', () => {
    it('should handle normal component rendering flow', () => {
      // Render ComponentA
      detector.enterComponent('ComponentA');
      expect(detector.checkRecursion('ComponentA')).toBe(true);

      // ComponentA renders ComponentB
      detector.enterComponent('ComponentB');
      expect(detector.checkRecursion('ComponentB')).toBe(true);
      expect(detector.checkRecursion('ComponentA')).toBe(true);

      // ComponentB finishes
      detector.exitComponent('ComponentB');
      expect(detector.checkRecursion('ComponentB')).toBe(false);
      expect(detector.checkRecursion('ComponentA')).toBe(true);

      // ComponentA finishes
      detector.exitComponent('ComponentA');
      expect(detector.checkRecursion('ComponentA')).toBe(false);

      const stack = detector.getCallStack();
      expect(stack).toEqual([]);
    });

    it('should detect direct self-recursion pattern', () => {
      // const Component = () => <Component />
      detector.enterComponent('Component');

      // Component tries to render itself
      const hasRecursion = detector.checkRecursion('Component');

      expect(hasRecursion).toBe(true);
      expect(detector.getCallStack()).toEqual(['Component']);
    });

    it('should detect conditional self-recursion pattern', () => {
      // const Component = () => condition ? <div/> : <Component />
      detector.enterComponent('Component');

      // In else branch, Component renders itself
      const hasRecursion = detector.checkRecursion('Component');

      expect(hasRecursion).toBe(true);
    });

    it('should detect nested self-recursion pattern', () => {
      // const Component = () => <div><Component /></div>
      detector.enterComponent('Component');

      // Inside div, Component renders itself
      const hasRecursion = detector.checkRecursion('Component');

      expect(hasRecursion).toBe(true);
    });

    it('should handle multiple independent transformation sessions', () => {
      // First transformation
      detector.enterComponent('ComponentA');
      detector.exitComponent('ComponentA');

      // Clear for next transformation
      detector.clear();

      // Second transformation
      detector.enterComponent('ComponentB');

      const hasRecursionA = detector.checkRecursion('ComponentA');
      const hasRecursionB = detector.checkRecursion('ComponentB');

      expect(hasRecursionA).toBe(false);
      expect(hasRecursionB).toBe(true);
    });

    it('should handle deep component nesting without false positives', () => {
      // A renders B renders C renders D
      detector.enterComponent('ComponentA');
      detector.enterComponent('ComponentB');
      detector.enterComponent('ComponentC');
      detector.enterComponent('ComponentD');

      // D should not be detected as recursive for A, B, or C
      expect(detector.checkRecursion('ComponentD')).toBe(true); // D is rendering
      expect(detector.checkRecursion('ComponentC')).toBe(true); // C is rendering
      expect(detector.checkRecursion('ComponentB')).toBe(true); // B is rendering
      expect(detector.checkRecursion('ComponentA')).toBe(true); // A is rendering

      // E should not be detected as recursive
      expect(detector.checkRecursion('ComponentE')).toBe(false);

      const stack = detector.getCallStack();
      expect(stack).toEqual(['ComponentA', 'ComponentB', 'ComponentC', 'ComponentD']);
    });
  });

  describe('edge cases', () => {
    it('should handle component names with special characters', () => {
      detector.enterComponent('Component$1');
      detector.enterComponent('Component-A');
      detector.enterComponent('Component_Test');

      expect(detector.checkRecursion('Component$1')).toBe(true);
      expect(detector.checkRecursion('Component-A')).toBe(true);
      expect(detector.checkRecursion('Component_Test')).toBe(true);
    });

    it('should handle empty component name', () => {
      expect(() => {
        detector.enterComponent('');
      }).not.toThrow();

      expect(detector.checkRecursion('')).toBe(true);
    });

    it('should handle very long call stack', () => {
      // Simulate deep nesting (100 levels)
      for (let i = 0; i < 100; i++) {
        detector.enterComponent(`Component${i}`);
      }

      expect(detector.getCallStack().length).toBe(100);
      expect(detector.checkRecursion('Component0')).toBe(true);
      expect(detector.checkRecursion('Component99')).toBe(true);
      expect(detector.checkRecursion('Component100')).toBe(false);
    });
  });
});
