/**
 * E2E Tests: Union Type Support
 *
 * Validates that union types (|) work throughout the entire pipeline.
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Union Types E2E', () => {
  it('should preserve simple union type through pipeline', () => {
    const source = 'const value: string | number = 42;';

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('string | number');
  });

  it('should preserve nullable union type', () => {
    const source = 'const user: IUser | null = null;';

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('IUser | null');
  });

  it('should preserve multi-way union types', () => {
    const source = 'const status: "idle" | "loading" | "success" | "error" = "idle";';

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('|');
    expect(output).toContain('idle');
    expect(output).toContain('loading');
  });

  it('should preserve union with generic types', () => {
    const source = 'const data: Array<string> | null = null;';

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('Array');
    expect(output).toContain('|');
    expect(output).toContain('null');
  });

  it('should handle union types in component signals', () => {
    const source = `
      import { createSignal } from '@pulsar/core';
      
      const [user, setUser] = createSignal<IUser | null>(null);
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('IUser | null');
    expect(output).toContain('createSignal');
  });

  it('should handle complex union with undefined', () => {
    const source = 'const value: string | number | null | undefined;';

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain('string | number | null | undefined');
  });
});
