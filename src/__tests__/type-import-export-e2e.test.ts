/**
 * E2E Tests for Type Imports and Exports
 *
 * Tests complete pipeline: parse → analyze → emit
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Type Import/Export E2E', () => {
  describe('Type Imports', () => {
    it('should handle full statement type import', () => {
      const source = 'import type { Foo } from "./types";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import type \{ Foo \} from ['"]\.\/types['"]/);
    });

    it('should handle inline type imports', () => {
      const source = 'import { type Foo, Bar } from "./module";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import \{ (type Foo, Bar|Bar, type Foo) \} from ['"]\.\/module['"]/);
    });

    it('should handle mixed type and value imports with aliases', () => {
      const source = 'import { type Foo as F, Bar as B, type Baz } from "./module";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('type Foo as F');
      expect(code).toContain('Bar as B');
      expect(code).toContain('type Baz');
    });

    it('should preserve type import through full pipeline', () => {
      const source = `
import type { IUser, IProduct } from "./types";
import { createSignal } from "@pulsar/core";

export function UserList() {
  return <div>User List</div>;
}`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(
        /import type \{ (IUser, IProduct|IProduct, IUser) \} from ['"]\.\/types['"]/
      );
    });
  });

  describe('Type Exports', () => {
    it('should handle full statement type export', () => {
      const source = 'export type { Foo } from "./types";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export type { Foo } from "./types";');
    });

    it('should handle inline type exports', () => {
      const source = 'export { type Foo, Bar } from "./module";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { type Foo, Bar } from "./module";');
    });

    it('should handle local type exports', () => {
      const source = 'export { type Foo, Bar };';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { type Foo, Bar };');
    });

    it('should handle type exports with aliases', () => {
      const source = 'export { type Foo as F, Bar as B } from "./module";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('type Foo as F');
      expect(code).toContain('Bar as B');
    });

    it('should preserve type export through full pipeline', () => {
      const source = `
export type { IUser, IProduct } from "./types";
export { Button, Card } from "./components";

export function UserList() {
  return <div>User List</div>;
}`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(
        /export type \{ (IUser, IProduct|IProduct, IUser) \} from ['"]\.\/types['"]/
      );
    });
  });

  describe('Combined Type Imports and Exports', () => {
    it('should handle file with both type imports and type exports', () => {
      const source = `
import type { IUser } from "./types";
import { createSignal } from "@pulsar/core";

export type { IUser };
export { createSignal };`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(/import type \{ IUser \} from ['"]\.\/types['"]/);
    });

    it('should handle complex mixed type and value imports/exports', () => {
      const source = `
import type { IUser, IProduct } from "./types";
import { Button, type IButtonProps, Card } from "./components";

export type { IUser, IProduct, IButtonProps };
export { Button, type ICardProps, Card } from "./components";`;

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toMatch(
        /import type \{ (IUser, IProduct|IProduct, IUser) \} from ['"]\.\/types['"]/
      );
    });
  });

  describe('Analyzer Tracking', () => {
    it('should track type imports in analyzer context', () => {
      const source = 'import type { IUser } from "./types";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast) as any;

      // Single import should be returned directly
      expect(ir.type).toBe('ImportIR');
      expect(ir.isTypeOnly).toBe(true);
      expect(ir.specifiers[0].imported).toBe('IUser');
    });

    it('should track inline type specifiers in analyzer context', () => {
      const source = 'import { type IUser, Button, type IProps } from "./module";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast) as any;

      expect(ir.specifiers).toHaveLength(3);
      expect(ir.specifiers[0].isTypeOnly).toBe(true);
      expect(ir.specifiers[1].isTypeOnly).toBe(false);
      expect(ir.specifiers[2].isTypeOnly).toBe(true);
    });
  });
});
