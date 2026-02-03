/**
 * End-to-End Component Parsing Tests
 *
 * Validates parsing of realistic component patterns.
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { createParser } from '../create-parser.js';

describe('Component Parsing E2E', () => {
  describe('Modern Component Patterns', () => {
    it('should parse component with signal and return', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        
        export const Counter = () => {
          const [count, setCount] = createSignal(0);
          return <button>Count: {count()}</button>;
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body.length).toBeGreaterThan(0);

      // Verify import
      const importDecl = ast.body.find((node: any) => node.type === ASTNodeType.IMPORT_DECLARATION);
      expect(importDecl).toBeDefined();
      expect(importDecl.source.value).toBe('@pulsar/core');

      // Verify export
      const exportDecl = ast.body.find((node: any) => node.type === ASTNodeType.EXPORT_DECLARATION);
      expect(exportDecl).toBeDefined();
    });

    it('should parse component with multiple signals', () => {
      const source = `
        const Component = () => {
          const [name, setName] = createSignal('');
          const [age, setAge] = createSignal(0);
          const [active, setActive] = createSignal(false);
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    });

    it('should parse component with type annotations', () => {
      const source = `
        const Counter: () => HTMLElement = () => {
          const count: number = 0;
          const name: string = 'test';
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(ast.body[0].declarations[0].typeAnnotation).toBeDefined();
    });
  });

  describe('Import Patterns', () => {
    it('should parse multiple named imports', () => {
      const source = `
        import { createSignal, createEffect, createMemo } from '@pulsar/core';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body[0].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[0].specifiers).toHaveLength(3);
      expect(ast.body[0].specifiers[0].name).toBe('createSignal');
      expect(ast.body[0].specifiers[1].name).toBe('createEffect');
      expect(ast.body[0].specifiers[2].name).toBe('createMemo');
    });

    it('should parse mixed imports and declarations', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        import type { IUser } from './types';
        
        const [user, setUser] = createSignal(null);
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(3);
      expect(ast.body[0].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[1].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[1].isTypeOnly).toBe(true);
      expect(ast.body[2].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    });
  });

  describe('Export Patterns', () => {
    it('should parse default export with arrow function', () => {
      const source = `
        export default () => {
          const value = 42;
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body[0].type).toBe(ASTNodeType.EXPORT_DECLARATION);
    });

    it('should parse named export with const declaration', () => {
      const source = `
        export const MyComponent = () => {
          return <div>Hello</div>;
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body[0].type).toBe(ASTNodeType.EXPORT_DECLARATION);
    });

    it('should parse re-exports with types', () => {
      const source = `
        export { Button, Card } from './components';
        export type { IUser, IProduct } from './types';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].type).toBe(ASTNodeType.EXPORT_DECLARATION);
      expect(ast.body[0].isTypeOnly).toBeFalsy();
      expect(ast.body[1].type).toBe(ASTNodeType.EXPORT_DECLARATION);
      expect(ast.body[1].isTypeOnly).toBe(true);
    });
  });

  describe('Complex Real-World Components', () => {
    it('should parse form component with multiple signals', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
        import type { IFormData } from './types';
        
        export const UserForm = () => {
          const [name, setName] = createSignal('');
          const [email, setEmail] = createSignal('');
          const [submitted, setSubmitted] = createSignal(false);
          
          const formData: IFormData = {
            name: name(),
            email: email()
          };
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      // Count different node types
      const imports = ast.body.filter((n: any) => n.type === ASTNodeType.IMPORT_DECLARATION);
      const exports = ast.body.filter((n: any) => n.type === ASTNodeType.EXPORT_DECLARATION);

      expect(imports).toHaveLength(2);
      expect(exports).toHaveLength(1);
    });

    it('should parse component with mixed statements', () => {
      const source = `
        import { createSignal, createEffect } from '@pulsar/core';
        
        const MyComponent = () => {
          const [count, setCount] = createSignal(0);
          const doubled = count() * 2;
        };
        
        export { MyComponent };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty component', () => {
      const source = `
        const Empty = () => {};
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
    });

    it('should handle component with only import', () => {
      const source = `
        import { createSignal } from '@pulsar/core';
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe(ASTNodeType.IMPORT_DECLARATION);
    });

    it('should handle multiple consecutive declarations', () => {
      const source = `
        const a = 1;
        const b = 2;
        const c = 3;
        const d = 4;
        const e = 5;
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(5);
      ast.body.forEach((node: any) => {
        expect(node.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      });
    });
  });
});
