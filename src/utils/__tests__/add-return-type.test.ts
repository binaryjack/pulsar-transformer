/**
 * add-return-type.test.ts
 * Tests for auto-return-type utility
 *
 * @see docs/architecture/transformation-issues/agents/auto-return-type-agent.md
 * @see .github/05-TESTING-STANDARDS.md - Testing requirements
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { addReturnTypeIfMissing, analyzeReturnType, isAsyncFunction } from '../add-return-type';

/**
 * Helper to create a TypeScript source file from code
 */
function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
}

/**
 * Helper to find first function declaration in source
 */
function findFirstFunction(sourceFile: ts.SourceFile): ts.FunctionDeclaration {
  let found: ts.FunctionDeclaration | undefined;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node)) {
      found = node;
    }
  });

  if (!found) {
    throw new Error('No function declaration found');
  }

  return found;
}

/**
 * Helper to find first arrow function in source
 */
function findFirstArrowFunction(sourceFile: ts.SourceFile): ts.ArrowFunction {
  let found: ts.ArrowFunction | undefined;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl && decl.initializer && ts.isArrowFunction(decl.initializer)) {
        found = decl.initializer;
      }
    }
  });

  if (!found) {
    throw new Error('No arrow function found');
  }

  return found;
}

/**
 * Helper to verify type reference node is HTMLElement
 */
function expectHTMLElementType(typeNode: ts.TypeNode, expectedType: string = 'HTMLElement'): void {
  expect(ts.isTypeReferenceNode(typeNode)).toBe(true);
  const typeRef = typeNode as ts.TypeReferenceNode;
  expect(ts.isIdentifier(typeRef.typeName)).toBe(true);
  const ident = typeRef.typeName as ts.Identifier;
  expect(ident.text).toBe(expectedType);
}

describe('analyzeReturnType', () => {
  it('should detect missing return type', () => {
    const code = `function test() { return document.createElement('div'); }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    const analysis = analyzeReturnType(func);

    expect(analysis.hasReturnType).toBe(false);
    expect(analysis.isCorrectType).toBe(false);
    expect(analysis.existingType).toBeUndefined();
    expect(analysis.warning).toBeUndefined();
  });

  it('should detect correct HTMLElement return type', () => {
    const code = `function test(): HTMLElement { return document.createElement('div'); }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    const analysis = analyzeReturnType(func);

    expect(analysis.hasReturnType).toBe(true);
    expect(analysis.isCorrectType).toBe(true);
    expect(analysis.existingType).toBe('HTMLElement');
    expect(analysis.warning).toBeUndefined();
  });

  it('should detect incorrect Element return type', () => {
    const code = `function test(): Element { return document.createElement('div'); }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    const analysis = analyzeReturnType(func);

    expect(analysis.hasReturnType).toBe(true);
    expect(analysis.isCorrectType).toBe(false);
    expect(analysis.existingType).toBe('Element');
    expect(analysis.warning).toBe("Component has return type 'Element', expected 'HTMLElement'");
  });

  it('should work with custom target type', () => {
    const code = `function test(): Node { return document.createElement('div'); }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    const analysis = analyzeReturnType(func, 'Node');

    expect(analysis.hasReturnType).toBe(true);
    expect(analysis.isCorrectType).toBe(true);
    expect(analysis.existingType).toBe('Node');
    expect(analysis.warning).toBeUndefined();
  });
});

describe('isAsyncFunction', () => {
  it('should detect async function declaration', () => {
    const code = `async function test() { return 42; }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    expect(isAsyncFunction(func)).toBe(true);
  });

  it('should detect non-async function declaration', () => {
    const code = `function test() { return 42; }`;
    const sourceFile = createSourceFile(code);
    const func = findFirstFunction(sourceFile);

    expect(isAsyncFunction(func)).toBe(false);
  });

  it('should detect async arrow function', () => {
    const code = `const test = async () => { return 42; };`;
    const sourceFile = createSourceFile(code);
    const func = findFirstArrowFunction(sourceFile);

    expect(isAsyncFunction(func)).toBe(true);
  });

  it('should detect non-async arrow function', () => {
    const code = `const test = () => { return 42; };`;
    const sourceFile = createSourceFile(code);
    const func = findFirstArrowFunction(sourceFile);

    expect(isAsyncFunction(func)).toBe(false);
  });
});

describe('addReturnTypeIfMissing', () => {
  describe('basic functionality', () => {
    it('should add HTMLElement return type when missing', () => {
      const code = `function test() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.warning).toBeUndefined();
      expect(result.hasCommentFlag).toBe(true);

      const updatedFunc = result.node as ts.FunctionDeclaration;
      expect(updatedFunc.type).toBeDefined();
      // Can't use getText() on synthetic nodes, check structure instead
      expect(ts.isTypeReferenceNode(updatedFunc.type!)).toBe(true);
      const typeRef = updatedFunc.type as ts.TypeReferenceNode;
      expect(ts.isIdentifier(typeRef.typeName)).toBe(true);
      const ident = typeRef.typeName as ts.Identifier;
      expect(ident.text).toBe('HTMLElement');
    });

    it('should add HTMLElement to arrow function', () => {
      const code = `const test = () => { return document.createElement('div'); };`;
      const sourceFile = createSourceFile(code);
      const func = findFirstArrowFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(true);
      expect(result.error).toBeUndefined();

      const updatedFunc = result.node as ts.ArrowFunction;
      expect(updatedFunc.type).toBeDefined();
      expectHTMLElementType(updatedFunc.type!);
    });
  });

  describe('safety checks', () => {
    it('should NOT override existing return type', () => {
      const code = `function test(): Element { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(false);
      expect(result.warning).toContain('Element');
      expect(result.error).toBeUndefined();

      const node = result.node as ts.FunctionDeclaration;
      expect(node.type!.getText()).toBe('Element'); // Unchanged
    });

    it('should NOT modify if already has correct type', () => {
      const code = `function test(): HTMLElement { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(false);
      expect(result.warning).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.hasCommentFlag).toBe(false);
    });

    it('should error on async function when errorOnAsync=true', () => {
      const code = `async function test() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func, { errorOnAsync: true });

      expect(result.modified).toBe(false);
      expect(result.error).toBe('Components cannot be async functions');
      expect(result.hasCommentFlag).toBe(false);
    });

    it('should allow async function when errorOnAsync=false', () => {
      const code = `async function test() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func, { errorOnAsync: false });

      expect(result.modified).toBe(true);
      expect(result.error).toBeUndefined();

      const updatedFunc = result.node as ts.FunctionDeclaration;
      expectHTMLElementType(updatedFunc.type!);
    });
  });

  describe('configuration options', () => {
    it('should use custom targetType', () => {
      const code = `function test() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func, { targetType: 'Element' });

      expect(result.modified).toBe(true);

      const updatedFunc = result.node as ts.FunctionDeclaration;
      expectHTMLElementType(updatedFunc.type!, 'Element');
    });

    it('should suppress warnings when emitWarnings=false', () => {
      const code = `function test(): Element { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      // Mock console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = addReturnTypeIfMissing(func, { emitWarnings: false });

      expect(result.modified).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should set hasCommentFlag=false when addCommentFlag=false', () => {
      const code = `function test() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func, { addCommentFlag: false });

      expect(result.modified).toBe(true);
      expect(result.hasCommentFlag).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should preserve generics on function', () => {
      const code = `function test<T>() { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(true);

      const updatedFunc = result.node as ts.FunctionDeclaration;
      expect(updatedFunc.typeParameters).toBeDefined();
      expect(updatedFunc.typeParameters!.length).toBe(1);
      expectHTMLElementType(updatedFunc.type!);
    });

    it('should handle function with parameters', () => {
      const code = `function test(props: Props) { return document.createElement('div'); }`;
      const sourceFile = createSourceFile(code);
      const func = findFirstFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(true);

      const updatedFunc = result.node as ts.FunctionDeclaration;
      expect(updatedFunc.parameters.length).toBe(1);
      expectHTMLElementType(updatedFunc.type!);
    });

    it('should handle arrow function with parameters', () => {
      const code = `const test = (props: Props) => { return document.createElement('div'); };`;
      const sourceFile = createSourceFile(code);
      const func = findFirstArrowFunction(sourceFile);

      const result = addReturnTypeIfMissing(func);

      expect(result.modified).toBe(true);

      const updatedFunc = result.node as ts.ArrowFunction;
      expect(updatedFunc.parameters.length).toBe(1);
      expectHTMLElementType(updatedFunc.type!);
    });
  });

  describe('function expressions', () => {
    it('should handle function expressions', () => {
      const code = `const test = function() { return document.createElement('div'); };`;
      const sourceFile = createSourceFile(code);

      let found: ts.FunctionExpression | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
          const decl = node.declarationList.declarations[0];
          if (decl && decl.initializer && ts.isFunctionExpression(decl.initializer)) {
            found = decl.initializer;
          }
        }
      });

      if (!found) {
        throw new Error('No function expression found');
      }

      const result = addReturnTypeIfMissing(found);

      expect(result.modified).toBe(true);

      const updatedFunc = result.node as ts.FunctionExpression;
      expectHTMLElementType(updatedFunc.type!);
    });
  });
});
