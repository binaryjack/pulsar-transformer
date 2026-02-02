/**
 * Tests for DirectJsxReturnStrategy (S3)
 *
 * Detects components that directly return JSX: return <div>
 *
 * @see direct-jsx-return-strategy.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { DirectJsxReturnStrategy } from '../strategies/direct-jsx-return-strategy.js';

import type { IDetectionContext } from '../component-detector.types.js';

/**
 * Helper: Parse code and get function node
 */
function parseFunction(code: string): {
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
} {
  const sourceFile = ts.createSourceFile(
    'test.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const program = ts.createProgram(
    ['test.tsx'],
    { jsx: ts.JsxEmit.React },
    {
      getSourceFile: (fileName) => (fileName === 'test.tsx' ? sourceFile : undefined),
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => 'lib.d.ts',
    }
  );

  const checker = program.getTypeChecker();

  let functionNode: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined;

  function findFunction(node: ts.Node): void {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      functionNode = node;
      return;
    }
    ts.forEachChild(node, findFunction);
  }

  findFunction(sourceFile);

  if (!functionNode) {
    throw new Error('No function found in code');
  }

  return { node: functionNode, sourceFile, checker };
}

describe('DirectJsxReturnStrategy', () => {
  let strategy: InstanceType<typeof DirectJsxReturnStrategy>;
  let context: IDetectionContext;

  beforeEach(() => {
    strategy = new DirectJsxReturnStrategy();
  });

  describe('construction', () => {
    it('should create strategy with correct name', () => {
      expect(strategy.name).toBe('DirectJsxReturnStrategy');
    });

    it('should have priority 2 (high)', () => {
      expect(strategy.priority).toBe(2);
    });

    it('should have all required methods', () => {
      expect(typeof strategy.hasDirectJsxReturn).toBe('function');
      expect(typeof strategy.detect).toBe('function');
    });
  });

  describe('hasDirectJsxReturn - JSX return detection', () => {
    it('should detect direct JSX element return', () => {
      const code = `function MyButton() { return <button>Click</button>; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should detect self-closing JSX element', () => {
      const code = `function MyInput() { return <input type="text" />; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should detect JSX fragment return', () => {
      const code = `function MyFragment() { return <><div>A</div><div>B</div></>; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should detect arrow function with JSX expression body', () => {
      const code = `const MyButton = () => <button>Click</button>;`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should detect arrow function with block and JSX return', () => {
      const code = `const MyButton = () => { return <button>Click</button>; };`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should detect parenthesized JSX return', () => {
      const code = `
        function MyCard() {
          return (
            <div>
              <h2>Title</h2>
            </div>
          );
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(true);
    });

    it('should NOT detect non-JSX return', () => {
      const code = `function getData() { return 42; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(false);
    });

    it('should NOT detect null return', () => {
      const code = `function getData() { return null; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(false);
    });

    it('should NOT detect no return', () => {
      const code = `function doSomething() { console.log('test'); }`;
      const { node } = parseFunction(code);

      expect(strategy.hasDirectJsxReturn(node)).toBe(false);
    });

    it('should NOT detect variable JSX return', () => {
      const code = `
        function MyButton() {
          const btn = <button>Click</button>;
          return btn;
        }
      `;
      const { node } = parseFunction(code);

      // This pattern should NOT be detected by DirectJsxReturnStrategy
      // It's handled by VariableJsxReturnStrategy
      expect(strategy.hasDirectJsxReturn(node)).toBe(false);
    });
  });

  describe('detect - Full detection', () => {
    it('should detect component with direct JSX return', () => {
      const code = `function MyButton() { return <button>Click</button>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.strategy).toBe('DirectJsxReturnStrategy');
      expect(result.reason).toContain('direct JSX return');
      expect(result.componentName).toBe('MyButton');
    });

    it('should detect arrow component with expression body', () => {
      const code = `const MyButton = () => <button>Click</button>;`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should detect component with JSX fragment', () => {
      const code = `function MyFragment() { return <><div>A</div><div>B</div></>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect component with self-closing JSX', () => {
      const code = `function MyInput() { return <input type="text" />; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should NOT detect non-component function', () => {
      const code = `function getData() { return 42; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('No direct JSX return');
    });

    it('should handle anonymous arrow function', () => {
      const code = `const comp = () => <div>Content</div>;`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBeUndefined();
    });
  });

  describe('edge cases - Complex JSX patterns', () => {
    it('should detect nested JSX return', () => {
      const code = `
        function MyCard() {
          return (
            <div class="card">
              <header>
                <h2>Title</h2>
              </header>
              <main>
                <p>Content</p>
              </main>
            </div>
          );
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect JSX with props', () => {
      const code = `
        function MyButton({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect JSX with spread props', () => {
      const code = `
        function MyButton(props) {
          return <button {...props}>Click</button>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect JSX with children expression', () => {
      const code = `
        function MyComponent({ count }) {
          return <div>Count: {count}</div>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect multiline JSX', () => {
      const code = `
        function MyList() {
          return (
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          );
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });
  });

  describe('performance', () => {
    it('should quickly check direct JSX returns', () => {
      const code = `function MyButton() { return <button>Click</button>; }`;
      const { node } = parseFunction(code);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        strategy.hasDirectJsxReturn(node);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});
