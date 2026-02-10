/**
 * Tests for parse-export-declaration
 */

import { ASTNodeType } from '../../ast/index.js';
import { createParser } from '../../create-parser.js';

describe('parseExportDeclaration', () => {
  describe('named exports', () => {
    it('should parse single named export', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo };');

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const exportNode = ast.body[0];
      expect(exportNode.type).toBe(ASTNodeType.EXPORT_DECLARATION);
      expect(exportNode.exportKind).toBe('named');
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.source).toBeNull();
    });

    it('should parse multiple named exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar, baz };');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.specifiers[1].name).toBe('bar');
      expect(exportNode.specifiers[2].name).toBe('baz');
    });
  });

  describe('export aliases', () => {
    it('should parse export with alias', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar };');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.specifiers[0].alias).toBe('bar');
    });

    it('should parse multiple exports with aliases', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar, baz as qux };');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(2);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.specifiers[0].alias).toBe('bar');
      expect(exportNode.specifiers[1].name).toBe('baz');
      expect(exportNode.specifiers[1].alias).toBe('qux');
    });

    it('should parse mixed exports with and without aliases', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar as baz, qux };');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.specifiers[0].alias).toBeUndefined();
      expect(exportNode.specifiers[1].name).toBe('bar');
      expect(exportNode.specifiers[1].alias).toBe('baz');
      expect(exportNode.specifiers[2].name).toBe('qux');
      expect(exportNode.specifiers[2].alias).toBeUndefined();
    });
  });

  describe('re-exports', () => {
    it('should parse named re-export', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo } from "./utils";');

      const exportNode = ast.body[0];
      expect(exportNode.exportKind).toBe('named');
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.source).toBeDefined();
      expect(exportNode.source?.value).toBe('./utils');
    });

    it('should parse multiple re-exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar } from "./utils";');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(2);
      expect(exportNode.source?.value).toBe('./utils');
    });

    it('should parse re-export with alias', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar } from "./utils";');

      const exportNode = ast.body[0];
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('foo');
      expect(exportNode.specifiers[0].alias).toBe('bar');
      expect(exportNode.source?.value).toBe('./utils');
    });

    it('should parse export all', () => {
      const parser = createParser();
      const ast = parser.parse('export * from "./utils";');

      const exportNode = ast.body[0];
      expect(exportNode.exportKind).toBe('all');
      expect(exportNode.source?.value).toBe('./utils');
    });

    it('should parse export all with namespace', () => {
      const parser = createParser();
      const ast = parser.parse('export * as utils from "./utils";');

      const exportNode = ast.body[0];
      expect(exportNode.exportKind).toBe('all');
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('utils');
      expect(exportNode.source?.value).toBe('./utils');
    });
  });

  describe('default exports', () => {
    it('should parse default export', () => {
      const parser = createParser();
      const ast = parser.parse('export default Component;');

      const exportNode = ast.body[0];
      expect(exportNode.exportKind).toBe('default');
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('Component');
      expect(exportNode.source).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle missing closing brace', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo');

      // Parser now uses error recovery instead of throwing
      expect(parser.hasErrors()).toBe(true);
      const errors = parser.getErrors();
      expect(errors.some((e) => e.message.includes('Expected }'))).toBe(true);
    });

    it('should handle missing from in export *', () => {
      const parser = createParser();
      const ast = parser.parse('export * "./utils";');

      expect(parser.hasErrors()).toBe(true);
      const errors = parser.getErrors();
      expect(errors.some((e) => e.code === 'MISSING_FROM')).toBe(true);
    });

    it('should handle invalid export specifier', () => {
      const parser = createParser();
      const ast = parser.parse('export { 123 };');

      // Parser now uses error recovery instead of throwing
      expect(parser.hasErrors()).toBe(true);
      const errors = parser.getErrors();
      expect(
        errors.some(
          (e) =>
            e.message.includes('Expected export specifier') ||
            e.message.includes('Expected identifier')
        )
      ).toBe(true);
      expect(parser.hasErrors()).toBe(true);
      const errors = parser.getErrors();
      expect(errors.some((e) => e.message.includes('Expected export specifier'))).toBe(true);
>>>>>>> 35c9f2b349e0cba67b8785a5e666c2a86450ad27
    });
  });
});
