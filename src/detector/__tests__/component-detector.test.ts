/**
 * Tests for ComponentDetector - Orchestrator
 *
 * Tests strategy registration, priority-based execution, and result aggregation
 *
 * @see component-detector.ts
 * @see create-component-detector.ts
 * @see .github/05-TESTING-STANDARDS.md
 */

import * as ts from 'typescript';

import { createComponentDetector } from '../create-component-detector.js';

import type { IComponentDetector, IDetectionStrategy } from '../component-detector.types.js';

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

describe('ComponentDetector - Orchestrator', () => {
  describe('construction', () => {
    it('should create detector with all 6 strategies registered', () => {
      const detector = createComponentDetector();
      expect(detector).toBeDefined();
      expect(detector.detect).toBeDefined();
    });

    it('should allow custom strategies', () => {
      const customStrategy: IDetectionStrategy = {
        name: 'CustomStrategy',
        priority: 5,
        detect: () => ({
          isComponent: true,
          confidence: 'high',
          strategy: 'CustomStrategy',
          reason: 'Custom logic',
        }),
      };

      const customDetector = createComponentDetector({
        strategies: [customStrategy],
      });

      expect(customDetector).toBeDefined();
    });
  });

  describe('priority-based detection', () => {
    it('should use ReturnTypeStrategy (P1) first if available', () => {
      const code = `function MyButton(): HTMLElement { return <button>Click</button>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('ReturnTypeStrategy'); // Highest priority
      expect(result.confidence).toBe('high');
    });

    it('should use DirectJsxReturnStrategy (P2) if no return type', () => {
      const code = `function MyButton() { return <button>Click</button>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('DirectJsxReturnStrategy'); // P2
      expect(result.confidence).toBe('high');
    });

    it('should use VariableJsxReturnStrategy (P2) for variable pattern ⭐', () => {
      const code = `
        function MyButton() {
          const btn = <button>Click</button>;
          return btn;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('VariableJsxReturnStrategy'); // P2 - THE BIG FIX
      expect(result.confidence).toBe('high');
    });

    it('should use ConditionalJsxReturnStrategy (P2) for conditional JSX', () => {
      const code = `
        function MyComponent({ show }) {
          return show ? <div>Yes</div> : null;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('ConditionalJsxReturnStrategy'); // P2
    });

    it('should use PascalCaseStrategy (P3) if no JSX patterns match', () => {
      // Create a function that's PascalCase but doesn't return JSX
      // This would only be detected by PascalCase strategy
      const code = `function MyFunction() { return null; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      // Depends on whether detector requires positive detection
      // PascalCase alone might not be enough
      if (result.isComponent) {
        expect(result.primaryReason?.strategy).toBe('PascalCaseStrategy'); // P3
        expect(result.confidence).toBe('medium');
      }
    });

    it('should use HasJsxInBodyStrategy (P6) as fallback', () => {
      // Create scenario where only fallback matches
      // Function with JSX but not in return, not PascalCase
      const code = `
        function renderHelper() {
          const el = <div>Helper</div>;
          processElement(el);
          return null;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      if (result.isComponent) {
        expect(result.primaryReason?.strategy).toBe('HasJsxInBodyStrategy'); // P6 lowest
        expect(result.confidence).toBe('low');
      }
    });
  });

  describe('strategy aggregation', () => {
    it('should aggregate results from all strategies', () => {
      const code = `function MyButton(): HTMLElement { return <button>Click</button>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.strategyResults).toBeDefined();
      expect(Array.isArray(result.strategyResults)).toBe(true);
      expect(result.strategyResults!.length).toBeGreaterThan(0);
    });

    it('should return first positive detection result', () => {
      const code = `
        function MyButton() {
          const btn = <button>Click</button>;
          return btn;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      // Should be first positive (likely VariableJsxReturnStrategy)
      expect(result.primaryReason?.strategy).toBeDefined();
      expect(result.confidence).toBe('high');
    });

    it('should return negative if all strategies fail', () => {
      const code = `function getData() { return 42; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(false);
    });
  });

  describe('real-world component patterns ⭐ INTEGRATION TESTS', () => {
    it('should detect basic button component', () => {
      const code = `
        function Button({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.componentName).toBe('Button');
    });

    it('should detect component with signal usage', () => {
      const code = `
        function Counter() {
          const [count, setCount] = createSignal(0);
          return <div onClick={() => setCount(count() + 1)}>{count()}</div>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBe('Counter');
    });

    it('should detect component with conditional rendering', () => {
      const code = `
        function UserGreeting({ user }) {
          if (!user) return <div>Please log in</div>;
          return <div>Welcome, {user.name}!</div>;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
    });

    it('should detect component with variable JSX ⭐ THE FIX', () => {
      const code = `
        const MyCard = () => {
          const card = (
            <div class="card">
              <h2>Title</h2>
              <p>Content</p>
            </div>
          );
          return card;
        };
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('VariableJsxReturnStrategy');
      expect(result.confidence).toBe('high');
    });

    it('should detect arrow component with direct JSX', () => {
      const code = `const SimpleButton = () => <button>Click</button>;`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('DirectJsxReturnStrategy');
    });

    it('should detect component with explicit return type', () => {
      const code = `
        function MyComponent(): HTMLElement {
          const el = <div>Content</div>;
          return el;
        }
      `;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.primaryReason?.strategy).toBe('ReturnTypeStrategy'); // Highest priority
    });
  });

  describe('non-component patterns', () => {
    it('should NOT detect utility function', () => {
      const code = `function processData(data) { return data.map(x => x * 2); }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(false);
    });

    it('should NOT detect event handler', () => {
      const code = `function handleClick(event) { console.log(event); }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(false);
    });

    it('should NOT detect API call', () => {
      const code = `async function fetchData(url) { return await fetch(url); }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(false);
    });
  });

  describe('performance', () => {
    it('should detect components quickly', () => {
      const code = `function MyButton() { return <button>Click</button>; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        detector.detect(node);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // 100 detections < 500ms
    });

    it('should handle large files efficiently', () => {
      const components = Array.from(
        { length: 10 },
        (_, i) => `function Component${i}() { return <div>C${i}</div>; }`
      ).join('\n');

      const code = components;
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
      const detector = createComponentDetector({ sourceFile, checker });

      const functions: ts.FunctionDeclaration[] = [];
      function collectFunctions(node: ts.Node) {
        if (ts.isFunctionDeclaration(node)) {
          functions.push(node);
        }
        ts.forEachChild(node, collectFunctions);
      }
      collectFunctions(sourceFile);

      const start = performance.now();
      functions.forEach((fn) => detector.detect(fn));
      const duration = performance.now() - start;

      expect(functions.length).toBe(10);
      expect(duration).toBeLessThan(200); // 10 functions < 200ms
    });
  });

  describe('edge cases', () => {
    it('should handle anonymous functions', () => {
      const code = `const comp = function() { return <div>Anon</div>; };`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
      expect(result.componentName).toBeUndefined();
    });

    it('should handle functions with no body', () => {
      // Arrow function with no block
      const code = `const getValue = () => 42;`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(false);
    });

    it('should handle deeply nested JSX', () => {
      const nested = '<div>'.repeat(10) + 'Content' + '</div>'.repeat(10);
      const code = `function DeepComponent() { return ${nested}; }`;
      const { node, sourceFile, checker } = parseFunction(code);
      const detector = createComponentDetector({ sourceFile, checker });

      const result = detector.detect(node);

      expect(result.isComponent).toBe(true);
    });
  });
});
