/**
 * Unit tests for signal detector
 * Tests: import detection, symbol resolution, dependency extraction
 */

import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { createSignalDetector } from '../detector/signal-detector.js';
import { createTestContext, getExpression } from './test-helpers.js';

describe('SignalDetector', () => {
  test('detects createSignal import', () => {
    const source = `import { createSignal } from '@pulsar/core';`;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    expect(detector.isSignalImported('createSignal')).toBe(true);
    expect(detector.isSignalImported('createMemo')).toBe(false);
  });

  test('detects createMemo import', () => {
    const source = `import { createMemo } from '@pulsar/core';`;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    expect(detector.isSignalImported('createMemo')).toBe(true);
  });

  test('detects createEffect import', () => {
    const source = `import { createEffect } from '@pulsar/core';`;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    expect(detector.isSignalImported('createEffect')).toBe(true);
  });

  test('detects multiple signal imports', () => {
    const source = `import { createSignal, createMemo, createEffect } from '@pulsar/core';`;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    expect(detector.isSignalImported('createSignal')).toBe(true);
    expect(detector.isSignalImported('createMemo')).toBe(true);
    expect(detector.isSignalImported('createEffect')).toBe(true);
  });

  test('ignores non-signal imports', () => {
    const source = `import { otherFunction } from '@pulsar/core';`;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    expect(detector.isSignalImported('otherFunction')).toBe(false);
  });

  test('detects signal call expression', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
      count();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('count()');

    expect(detector.isSignalCall(expr)).toBe(true);
  });

  test('detects memo call expression', () => {
    const source = `
      import { createMemo } from '@pulsar/core';
      const doubled = createMemo(() => 42);
      doubled();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('doubled()');

    expect(detector.isSignalCall(expr)).toBe(true);
  });

  test('detects nested signal calls', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(1);
      const [b] = createSignal(2);
      a() + b();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('a() + b()') as ts.BinaryExpression;

    expect(detector.containsSignalCall(expr)).toBe(true);
    expect(detector.containsSignalCall(expr.left)).toBe(true);
    expect(detector.containsSignalCall(expr.right)).toBe(true);
  });

  test('detects signal in template literal', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [name] = createSignal('World');
      \`Hello \${name()}\`;
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('`Hello ${name()}`');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('extracts signal dependencies', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(1);
      const [b] = createSignal(2);
      a() + b();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('a() + b()');

    const deps = detector.extractSignalDependencies(expr);
    expect(deps).toHaveLength(2);
    expect(deps.some((d) => d.name === 'a')).toBe(true);
    expect(deps.some((d) => d.name === 'b')).toBe(true);
  });

  test('handles complex expression dependencies', () => {
    const source = `
      import { createSignal, createMemo } from '@pulsar/core';
      const [x] = createSignal(1);
      const [y] = createSignal(2);
      const sum = createMemo(() => x() + y());
      sum() * 2;
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('sum() * 2');

    const deps = detector.extractSignalDependencies(expr);
    expect(deps.some((d) => d.name === 'sum')).toBe(true);
  });

  test('identifies signal type', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    const info = detector.getSignalInfo('count');
    expect(info?.type).toBe('signal');
    expect(info?.isReactive).toBe(true);
  });

  test('identifies memo type', () => {
    const source = `
      import { createMemo } from '@pulsar/core';
      const doubled = createMemo(() => 42);
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    const info = detector.getSignalInfo('doubled');
    expect(info?.type).toBe('memo');
    expect(info?.isMemoized).toBe(true);
  });

  test('handles prop access on signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [obj] = createSignal({ name: 'test' });
      obj().name;
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('obj().name');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('handles array access on signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [arr] = createSignal([1, 2, 3]);
      arr()[0];
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('arr()[0]');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('does not detect non-signal calls', () => {
    const source = `
      function normalFunction() { return 42; }
      normalFunction();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('normalFunction()');

    expect(detector.isSignalCall(expr)).toBe(false);
  });

  test('handles conditional with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [show] = createSignal(true);
      show() ? 'yes' : 'no';
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('show() ? "yes" : "no"');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('handles logical operators with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(true);
      const [b] = createSignal(false);
      a() && b();
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('a() && b()');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('handles nullish coalescing with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [val] = createSignal(null);
      val() ?? 'default';
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);
    const expr = getExpression('val() ?? "default"');

    expect(detector.containsSignalCall(expr)).toBe(true);
  });

  test('tracks signal source location', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    const info = detector.getSignalInfo('count');
    expect(info?.sourceNode).toBeDefined();
  });

  test('handles aliased imports', () => {
    const source = `
      import { createSignal as signal } from '@pulsar/core';
      const [count] = signal(0);
    `;
    const context = createTestContext(source);
    const detector = createSignalDetector(context);

    // Should handle alias
    expect(detector.isSignalImported('createSignal')).toBe(true);
  });
});
