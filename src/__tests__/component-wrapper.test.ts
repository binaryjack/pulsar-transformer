/**
 * Unit tests for component wrapper
 * Tests: Registry wrapping, function/arrow/variable components
 */

import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { createComponentWrapper } from '../wrapper/component-wrapper.js';
import { createTestContext } from './test-helpers.js';

describe('ComponentWrapper', () => {
  function createDeclaration(source: string): IComponentDeclaration {
    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const node = file.statements[0] as ts.FunctionDeclaration;

    return {
      name: node.name!.text,
      node,
      parameters: Array.from(node.parameters),
      returnType: node.type,
      body: node.body ? Array.from(node.body.statements) : [],
    };
  }

  test('wraps simple component', () => {
    const source = `
      function App() {
        return <div>Hello</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('$REGISTRY.execute');
    expect(text).toMatch(/App-[a-f0-9]+/);
  });

  test('generates stable component ID', () => {
    const source = `
      function MyComponent() {
        return <div>Test</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result1 = wrapper.wrapComponent(declaration);
    const result2 = wrapper.wrapComponent(declaration);

    const text1 = result1.getText();
    const text2 = result2.getText();

    // Should generate same ID for same component
    const id1 = text1.match(/MyComponent-([a-f0-9]+)/)?.[1];
    const id2 = text2.match(/MyComponent-([a-f0-9]+)/)?.[1];

    expect(id1).toBe(id2);
  });

  test('wraps component with props', () => {
    const source = `
      interface Props {
        title: string;
        count: number;
      }
      
      function Component(props: Props) {
        return <div>{props.title}: {props.count}</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);

    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const funcNode = file.statements[1] as ts.FunctionDeclaration;

    const declaration: IComponentDeclaration = {
      name: funcNode.name!.text,
      node: funcNode,
      parameters: Array.from(funcNode.parameters),
      returnType: funcNode.type,
      body: funcNode.body ? Array.from(funcNode.body.statements) : [],
    };

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('props');
    expect(text).toContain('$REGISTRY.execute');
  });

  test('preserves component body', () => {
    const source = `
      function Counter() {
        const [count, setCount] = useState(0);
        const increment = () => setCount(count + 1);
        return <button onClick={increment}>{count}</button>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('useState');
    expect(text).toContain('increment');
    expect(text).toContain('setCount');
  });

  test('wraps component with multiple statements', () => {
    const source = `
      function Complex() {
        const a = 1;
        const b = 2;
        const sum = a + b;
        console.log(sum);
        return <div>{sum}</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('const a = 1');
    expect(text).toContain('const b = 2');
    expect(text).toContain('const sum = a + b');
    expect(text).toContain('console.log');
  });

  test('handles component with no return type', () => {
    const source = `
      function NoType() {
        return <div>No Type</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
  });

  test('handles component with explicit return type', () => {
    const source = `
      function Typed(): JSX.Element {
        return <div>Typed</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
  });

  test('creates factory function', () => {
    const source = `
      function App() {
        return <div>App</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('() =>');
    expect(text).toContain('$REGISTRY.execute');
  });

  test('passes props to factory', () => {
    const source = `
      function WithProps(props: { name: string }) {
        return <div>{props.name}</div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);

    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const funcNode = file.statements[0] as ts.FunctionDeclaration;

    const declaration: IComponentDeclaration = {
      name: funcNode.name!.text,
      node: funcNode,
      parameters: Array.from(funcNode.parameters),
      returnType: funcNode.type,
      body: funcNode.body ? Array.from(funcNode.body.statements) : [],
    };

    const result = wrapper.wrapComponent(declaration);

    const text = result.getText();
    expect(text).toContain('props');
  });

  test('handles arrow function component', () => {
    const source = `const Arrow = () => <div>Arrow</div>;`;
    const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);

    const varStatement = file.statements[0] as ts.VariableStatement;
    const varDecl = varStatement.declarationList.declarations[0];

    const declaration: IComponentDeclaration = {
      name: (varDecl.name as ts.Identifier).text,
      node: varDecl,
      parameters: [],
      body: [
        ts.factory.createReturnStatement(
          (varDecl.initializer as ts.ArrowFunction).body as ts.Expression
        ),
      ],
    };

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
    expect(result.getText()).toContain('$REGISTRY.execute');
  });

  test('tracks wrapped components', () => {
    const source1 = `
      function First() {
        return <div>First</div>;
      }
    `;
    const source2 = `
      function Second() {
        return <div>Second</div>;
      }
    `;
    const context = createTestContext(source1);
    const wrapper = createComponentWrapper(context);

    const decl1 = createDeclaration(source1);
    const decl2 = createDeclaration(source2);

    wrapper.wrapComponent(decl1);
    wrapper.wrapComponent(decl2);

    // Context should track both components
    expect(context.components.size).toBeGreaterThanOrEqual(2);
  });

  test('generates different IDs for different components', () => {
    const source1 = `
      function ComponentA() {
        return <div>A</div>;
      }
    `;
    const source2 = `
      function ComponentB() {
        return <div>B</div>;
      }
    `;
    const context = createTestContext(source1);
    const wrapper = createComponentWrapper(context);

    const decl1 = createDeclaration(source1);
    const decl2 = createDeclaration(source2);

    const result1 = wrapper.wrapComponent(decl1);
    const result2 = wrapper.wrapComponent(decl2);

    const text1 = result1.getText();
    const text2 = result2.getText();

    const id1 = text1.match(/ComponentA-([a-f0-9]+)/)?.[1];
    const id2 = text2.match(/ComponentB-([a-f0-9]+)/)?.[1];

    expect(id1).not.toBe(id2);
  });

  test('handles empty component body', () => {
    const source = `
      function Empty() {
        return <div />;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
  });

  test('handles component with JSX fragment', () => {
    const source = `
      function Fragment() {
        return <>
          <div>A</div>
          <div>B</div>
        </>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
    expect(result.getText()).toContain('$REGISTRY.execute');
  });

  test('handles nested component calls', () => {
    const source = `
      function Parent() {
        return <div><Child /></div>;
      }
    `;
    const context = createTestContext(source);
    const wrapper = createComponentWrapper(context);
    const declaration = createDeclaration(source);

    const result = wrapper.wrapComponent(declaration);

    expect(result).toBeDefined();
  });
});
