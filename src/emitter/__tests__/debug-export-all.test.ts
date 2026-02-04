/**
 * Debug test for export all
 */

import { describe, it } from 'vitest';
import { createAnalyzer } from '../../../analyzer/create-analyzer.js';
import { createParser } from '../../../parser/create-parser.js';
import { createEmitter } from '../../create-emitter.js';

describe('Debug: Export All', () => {
  it('should debug export all IR and code', () => {
    const parser = createParser();
    const ast = parser.parse('export * from "./utils";');
    console.log('AST:', JSON.stringify(ast, null, 2));

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast);
    console.log('IR:', JSON.stringify(ir, null, 2));

    const emitter = createEmitter();
    const code = emitter.emit(ir);
    console.log('Generated Code:', code);
  });
});
