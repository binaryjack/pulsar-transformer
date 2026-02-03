/**
 * Tests for export emitter
 */

import { createAnalyzer } from '../../../analyzer/create-analyzer.js';
import { createParser } from '../../../parser/create-parser.js';
import { createEmitter } from '../../create-emitter.js';

describe('Emitter: _emitExport', () => {
  describe('named exports', () => {
    it('should emit single named export', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo };');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo };');
    });

    it('should emit multiple named exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo, bar, baz };');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo, bar, baz };');
    });
  });

  describe('export aliases', () => {
    it('should emit export with alias', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar };');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo as bar };');
    });

    it('should emit multiple exports with aliases', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo as bar, baz as qux };');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo as bar, baz as qux };');
    });
  });

  describe('re-exports', () => {
    it('should emit named re-export', () => {
      const parser = createParser();
      const ast = parser.parse('export { foo } from "./utils";');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export { foo } from "./utils";');
    });

    it('should emit export all', () => {
      const parser = createParser();
      const ast = parser.parse('export * from "./utils";');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export * from "./utils";');
    });

    it('should emit export all with namespace', () => {
      const parser = createParser();
      const ast = parser.parse('export * as utils from "./utils";');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export * as utils from "./utils";');
    });
  });

  describe('default export', () => {
    it('should emit default export', () => {
      const parser = createParser();
      const ast = parser.parse('export default Component;');

      const analyzer = createAnalyzer();
      const ir = analyzer.analyze(ast);

      const emitter = createEmitter();
      const code = emitter.emit(ir);

      expect(code).toContain('export default;');
    });
  });
});
