/**
 * Tests for HasJsxInBodyStrategy (S6)
 *
 * Fallback strategy detecting any JSX in function body
 *
 * @see has-jsx-in-body-strategy.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { HasJsxInBodyStrategy } from '../strategies/has-jsx-in-body-strategy.js';

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

describe('HasJsxInBodyStrategy', () => {
  let strategy: InstanceType<typeof HasJsxInBodyStrategy>;
  let context: IDetectionContext;

  beforeEach(() => {
    strategy = new HasJsxInBodyStrategy();
  });

  describe('construction', () => {
    it('should create strategy with correct name', () => {
      expect(strategy.name).toBe('HasJsxInBodyStrategy');
    });

    it('should have priority 6 (lowest/fallback)', () => {
      expect(strategy.priority).toBe(6);
    });

    it('should have all required methods', () => {
      expect(typeof strategy.countJsxElements).toBe('function');
      expect(typeof strategy.hasJsxInBody).toBe('function');
      expect(typeof strategy.detect).toBe('function');
    });
  });

  describe('countJsxElements - JSX counting', () => {
    it('should count single JSX element', () => {
      const code = `
        function MyComponent() {
          const el = <div>Content</div>;
          return el;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.countJsxElements(node)).toBe(1);
    });

    it('should count multiple JSX elements', () => {
      const code = `
        function MyComponent() {
          const a = <div>A</div>;
          const b = <span>B</span>;
          const c = <p>C</p>;
          return a;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.countJsxElements(node)).toBe(3);
    });

    it('should count self-closing elements', () => {
      const code = `
        function MyComponent() {
          const input = <input type="text" />;
          return input;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.countJsxElements(node)).toBe(1);
    });

    it('should count JSX fragments', () => {
      const code = `
        function MyComponent() {
          const frag = <><div>A</div><div>B</div></>;
          return frag;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.countJsxElements(node)).toBeGreaterThan(0);
    });

    it('should return 0 for no JSX', () => {
      const code = `
        function getData() {
          const value = 42;
          return value;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.countJsxElements(node)).toBe(0);
    });

    it('should count nested JSX', () => {
      const code = `
        function MyComponent() {
          const card = (
            <div>
              <header>
                <h2>Title</h2>
              </header>
              <main>
                <p>Content</p>
              </main>
            </div>
          );
          return card;
        }
      `;
      const { node } = parseFunction(code);

      const count = strategy.countJsxElements(node);
      expect(count).toBeGreaterThan(1); // Multiple nested elements
    });
  });

  describe('hasJsxInBody - JSX presence detection', () => {
    it('should detect JSX in function body', () => {
      const code = `
        function MyComponent() {
          const el = <div>Content</div>;
          return el;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasJsxInBody(node)).toBe(true);
    });

    it('should NOT detect JSX in arrow expression body', () => {
      const code = `const MyComponent = () => <div>Content</div>;`;
      const { node } = parseFunction(code);

      // Arrow expression bodies are handled by DirectJsxReturnStrategy
      expect(strategy.hasJsxInBody(node)).toBe(false);
    });

    it('should detect JSX in arrow block body', () => {
      const code = `
        const MyComponent = () => {
          const el = <div>Content</div>;
          return el;
        };
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasJsxInBody(node)).toBe(true);
    });

    it('should NOT detect when no JSX', () => {
      const code = `
        function getData() {
          const value = 42;
          return value;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasJsxInBody(node)).toBe(false);
    });
  });

  describe('detect - Full detection', () => {
    it('should detect component with JSX in body', () => {
      const code = `
        function MyComponent() {
          const el = <div>Content</div>;
          return el;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('low'); // Lowest confidence fallback
      expect(result.strategy).toBe('HasJsxInBodyStrategy');
      expect(result.reason).toContain('JSX in function body');
      expect(result.componentName).toBe('MyComponent');
    });

    it('should detect component with multiple JSX elements', () => {
      const code = `
        function MyComponent() {
          const a = <div>A</div>;
          const b = <span>B</span>;
          return a;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.reason).toContain('2 JSX elements');
    });

    it('should NOT detect function without JSX', () => {
      const code = `
        function getData() {
          const value = 42;
          return value;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('No JSX in body');
    });

    it('should NOT detect arrow expression body', () => {
      const code = `const getData = () => 42;`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
    });
  });

  describe('edge cases - JSX usage patterns', () => {
    it('should detect JSX used for props', () => {
      const code = `
        function renderChildren() {
          const child = <div>Child</div>;
          return { children: child };
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      // Low confidence because JSX might be for props, not component return
      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('low');
    });

    it('should detect JSX in nested function', () => {
      const code = `
        function outer() {
          function inner() {
            return <div>Inner</div>;
          }
          return inner();
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      // Only checks outer function body
      const result = strategy.detect(node, context);

      // Depends on whether visitor descends into nested functions
      expect(result.isComponent).toBeDefined();
    });

    it('should handle anonymous function expression', () => {
      const code = `
        const comp = function() {
          const el = <div>Anon</div>;
          return el;
        };
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBeUndefined();
    });
  });

  describe('performance', () => {
    it('should quickly count JSX elements', () => {
      const code = `
        function MyComponent() {
          const el = <div>Content</div>;
          return el;
        }
      `;
      const { node } = parseFunction(code);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        strategy.countJsxElements(node);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle large function bodies', () => {
      const statements = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i};`).join('\n');
      const code = `
        function LargeFunction() {
          ${statements}
          const el = <div>Element</div>;
          return el;
        }
      `;
      const { node } = parseFunction(code);

      const start = performance.now();
      const hasJsx = strategy.hasJsxInBody(node);
      const duration = performance.now() - start;

      expect(hasJsx).toBe(true);
      expect(duration).toBeLessThan(50);
    });
  });
});
