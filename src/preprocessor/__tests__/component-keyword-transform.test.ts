/**
 * Tests for Component Keyword Preprocessor
 */

import { describe, expect, test } from 'vitest';
import {
  preprocessComponentKeyword,
  preprocessComponentKeywordSafe,
  validateComponentTransform,
} from '../component-keyword-transform.js';

describe('preprocessComponentKeyword', () => {
  test('transforms export component to export function', () => {
    const input = 'export component Counter() {}';
    const output = preprocessComponentKeyword(input);
    expect(output).toBe('export function Counter() {}');
  });

  test('transforms standalone component to function', () => {
    const input = 'component Helper() {}';
    const output = preprocessComponentKeyword(input);
    expect(output).toBe('function Helper() {}');
  });

  test('handles generics', () => {
    const input = 'export component List<T>() {}';
    const output = preprocessComponentKeyword(input);
    expect(output).toBe('export function List<T>() {}');
  });

  test('handles multiple components', () => {
    const input = `
export component Foo() {}
component Bar() {}
export component Baz<T>() {}
    `;
    const output = preprocessComponentKeyword(input);
    expect(output).toContain('export function Foo()');
    expect(output).toContain('function Bar()');
    expect(output).toContain('export function Baz<T>()');
  });

  test('preserves whitespace', () => {
    const input = 'export  component   Foo() {}';
    const output = preprocessComponentKeyword(input);
    // replaceAll will normalize whitespace in the pattern
    expect(output).toMatch(/export function\s+Foo/);
  });
});

describe('preprocessComponentKeywordSafe', () => {
  test('skips component keyword in strings', () => {
    const input = `
const message = "This component is great";
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('"This component is great"');
    expect(output).toContain('export function Counter()');
  });

  test('skips component keyword in line comments', () => {
    const input = `
// This component does X
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('// This component does X');
    expect(output).toContain('export function Counter()');
  });

  test('skips component keyword in block comments', () => {
    const input = `
/* This component does X */
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('/* This component does X */');
    expect(output).toContain('export function Counter()');
  });

  test('handles template literals', () => {
    const input = `
const msg = \`component: \${name}\`;
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('`component: ${name}`');
    expect(output).toContain('export function Counter()');
  });

  test('handles escaped quotes in strings', () => {
    const input = `
const msg = "component\\"test";
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('"component\\"test"');
    expect(output).toContain('export function Counter()');
  });

  test('handles multiline block comments', () => {
    const input = `
/*
 * This component is for:
 * - thing 1
 * - thing 2
 */
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('This component is for');
    expect(output).toContain('export function Counter()');
  });

  test('avoids false positives with subcomponent', () => {
    const input = 'const subcomponent = MyComponent;';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toBe(input); // Should not transform
  });

  test('avoids false positives with componentDidMount', () => {
    const input = 'componentDidMount() {}';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toBe(input); // Should not transform (lowercase after component)
  });

  test('only transforms component followed by uppercase', () => {
    const input = `
const component = { name: 'foo' };
export component Counter() {}
    `;
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('const component = { name:');
    expect(output).toContain('export function Counter()');
  });
});

describe('validateComponentTransform', () => {
  test('returns true when no component keyword remains', () => {
    const source = 'export function Counter() {}';
    expect(validateComponentTransform(source)).toBe(true);
  });

  test('returns false when component keyword remains', () => {
    const source = 'export component Counter() {}';
    expect(validateComponentTransform(source)).toBe(false);
  });

  test('allows component in variable names', () => {
    const source = 'const subcomponent = {};';
    expect(validateComponentTransform(source)).toBe(true);
  });

  test('allows component in method names', () => {
    const source = 'obj.componentDidMount();';
    expect(validateComponentTransform(source)).toBe(true);
  });
});

describe('edge cases', () => {
  test('handles component at start of file', () => {
    const input = 'component Foo() {}';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toBe('function Foo() {}');
  });

  test('handles component at end of file', () => {
    const input = 'const x = 1;\nexport component Foo() {}';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toContain('export function Foo()');
  });

  test('handles empty file', () => {
    const input = '';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toBe('');
  });

  test('handles file with only comments', () => {
    const input = '// component test\n/* component test */';
    const output = preprocessComponentKeywordSafe(input);
    expect(output).toBe(input);
  });

  test('real-world example with mixed content', () => {
    const input = `
import { createSignal } from '@pulsar-framework/pulsar.dev';

/**
 * Counter component with increment/decrement
 * This component demonstrates reactive state
 */
export component Counter() {
  const [count, setCount] = createSignal(0);
  
  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}

// Helper component for display
component Display({ value }: { value: number }) {
  return <span>{value}</span>;
}
    `;

    const output = preprocessComponentKeywordSafe(input);

    // Should transform component declarations
    expect(output).toContain('export function Counter()');
    expect(output).toContain('function Display(');

    // Should preserve comments
    expect(output).toContain('Counter component with increment');
    expect(output).toContain('This component demonstrates');
    expect(output).toContain('// Helper component for display');

    // Should preserve JSX
    expect(output).toContain('<div>');
    expect(output).toContain('<h1>Count: {count()}</h1>');
  });
});
