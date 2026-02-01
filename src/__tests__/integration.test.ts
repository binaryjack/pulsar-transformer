/**
 * Integration tests for complete transformer
 * Tests: signal interpolation, child components, control flow, events
 */

import { describe, expect, test } from 'vitest';
import pulsarTransformer from '../index.js';
import { transformSource as transform } from './test-helpers.js';

describe('Transformer Integration', () => {
  function transformCode(source: string): string {
    return transform(source, pulsarTransformer);
  }

  test('transforms simple JSX with text', () => {
    const source = `
      function App() {
        return <div>Hello World</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toContain('document.createElement');
    expect(output).toContain('textContent');
  });

  test('transforms signal interpolation', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      
      function Counter() {
        const [count, setCount] = createSignal(0);
        return <div>{count()}</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toContain('$REGISTRY.wire');
    expect(output).toContain('() => count()');
  });

  test('transforms event handlers', () => {
    const source = `
      function Button() {
        const handleClick = () => console.log('clicked');
        return <button onClick={handleClick}>Click</button>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('addEventListener');
    expect(output).toContain('click');
    expect(output).toContain('handleClick');
  });

  test('transforms child components', () => {
    const source = `
      function Child() {
        return <span>Child</span>;
      }
      
      function Parent() {
        return <div><Child /></div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toMatch(/Child-[a-f0-9]+/); // Component ID
  });

  test('transforms attributes', () => {
    const source = `
      function Input() {
        return <input type="text" placeholder="Enter text" disabled />;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('setAttribute("type", "text")');
    expect(output).toContain('setAttribute("placeholder", "Enter text")');
    expect(output).toContain('disabled = true');
  });

  test('transforms dynamic attributes', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      
      function Input() {
        const [value, setValue] = createSignal('');
        return <input value={value()} />;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.wire');
    expect(output).toContain('() => value()');
  });

  test('transforms fragments', () => {
    const source = `
      function List() {
        return <>
          <li>Item 1</li>
          <li>Item 2</li>
        </>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('document.createDocumentFragment');
  });

  test('transforms className to class', () => {
    const source = `
      function Styled() {
        return <div className="container">Content</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('setAttribute("class", "container")');
    expect(output).not.toContain('className');
  });

  test('transforms multiple children', () => {
    const source = `
      function Parent() {
        return <div>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toMatch(/appendChild/g);
  });

  test('transforms nested components', () => {
    const source = `
      function GrandChild() {
        return <span>GC</span>;
      }
      
      function Child() {
        return <div><GrandChild /></div>;
      }
      
      function Parent() {
        return <section><Child /></section>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('GrandChild');
    expect(output).toContain('Child');
    expect(output).toContain('Parent');
  });

  test('transforms complex signal expressions', () => {
    const source = `
      import { createSignal, createMemo } from '@pulsar/core';
      
      function Complex() {
        const [a, setA] = createSignal(1);
        const [b, setB] = createSignal(2);
        const sum = createMemo(() => a() + b());
        
        return <div>{sum()} = {a()} + {b()}</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.wire');
    expect(output).toMatch(/\$REGISTRY\.wire.*sum\(\)/);
    expect(output).toMatch(/\$REGISTRY\.wire.*a\(\)/);
    expect(output).toMatch(/\$REGISTRY\.wire.*b\(\)/);
  });

  test('transforms mixed static and dynamic content', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      
      function Mixed() {
        const [name, setName] = createSignal('World');
        return <div>Hello {name()}, welcome!</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('Hello ');
    expect(output).toContain(', welcome!');
    expect(output).toContain('$REGISTRY.wire');
  });

  test('transforms arrow function components', () => {
    const source = `
      const Arrow = () => {
        return <div>Arrow</div>;
      };
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toContain('Arrow');
  });

  test('transforms component with props', () => {
    const source = `
      interface Props {
        title: string;
        count: number;
      }
      
      function Component(props: Props) {
        return <div>{props.title}: {props.count}</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toContain('props');
  });

  test('handles empty components', () => {
    const source = `
      function Empty() {
        return <div />;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
    expect(output).toContain('document.createElement("div")');
  });

  test('handles deeply nested JSX', () => {
    const source = `
      function Deep() {
        return (
          <div>
            <section>
              <article>
                <header>
                  <h1>Title</h1>
                </header>
              </article>
            </section>
          </div>
        );
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('document.createElement("div")');
    expect(output).toContain('document.createElement("section")');
    expect(output).toContain('document.createElement("article")');
    expect(output).toContain('document.createElement("header")');
    expect(output).toContain('document.createElement("h1")');
  });

  test('transforms boolean attributes correctly', () => {
    const source = `
      function BoolAttrs() {
        return <input disabled checked required />;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('disabled = true');
    expect(output).toContain('checked = true');
    expect(output).toContain('required = true');
  });

  test('transforms style attribute', () => {
    const source = `
      function Styled() {
        return <div style={{ color: 'red', fontSize: '16px' }}>Styled</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('style');
    expect(output).toContain('color');
    expect(output).toContain('red');
  });

  test('transforms spread props', () => {
    const source = `
      function Spread(props: any) {
        return <div {...props}>Content</div>;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('Object.entries');
    expect(output).toContain('setAttribute');
  });

  test('handles components returning null', () => {
    const source = `
      function MaybeNull(props: { show: boolean }) {
        return props.show ? <div>Visible</div> : null;
      }
    `;

    const output = transformCode(source);

    expect(output).toContain('$REGISTRY.execute');
  });

  test('no transformation for non-JSX functions', () => {
    const source = `
      function notAComponent() {
        return 42;
      }
      
      function alsoNot() {
        const x = 10;
        return x * 2;
      }
    `;

    const output = transformCode(source);

    expect(output).not.toContain('$REGISTRY.execute');
    expect(output).not.toContain('$REGISTRY.wire');
  });
});
