/**
 * Full Pipeline E2E Tests
 *
 * Validates complete transformation: Parser → Analyzer → Emitter
 * Tests realistic component patterns end-to-end.
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Full Pipeline E2E', () => {
  describe('Import/Export Pipeline', () => {
    it('should transform basic imports through full pipeline', () => {
      const source = `import { createSignal } from '@pulsar/core';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('import');
      expect(code).toContain('createSignal');
      expect(code).toContain('@pulsar/core');
    });

    it('should transform named exports through full pipeline', () => {
      const source = `export { Button, Card };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export');
      expect(code).toContain('Button');
      expect(code).toContain('Card');
    });

    it('should transform type imports through full pipeline', () => {
      const source = `import type { IUser } from './types';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import type \{ IUser \}/);
    });

    it('should transform re-exports through full pipeline', () => {
      const source = `export { Button } from './components';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export');
      expect(code).toContain('Button');
      expect(code).toContain('./components');
    });
  });

  describe('Multiple Statements Pipeline', () => {
    it('should transform multiple imports', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        import { Button } from './components';
        import type { IUser } from './types';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('createSignal');
      expect(code).toContain('Button');
      expect(code).toContain('IUser');
    });

    it('should transform imports and exports together', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        export { Button } from './components';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('import');
      expect(code).toContain('export');
      expect(code).toContain('createSignal');
      expect(code).toContain('Button');
    });

    it('should preserve statement order', () => {
      const source = `
        import { a } from './a';
        import { b } from './b';
        import { c } from './c';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      const lines = code.split('\n').filter((l) => l.trim());

      // Find positions
      const aPos = lines.findIndex((l) => l.includes("'./a'"));
      const bPos = lines.findIndex((l) => l.includes("'./b'"));
      const cPos = lines.findIndex((l) => l.includes("'./c'"));

      expect(aPos).toBeGreaterThanOrEqual(0);
      expect(bPos).toBeGreaterThanOrEqual(0);
      expect(cPos).toBeGreaterThanOrEqual(0);
      expect(aPos).toBeLessThan(bPos);
      expect(bPos).toBeLessThan(cPos);
    });
  });

  describe('Import Variations Pipeline', () => {
    it('should transform default imports', () => {
      const source = `import React from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import React from ['"]react['"]/);
    });

    it('should transform namespace imports', () => {
      const source = `import * as Utils from './utils';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import \* as Utils/);
    });

    it('should transform import aliases', () => {
      const source = `import { Component as Comp } from './component';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/Component as Comp/);
    });

    it('should transform mixed imports', () => {
      const source = `import React, { useState, useEffect } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('React');
      expect(code).toContain('useState');
      expect(code).toContain('useEffect');
    });
  });

  describe('Export Variations Pipeline', () => {
    it('should transform named local exports', () => {
      const source = `export { Button, Card };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/export \{ Button, Card \}/);
    });

    it('should transform export with aliases', () => {
      const source = `export { Button as Btn };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/Button as Btn/);
    });

    it('should transform type exports', () => {
      const source = `export type { IUser, IProduct };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/export type \{/);
      expect(code).toContain('IUser');
      expect(code).toContain('IProduct');
    });
  });

  describe('Complex Real-World Patterns', () => {
    it('should transform module with imports and exports', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        import type { IUser } from './types';
        
        export type { IUser };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      // Should contain all imports and exports
      expect(code).toContain('createSignal');
      expect(code).toContain('IUser');
    });

    it('should handle empty source', () => {
      const source = ``;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toBe('');
    });

    it('should handle whitespace-only source', () => {
      const source = `   \n   \n   `;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code.trim()).toBe('');
    });
  });

  describe('Analyzer IR Generation', () => {
    it('should generate correct IR for imports', () => {
      const source = `import { createSignal } from '@pulsar/core';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      expect(ir.type).toBe('ImportIR');
      expect(ir.specifiers).toBeDefined();
      expect(ir.source).toBe('@pulsar/core');
    });

    it('should generate correct IR for exports', () => {
      const source = `export { Button };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      expect(ir.type).toBe('ExportIR');
      expect(ir.specifiers).toBeDefined();
    });

    it('should preserve type information in IR', () => {
      const source = `import type { IUser } from './types';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      expect(ir.isTypeOnly).toBe(true);
    });
  });
});
