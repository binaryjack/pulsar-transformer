/**
 * Unit tests for element generator
 * Tests: elements, fragments, components, attributes, children
 */

import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { createElementGenerator } from '../generator/element-generator.js';
import { createTestContext } from './test-helpers.js';

describe('ElementGenerator', () => {
  function getJsxElement(source: string): ts.JsxElement | ts.JsxSelfClosingElement {
    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const statement = file.statements[0] as ts.ExpressionStatement;
    return statement.expression as any;
  }

  test('generates simple div element', () => {
    const context = createTestContext('<div />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div />');

    const result = generator.generateElement(jsx);

    expect(result.tagName).toBe('div');
    expect(result.variableName).toMatch(/^el\d+$/);
    expect(result.statements.length).toBeGreaterThan(0);
  });

  test('generates element with text content', () => {
    const context = createTestContext('<div>Hello</div>');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div>Hello</div>');

    const result = generator.generateElement(jsx);

    expect(result.tagName).toBe('div');
    // Should have textContent assignment
    expect(result.statements.some((s) => s.getText().includes('textContent'))).toBe(true);
  });

  test('generates element with static attributes', () => {
    const context = createTestContext('<input type="text" placeholder="Enter" />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<input type="text" placeholder="Enter" />');

    const result = generator.generateElement(jsx);

    expect(result.attributes.length).toBeGreaterThanOrEqual(2);
    expect(result.attributes.some((a) => a.name === 'type')).toBe(true);
    expect(result.attributes.some((a) => a.name === 'placeholder')).toBe(true);
  });

  test('generates element with dynamic attribute', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [value] = createSignal('test');
      <input value={value()} />;
    `;
    const context = createTestContext(source);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<input value={value()} />');

    const result = generator.generateElement(jsx);

    // Should have wire for dynamic value
    expect(result.wires.length).toBeGreaterThan(0);
    expect(result.wires[0].property).toBe('value');
  });

  test('generates element with event handler', () => {
    const context = createTestContext('<button onClick={() => {}} />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<button onClick={() => {}} />');

    const result = generator.generateElement(jsx);

    expect(result.events.length).toBe(1);
    expect(result.events[0].eventName).toBe('click');
  });

  test('generates element with boolean attribute', () => {
    const context = createTestContext('<input disabled />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<input disabled />');

    const result = generator.generateElement(jsx);

    expect(result.attributes.some((a) => a.name === 'disabled')).toBe(true);
  });

  test('generates element with className', () => {
    const context = createTestContext('<div className="container" />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div className="container" />');

    const result = generator.generateElement(jsx);

    // className should be converted to class
    expect(result.attributes.some((a) => a.name === 'class')).toBe(true);
  });

  test('generates element with multiple children', () => {
    const context = createTestContext(`
      <div>
        <span>First</span>
        <span>Second</span>
      </div>
    `);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement(`
      <div>
        <span>First</span>
        <span>Second</span>
      </div>
    `);

    const result = generator.generateElement(jsx);

    expect(result.children.length).toBeGreaterThanOrEqual(2);
  });

  test('generates child component', () => {
    const context = createTestContext('<MyComponent />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<MyComponent />');

    const result = generator.generateElement(jsx);

    expect(result.isComponent).toBe(true);
    expect(result.componentId).toMatch(/MyComponent-[a-f0-9]+/);
  });

  test('generates fragment', () => {
    const source = `
      <>
        <div>A</div>
        <div>B</div>
      </>
    `;
    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const context = createTestContext(source);
    const generator = createElementGenerator(context);

    const statement = file.statements[0] as ts.ExpressionStatement;
    const fragment = statement.expression as ts.JsxFragment;

    const result = generator.generateFragment(fragment);

    expect(result.variableName).toMatch(/^frag\d+$/);
    expect(result.children.length).toBeGreaterThanOrEqual(2);
  });

  test('generates element with spread props', () => {
    const context = createTestContext('<div {...props} />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div {...props} />');

    const result = generator.generateElement(jsx);

    // Should handle spread attributes
    expect(result.hasSpread).toBe(true);
  });

  test('generates nested elements', () => {
    const context = createTestContext(`
      <div>
        <section>
          <article>Text</article>
        </section>
      </div>
    `);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement(`
      <div>
        <section>
          <article>Text</article>
        </section>
      </div>
    `);

    const result = generator.generateElement(jsx);

    expect(result.tagName).toBe('div');
    expect(result.children.length).toBeGreaterThan(0);
  });

  test('handles empty element', () => {
    const context = createTestContext('<div />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div />');

    const result = generator.generateElement(jsx);

    expect(result.tagName).toBe('div');
    expect(result.children.length).toBe(0);
  });

  test('handles element with mixed static and dynamic children', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      const [name] = createSignal('World');
      <div>Hello {name()}, welcome!</div>;
    `;
    const context = createTestContext(source);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div>Hello {name()}, welcome!</div>');

    const result = generator.generateElement(jsx);

    expect(result.children.length).toBeGreaterThan(0);
    // Should have wires for dynamic content
    expect(result.wires.length).toBeGreaterThan(0);
  });

  test('generates unique variable names', () => {
    const context = createTestContext('<div />');
    const generator = createElementGenerator(context);

    const jsx1 = getJsxElement('<div />');
    const jsx2 = getJsxElement('<div />');

    const result1 = generator.generateElement(jsx1);
    const result2 = generator.generateElement(jsx2);

    expect(result1.variableName).not.toBe(result2.variableName);
  });

  test('generates component with props', () => {
    const context = createTestContext('<MyComponent title="Test" count={42} />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<MyComponent title="Test" count={42} />');

    const result = generator.generateElement(jsx);

    expect(result.isComponent).toBe(true);
    expect(result.props).toBeDefined();
  });

  test('handles style attribute', () => {
    const context = createTestContext('<div style={{ color: "red" }} />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div style={{ color: "red" }} />');

    const result = generator.generateElement(jsx);

    expect(result.attributes.some((a) => a.name === 'style')).toBe(true);
  });

  test('handles ref attribute', () => {
    const context = createTestContext('<input ref={inputRef} />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<input ref={inputRef} />');

    const result = generator.generateElement(jsx);

    // ref should be handled specially
    expect(result.hasRef).toBe(true);
  });

  test('handles key attribute', () => {
    const context = createTestContext('<div key="unique-key" />');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div key="unique-key" />');

    const result = generator.generateElement(jsx);

    // key should be tracked
    expect(result.key).toBeDefined();
  });

  test('generates element with expression child', () => {
    const source = `
      const value = 42;
      <div>{value}</div>;
    `;
    const context = createTestContext(source);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div>{value}</div>');

    const result = generator.generateElement(jsx);

    expect(result.children.length).toBeGreaterThan(0);
  });

  test('handles null/undefined children', () => {
    const context = createTestContext('<div>{null}{undefined}</div>');
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div>{null}{undefined}</div>');

    const result = generator.generateElement(jsx);

    // Null/undefined children should be filtered
    expect(result.children.every((c) => c.isNullable === false || c.isNullable === undefined)).toBe(
      true
    );
  });

  test('handles conditional child', () => {
    const source = `
      const show = true;
      <div>{show ? 'visible' : null}</div>;
    `;
    const context = createTestContext(source);
    const generator = createElementGenerator(context);
    const jsx = getJsxElement('<div>{show ? "visible" : null}</div>');

    const result = generator.generateElement(jsx);

    expect(result.children.length).toBeGreaterThan(0);
  });
});
