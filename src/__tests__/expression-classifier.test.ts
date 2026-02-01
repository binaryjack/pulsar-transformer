/**
 * Unit tests for expression classifier
 * Tests: static/dynamic/event/child/fragment/conditional/loop classification
 */

import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { createExpressionClassifier } from '../detector/expression-classifier.js';
import { createTestContext } from './test-helpers.js';

describe('ExpressionClassifier', () => {
  function getExpression(source: string): ts.Expression {
    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const statement = file.statements[0] as ts.ExpressionStatement;
    return statement.expression;
  }

  test('classifies string literal as static', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('"Hello World"');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
    expect(result.isStatic).toBe(true);
    expect(result.hasSignals).toBe(false);
  });

  test('classifies number literal as static', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('42');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
    expect(result.isStatic).toBe(true);
  });

  test('classifies boolean literal as static', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('true');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
    expect(result.isStatic).toBe(true);
  });

  test('classifies signal call as dynamic', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
      count();
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('count()');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
    expect(result.signalDependencies).toHaveLength(1);
  });

  test('classifies event handler as event', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('() => console.log("clicked")');

    const result = classifier.classifyAttribute('onClick', expr);

    expect(result.type).toBe('event');
    expect(result.eventName).toBe('click');
  });

  test('classifies JSX element as child', () => {
    const file = ts.createSourceFile('test.tsx', '<div>Text</div>', ts.ScriptTarget.ESNext, true);
    const context = createTestContext('<div>Text</div>');
    const classifier = createExpressionClassifier(context);

    // Get JSX element from file
    const jsxExpr = file.statements[0] as ts.ExpressionStatement;
    const jsxElement = jsxExpr.expression;

    const result = classifier.classify(jsxElement);

    expect(result.type).toBe('child');
  });

  test('classifies JSX fragment as fragment', () => {
    const file = ts.createSourceFile(
      'test.tsx',
      '<><div>A</div><div>B</div></>',
      ts.ScriptTarget.ESNext,
      true
    );
    const context = createTestContext('<></>');
    const classifier = createExpressionClassifier(context);

    const jsxExpr = file.statements[0] as ts.ExpressionStatement;
    const fragment = jsxExpr.expression;

    const result = classifier.classify(fragment);

    expect(result.type).toBe('fragment');
  });

  test('classifies conditional expression as conditional', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [show] = createSignal(true);
      show() ? 'yes' : 'no';
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('show() ? "yes" : "no"');

    const result = classifier.classify(expr);

    expect(result.type).toBe('conditional');
    expect(result.hasSignals).toBe(true);
  });

  test('classifies array map as loop', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('[1, 2, 3].map(x => x * 2)');

    const result = classifier.classify(expr);

    expect(result.type).toBe('loop');
  });

  test('detects null value', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('null');

    const result = classifier.classify(expr);

    expect(result.isNullable).toBe(true);
  });

  test('detects undefined value', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('undefined');

    const result = classifier.classify(expr);

    expect(result.isNullable).toBe(true);
  });

  test('classifies complex expression with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(1);
      const [b] = createSignal(2);
      a() + b() * 2;
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('a() + b() * 2');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
    expect(result.signalDependencies.length).toBeGreaterThan(0);
  });

  test('classifies template literal with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [name] = createSignal('World');
      \`Hello \${name()}\`;
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('`Hello ${name()}`');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('classifies static template literal', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('`Hello World`');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
    expect(result.hasSignals).toBe(false);
  });

  test('identifies event names from attributes', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('() => {}');

    const result = classifier.classifyAttribute('onClick', expr);
    expect(result.eventName).toBe('click');

    const result2 = classifier.classifyAttribute('onMouseOver', expr);
    expect(result2.eventName).toBe('mouseover');

    const result3 = classifier.classifyAttribute('onKeyDown', expr);
    expect(result3.eventName).toBe('keydown');
  });

  test('handles object expression', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('({ name: "test", value: 42 })');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
  });

  test('handles object with signal properties', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
      ({ value: count() });
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('({ value: count() })');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('handles array expression', () => {
    const context = createTestContext('');
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('[1, 2, 3]');

    const result = classifier.classify(expr);

    expect(result.type).toBe('static');
  });

  test('handles array with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(1);
      [a(), 2, 3];
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('[a(), 2, 3]');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('classifies logical AND with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [show] = createSignal(true);
      show() && 'visible';
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('show() && "visible"');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('classifies nullish coalescing with signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [val] = createSignal(null);
      val() ?? 'default';
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('val() ?? "default"');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('handles parenthesized expressions', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [count] = createSignal(0);
      (count() + 1);
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('(count() + 1)');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('handles property access', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [obj] = createSignal({ name: 'test' });
      obj().name;
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('obj().name');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('handles element access', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [arr] = createSignal([1, 2, 3]);
      arr()[0];
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('arr()[0]');

    const result = classifier.classify(expr);

    expect(result.type).toBe('dynamic');
    expect(result.hasSignals).toBe(true);
  });

  test('tracks expression depth', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [a] = createSignal(1);
      (a() + (a() * (a() - 1)));
    `;
    const context = createTestContext(source);
    const classifier = createExpressionClassifier(context);
    const expr = getExpression('(a() + (a() * (a() - 1)))');

    const result = classifier.classify(expr);

    expect(result.complexity).toBeGreaterThan(0);
  });
});
