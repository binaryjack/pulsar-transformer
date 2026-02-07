import { describe, expect, it } from 'vitest';
import { createAnalyzer } from './src/analyzer/factory/analyzer-factory';
import type { IImportIR } from './src/analyzer/ir/ir-node-types';
import { createParser } from './src/parser/factory/parser-factory';

describe('Debug Import Metadata', () => {
  it('debug should preserve import metadata', () => {
    const source = `import { Button } from './components';`;

    console.log('Source:', source);

    const parser = createParser();
    const ast = parser.parse(source);

    console.log('AST location:', JSON.stringify(ast.body[0].location, null, 2));

    const analyzer = createAnalyzer({});
    const ir = analyzer.analyze(ast);

    console.log('IR type:', ir.type);
    console.log('IR:', JSON.stringify(ir, null, 2));

    const importIR = ir as IImportIR;
    console.log('importIR.metadata:', JSON.stringify(importIR.metadata, null, 2));

    expect(importIR.metadata).toBeDefined();
    expect(importIR.metadata.line).toBe(1);
    expect(importIR.metadata.column).toBe(1);
  });
});
