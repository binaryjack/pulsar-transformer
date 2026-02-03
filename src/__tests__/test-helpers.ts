/**
 * Shared test helpers for creating TypeScript programs and contexts
 */

import * as ts from 'typescript';
import { initializeContext } from '../factory.js';
import type { ITransformContext } from '../types.js';

/**
 * Create a minimal TypeScript CompilerHost for testing
 */
export function createTestCompilerHost(sourceFile: ts.SourceFile): ts.CompilerHost {
  return {
    getSourceFile: (fileName) => (fileName === sourceFile.fileName ? sourceFile : undefined),
    writeFile: () => {},
    getCurrentDirectory: () => '',
    getDirectories: () => [],
    fileExists: () => true,
    readFile: () => '',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: () => 'lib.d.ts',
  };
}

/**
 * Create a TypeScript Program from source code
 */
export function createTestProgram(source: string, fileName: string = 'test.tsx'): ts.Program {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);

  const host = createTestCompilerHost(sourceFile);
  return ts.createProgram([fileName], {}, host);
}

/**
 * Create a transform context for testing
 */
export function createTestContext(
  source: string,
  fileName: string = 'test.tsx'
): ITransformContext {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);

  const program = createTestProgram(source, fileName);

  return initializeContext(sourceFile, fileName, program.getTypeChecker(), program);
}

/**
 * Extract an expression from standalone source code
 */
export function getExpression(source: string): ts.Expression {
  const file = ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
  const statement = file.statements[0] as ts.ExpressionStatement;
  return statement.expression;
}

/**
 * Transform source code using the pulsar transformer
 */
export function transformSource(
  source: string,
  transformerFactory: (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>
): string {
  // Create source file with parent tracking enabled
  const sourceFile = ts.createSourceFile('module.tsx', source, ts.ScriptTarget.ESNext, true);
  const program = createTestProgram(source, 'module.tsx');

  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'createElement',
      jsxFragmentFactory: 'Fragment',
    },
    fileName: 'module.tsx',
    transformers: {
      before: [(ctx) => transformerFactory(program)(ctx)],
    },
  });

  return result.outputText;
}
