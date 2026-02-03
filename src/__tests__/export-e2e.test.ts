/**
 * E2E Tests for Export System
 */

import { createAnalyzer } from '../analyzer/create-analyzer.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Export System E2E', () => {
  describe('named exports', () => {
    it('should handle complete flow for named exports', () => {
      const source = 'export { foo, bar };';

      const parser = createParser();
      const ast = parser.parse(source);
      expect(parser.hasErrors()).toBe(false);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);
      expect(analyzer.hasErrors()).toBe(false);

      const context = analyzer.getContext();
      expect(context.exports.has('foo')).toBe(true);
      expect(context.exports.has('bar')).toBe(true);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo, bar };');
    });
  });

  describe('export aliases', () => {
    it('should handle complete flow for aliased exports', () => {
      const source = 'export { foo as bar, baz as qux };';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      // Context should use exported names
      const context = analyzer.getContext();
      expect(context.exports.has('bar')).toBe(true);
      expect(context.exports.has('qux')).toBe(true);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo as bar, baz as qux };');
    });
  });

  describe('re-exports', () => {
    it('should handle re-exports from module', () => {
      const source = 'export { foo, bar } from "./utils";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      // Re-exports don't add to local context
      const context = analyzer.getContext();
      expect(context.exports.size).toBe(0);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo, bar } from "./utils";');
    });

    it('should handle export all', () => {
      const source = 'export * from "./utils";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export * from "./utils";');
    });

    it('should handle export all with namespace', () => {
      const source = 'export * as utils from "./utils";';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export * as utils from "./utils";');
    });
  });

  describe('default export', () => {
    it('should handle default export', () => {
      const source = 'export default Component;';

      const parser = createParser();
      const ast = parser.parse(source);

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const context = analyzer.getContext();
      expect(context.exports.has('default')).toBe(true);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export default;');
    });
  });
});
