/**
 * Unit tests for factory and context initialization
 * Tests: context creation, options, debug configuration
 */

import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { initializeContext, transformerFactory } from '../factory.js';
import { createTestProgram } from './test-helpers.js';

describe('Factory', () => {
  function createSourceFile(source: string): ts.SourceFile {
    return ts.createSourceFile('test.tsx', source, ts.ScriptTarget.ESNext, true);
  }

  function createProgram(source: string): ts.Program {
    return createTestProgram(source);
  }

  test('initializes context with default options', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.sourceFile).toBe(sourceFile);
    expect(context.fileName).toBe('test.tsx');
    expect(context.typeChecker).toBeDefined();
    expect(context.program).toBe(program);
    expect(context.components).toBeDefined();
    expect(context.signals).toBeDefined();
    expect(context.jsxDepth).toBe(0);
    expect(context.currentComponent).toBe(null);
  });

  test('sets debug mode from options', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program, {
      debug: true,
    });

    expect(context.options.debug).toBe(true);
    expect(context.debugTracker).toBeDefined();
  });

  test('creates debug tracker when debug enabled', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program, {
      debug: true,
    });

    expect(context.debugTracker).toBeDefined();
    expect(context.debugTracker?.currentSession).toBeDefined();
  });

  test('does not create debug tracker when debug disabled', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program, {
      debug: false,
    });

    expect(context.debugTracker).toBeUndefined();
  });

  test('initializes empty collections', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.components.size).toBe(0);
    expect(context.signals.size).toBe(0);
  });

  test('sets initial JSX depth to zero', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.jsxDepth).toBe(0);
  });

  test('sets initial current component to null', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.currentComponent).toBe(null);
  });

  test('stores file name correctly', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(
      sourceFile,
      'my-component.tsx',
      program.getTypeChecker(),
      program
    );

    expect(context.fileName).toBe('my-component.tsx');
  });

  test('creates context with custom options', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program, {
      debug: true,
      sourceMaps: true,
      optimizeSignals: true,
    });

    expect(context.options.debug).toBe(true);
    expect(context.options.sourceMaps).toBe(true);
    expect(context.options.optimizeSignals).toBe(true);
  });

  test('merges custom options with defaults', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program, {
      debug: true,
    });

    expect(context.options.debug).toBe(true);
    expect(context.options.sourceMaps).toBe(false); // default
  });

  test('creates transformer factory', () => {
    const source = 'const x = 1;';
    const program = createProgram(source);

    const transformer = transformerFactory(program);

    expect(transformer).toBeDefined();
    expect(typeof transformer).toBe('function');
  });

  test('transformer factory returns transformation context function', () => {
    const source = 'const x = 1;';
    const program = createProgram(source);

    const transformer = transformerFactory(program);
    const contextFn = transformer({} as ts.TransformationContext);

    expect(contextFn).toBeDefined();
    expect(typeof contextFn).toBe('function');
  });

  test('handles missing optional parameters', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context).toBeDefined();
    expect(context.options).toBeDefined();
  });

  test('type checker is accessible', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);
    const typeChecker = program.getTypeChecker();

    const context = initializeContext(sourceFile, 'test.tsx', typeChecker, program);

    expect(context.typeChecker).toBe(typeChecker);
  });

  test('program is accessible', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.program).toBe(program);
  });

  test('source file is accessible', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    expect(context.sourceFile).toBe(sourceFile);
  });

  test('components map is mutable', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    context.components.set('TestComponent', {} as any);
    expect(context.components.size).toBe(1);
    expect(context.components.has('TestComponent')).toBe(true);
  });

  test('signals map is mutable', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    context.signals.set('count', {} as any);
    expect(context.signals.size).toBe(1);
    expect(context.signals.has('count')).toBe(true);
  });

  test('JSX depth is mutable', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    context.jsxDepth = 3;
    expect(context.jsxDepth).toBe(3);
  });

  test('current component is mutable', () => {
    const source = 'const x = 1;';
    const sourceFile = createSourceFile(source);
    const program = createProgram(source);

    const context = initializeContext(sourceFile, 'test.tsx', program.getTypeChecker(), program);

    context.currentComponent = 'MyComponent';
    expect(context.currentComponent).toBe('MyComponent');
  });
});
