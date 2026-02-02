/**
 * Tests for ConditionalJsxReturnStrategy (S5)
 *
 * Detects components with conditional JSX returns (ternary, if-else, &&, ||)
 *
 * @see conditional-jsx-return-strategy.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { ConditionalJsxReturnStrategy } from '../strategies/conditional-jsx-return-strategy.js';

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

describe('ConditionalJsxReturnStrategy', () => {
  let strategy: InstanceType<typeof ConditionalJsxReturnStrategy>;
  let context: IDetectionContext;

  beforeEach(() => {
    strategy = new ConditionalJsxReturnStrategy();
  });

  describe('construction', () => {
    it('should create strategy with correct name', () => {
      expect(strategy.name).toBe('ConditionalJsxReturnStrategy');
    });

    it('should have priority 2 (high)', () => {
      expect(strategy.priority).toBe(2);
    });

    it('should have all required methods', () => {
      expect(typeof strategy.hasConditionalJsxReturn).toBe('function');
      expect(typeof strategy.detect).toBe('function');
    });
  });

  describe('hasConditionalJsxReturn - Conditional pattern detection', () => {
    it('should detect ternary with JSX', () => {
      const code = `
        function MyComponent({ show }) {
          return show ? <div>Shown</div> : null;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect ternary with JSX on both sides', () => {
      const code = `
        function MyComponent({ variant }) {
          return variant === 'a' ? <div>A</div> : <div>B</div>;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect && operator with JSX', () => {
      const code = `
        function MyComponent({ show }) {
          return show && <div>Content</div>;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect || operator with JSX', () => {
      const code = `
        function MyComponent({ content }) {
          return content || <div>Default</div>;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect if-else with JSX', () => {
      const code = `
        function MyComponent({ show }) {
          if (show) {
            return <div>Shown</div>;
          } else {
            return <div>Hidden</div>;
          }
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect if without else with JSX', () => {
      const code = `
        function MyComponent({ show }) {
          if (show) {
            return <div>Shown</div>;
          }
          return null;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should detect nested ternary with JSX', () => {
      const code = `
        function MyComponent({ state }) {
          return state === 'a' ? <div>A</div> : state === 'b' ? <div>B</div> : <div>C</div>;
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });

    it('should NOT detect non-conditional return', () => {
      const code = `function MyComponent() { return <div>Always</div>; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(false);
    });

    it('should NOT detect conditional without JSX', () => {
      const code = `
        function getData({ useCache }) {
          return useCache ? cache.get() : fetch();
        }
      `;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(false);
    });

    it('should detect arrow function with conditional JSX', () => {
      const code = `const MyComponent = ({ show }) => show ? <div>Yes</div> : null;`;
      const { node } = parseFunction(code);

      expect(strategy.hasConditionalJsxReturn(node)).toBe(true);
    });
  });

  describe('detect - Full detection', () => {
    it('should detect component with ternary JSX', () => {
      const code = `
        function MyComponent({ show }) {
          return show ? <div>Shown</div> : null;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.strategy).toBe('ConditionalJsxReturnStrategy');
      expect(result.reason).toContain('conditional JSX');
      expect(result.componentName).toBe('MyComponent');
    });

    it('should detect component with && operator', () => {
      const code = `
        function MyComponent({ show }) {
          return show && <div>Content</div>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect component with if-else JSX', () => {
      const code = `
        function MyComponent({ show }) {
          if (show) {
            return <div>Yes</div>;
          } else {
            return <div>No</div>;
          }
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should NOT detect non-conditional component', () => {
      const code = `function MyComponent() { return <div>Always</div>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.reason).toContain('No conditional JSX');
    });

    it('should NOT detect conditional without JSX', () => {
      const code = `
        function getData({ useCache }) {
          return useCache ? cache.get() : fetch();
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
    });
  });

  describe('edge cases - Complex conditional patterns', () => {
    it('should detect multiple if-else with JSX', () => {
      const code = `
        function MyComponent({ state }) {
          if (state === 'loading') {
            return <div>Loading...</div>;
          } else if (state === 'error') {
            return <div>Error!</div>;
          } else {
            return <div>Success</div>;
          }
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect switch statement with JSX', () => {
      const code = `
        function MyComponent({ type }) {
          switch (type) {
            case 'button':
              return <button>Click</button>;
            case 'input':
              return <input />;
            default:
              return <div>Default</div>;
          }
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect early return with JSX', () => {
      const code = `
        function MyComponent({ error }) {
          if (error) return <div>Error: {error}</div>;
          return <div>Success</div>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect complex nested conditionals', () => {
      const code = `
        function MyComponent({ a, b }) {
          return a ? (b ? <div>Both</div> : <div>A only</div>) : null;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect JSX in parenthesized conditional', () => {
      const code = `
        function MyComponent({ show }) {
          return (show ? <div>Yes</div> : null);
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });
  });

  describe('performance', () => {
    it('should quickly check conditional patterns', () => {
      const code = `
        function MyComponent({ show }) {
          return show ? <div>Yes</div> : null;
        }
      `;
      const { node } = parseFunction(code);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        strategy.hasConditionalJsxReturn(node);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
