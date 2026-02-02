/**
 * Tests for PascalCaseStrategy (S1)
 *
 * Detects components by naming convention (PascalCase)
 *
 * @see pascal-case-strategy.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { PascalCaseStrategy } from '../strategies/pascal-case-strategy.js';

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

describe('PascalCaseStrategy', () => {
  let strategy: InstanceType<typeof PascalCaseStrategy>;
  let context: IDetectionContext;

  beforeEach(() => {
    strategy = new PascalCaseStrategy();
  });

  describe('construction', () => {
    it('should create strategy with correct name', () => {
      expect(strategy.name).toBe('PascalCaseStrategy');
    });

    it('should have priority 3 (medium)', () => {
      expect(strategy.priority).toBe(3);
    });

    it('should have all required methods', () => {
      expect(typeof strategy.isPascalCase).toBe('function');
      expect(typeof strategy.detect).toBe('function');
    });
  });

  describe('isPascalCase - Name validation', () => {
    it('should detect valid PascalCase names', () => {
      expect(strategy.isPascalCase('MyComponent')).toBe(true);
      expect(strategy.isPascalCase('Button')).toBe(true);
      expect(strategy.isPascalCase('UserProfile')).toBe(true);
      expect(strategy.isPascalCase('HTTPClient')).toBe(true);
      expect(strategy.isPascalCase('A')).toBe(true);
    });

    it('should reject camelCase names', () => {
      expect(strategy.isPascalCase('myComponent')).toBe(false);
      expect(strategy.isPascalCase('button')).toBe(false);
      expect(strategy.isPascalCase('userProfile')).toBe(false);
    });

    it('should reject snake_case names', () => {
      expect(strategy.isPascalCase('my_component')).toBe(false);
      expect(strategy.isPascalCase('user_profile')).toBe(false);
    });

    it('should reject kebab-case names', () => {
      expect(strategy.isPascalCase('my-component')).toBe(false);
      expect(strategy.isPascalCase('user-profile')).toBe(false);
    });

    it('should reject SCREAMING_CASE names', () => {
      expect(strategy.isPascalCase('MY_COMPONENT')).toBe(false);
      expect(strategy.isPascalCase('USER_PROFILE')).toBe(false);
    });

    it('should reject names starting with underscore', () => {
      expect(strategy.isPascalCase('_Component')).toBe(false);
      expect(strategy.isPascalCase('_myComponent')).toBe(false);
    });

    it('should reject names starting with number', () => {
      expect(strategy.isPascalCase('1Component')).toBe(false);
      expect(strategy.isPascalCase('2Button')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(strategy.isPascalCase('')).toBe(false);
    });
  });

  describe('detect - Component detection by name', () => {
    it('should detect function declaration with PascalCase', () => {
      const code = `function MyButton() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('medium');
      expect(result.strategy).toBe('PascalCaseStrategy');
      expect(result.reason).toContain('PascalCase naming');
      expect(result.componentName).toBe('MyButton');
    });

    it('should NOT detect function with camelCase', () => {
      const code = `function myButton() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.reason).toContain('not PascalCase');
    });

    it('should handle anonymous function expression', () => {
      const code = `const comp = function() { return null; };`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
      expect(result.reason).toContain('No function name');
    });

    it('should handle anonymous arrow function', () => {
      const code = `const comp = () => null;`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(false);
    });

    it('should detect single-letter PascalCase', () => {
      const code = `function A() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBe('A');
    });

    it('should detect multi-word PascalCase', () => {
      const code = `function MyUserProfileCard() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBe('MyUserProfileCard');
    });

    it('should detect common component names', () => {
      const names = ['Button', 'Card', 'Modal', 'Header', 'Footer', 'Nav', 'List', 'Item'];

      names.forEach((name) => {
        const code = `function ${name}() { return null; }`;
        const { node, sourceFile, checker } = parseFunction(code);
        context = { sourceFile, checker };

        const result = strategy.detect(node, context);

        expect(result.isComponent).toBe(true);
        expect(result.componentName).toBe(name);
      });
    });

    it('should NOT detect utility functions', () => {
      const names = ['getData', 'processInput', 'formatDate', 'validateEmail'];

      names.forEach((name) => {
        const code = `function ${name}() { return null; }`;
        const { node, sourceFile, checker } = parseFunction(code);
        context = { sourceFile, checker };

        const result = strategy.detect(node, context);

        expect(result.isComponent).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle acronyms in names', () => {
      const code = `function HTTPClient() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should handle numbers in name (after first char)', () => {
      const code = `function Button2() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      context = { sourceFile, checker };

      const result = strategy.detect(node, context);

      expect(result.isComponent).toBe(true);
    });

    it('should reject name starting with number', () => {
      const code = `function 2Button() { return null; }`;
      // This will fail to parse, but test our validation
      expect(strategy.isPascalCase('2Button')).toBe(false);
    });
  });

  describe('performance', () => {
    it('should quickly validate 1000 names', () => {
      const names = Array.from({ length: 1000 }, (_, i) => `Component${i}`);

      const start = performance.now();
      names.forEach((name) => strategy.isPascalCase(name));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Very fast operation
    });
  });
});
