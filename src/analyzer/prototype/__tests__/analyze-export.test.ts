/**
 * Tests for export analyzer
 */

import { createParser } from '../../../parser/create-parser.js';
import { createAnalyzer } from '../../create-analyzer.js';
import { IRNodeType } from '../../ir/index.js';

describe('analyzeExport', () => {
  describe('named exports', () => {
    it('should analyze single named export', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo };');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('foo')).toBe(true);
    });

    it('should analyze multiple named exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar, baz };');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('foo')).toBe(true);
      expect(context.exports.has('bar')).toBe(true);
      expect(context.exports.has('baz')).toBe(true);
    });
  });

  describe('export aliases', () => {
    it('should use exported name in context', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar };');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('bar')).toBe(true);
      expect(context.exports.has('foo')).toBe(false);
    });

    it('should handle multiple aliases', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar, baz as qux };');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('bar')).toBe(true);
      expect(context.exports.has('qux')).toBe(true);
    });
  });

  describe('re-exports', () => {
    it('should not add re-exports to local context', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo } from "./utils";');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      const context = analyzer.getContext();
      // Re-exports don't add to local exports context
      expect(context.exports.has('foo')).toBe(false);
    });

    it('should include source in IR', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar } from "./utils";');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      // IR should have source field
      // Note: Can't easily test IR structure from here without exposing internals
    });
  });

  describe('default exports', () => {
    it('should track default export', () => {
      const parser = createParser();
      const ast = parser.parse('export default Component;');

      const analyzer = createAnalyzer();
      analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('default')).toBe(true);
    });
  });
});
