/**
 * Tests for ReturnTypeStrategy (S2)
 *
 * Detects components by explicit `: HTMLElement` return type
 *
 * @see return-type-strategy.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { ReturnTypeStrategy } from '../strategies/return-type-strategy.js';

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

describe('ReturnTypeStrategy', () => {
  let strategy: InstanceType<typeof ReturnTypeStrategy>;
  let context: IDetectionContext;

  beforeEach(() => {
    strategy = new ReturnTypeStrategy();
  });

  describe('construction', () => {
    it('should create strategy with correct name', () => {
      expect(strategy.name).toBe('ReturnTypeStrategy');
    });

    it('should have priority 1 (highest)', () => {
      expect(strategy.priority).toBe(1);
    });

    it('should have all required methods', () => {
      expect(typeof strategy.hasHtmlElementReturnType).toBe('function');
      expect(typeof strategy.detect).toBe('function');
    });
  });

  describe('hasHtmlElementReturnType - Type detection', () => {
    it('should detect HTMLElement return type', () => {
      const code = `function MyButton(): HTMLElement { return null as any; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should detect Element return type', () => {
      const code = `function MyDiv(): Element { return null as any; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should detect Node return type', () => {
      const code = `function MyComponent(): Node { return null as any; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should detect HTMLElement | null', () => {
      const code = `function MyComponent(): HTMLElement | null { return null; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should detect null | HTMLElement (reverse order)', () => {
      const code = `function MyComponent(): null | HTMLElement { return null; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should NOT detect string return type', () => {
      const code = `function getString(): string { return ''; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(false);
    });

    it('should NOT detect number return type', () => {
      const code = `function getNumber(): number { return 0; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(false);
    });

    it('should NOT detect void return type', () => {
      const code = `function doSomething(): void {}`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(false);
    });

    it('should NOT detect function with no return type', () => {
      const code = `function noType() { return null; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(false);
    });

    it('should handle arrow function with return type', () => {
      const code = `const MyArrow = (): HTMLElement => { return null as any; };`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });

    it('should handle function expression with return type', () => {
      const code = `const MyFunc = function(): Element { return null as any; };`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });
  });

  describe('detect - Full detection', () => {
    it('should detect component with HTMLElement return type', () => {
      const code = `function MyButton(): HTMLElement { return null as any; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.strategy).toBe('ReturnTypeStrategy');
      expect(result.reason).toContain('HTMLElement');
      expect(result.componentName).toBe('MyButton');
    });

    it('should detect component with Element return type', () => {
      const code = `function MyDiv(): Element { return null as any; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.reason).toContain('Element');
    });

    it('should detect component with Node return type', () => {
      const code = `function MyNode(): Node { return null as any; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.reason).toContain('Node');
    });

    it('should detect component with nullable return type', () => {
      const code = `function MyComponent(): HTMLElement | null { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should NOT detect non-component with wrong return type', () => {
      const code = `function getString(): string { return ''; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('No HTMLElement return type');
    });

    it('should NOT detect function with no return type', () => {
      const code = `function noType() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
    });

    it('should detect arrow function component', () => {
      const code = `const MyArrow = (): HTMLElement => { return null as any; };`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should detect function expression component', () => {
      const code = `const MyFunc = function(): Element { return null as any; };`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should handle anonymous function with return type', () => {
      const code = `const comp = function(): HTMLElement { return null as any; };`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle complex union types with HTMLElement', () => {
      const code = `function MyComponent(): HTMLElement | null | undefined { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should NOT detect HTMLElement in object type', () => {
      const code = `function getData(): { element: HTMLElement } { return null as any; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
    });

    it('should handle whitespace in return type', () => {
      const code = `function MyComponent():   HTMLElement   { return null as any; }`;
      const { node } = parseFunction(code);

      expect(strategy.hasHtmlElementReturnType(node)).toBe(true);
    });
  });

  describe('performance', () => {
    it('should quickly check return types', () => {
      const code = `function MyComponent(): HTMLElement { return null as any; }`;
      const { node } = parseFunction(code);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        strategy.hasHtmlElementReturnType(node);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});
