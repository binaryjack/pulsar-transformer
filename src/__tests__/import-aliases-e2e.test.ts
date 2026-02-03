/**
 * Import Aliases E2E Test
 *
 * Tests complete pipeline with import aliases.
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import type { IImportIR } from '../analyzer/ir/ir-node-types.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Import Aliases E2E', () => {
  it('should handle single alias through full pipeline', () => {
    const code = `import { foo as bar } from './utils';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import { foo as bar } from './utils';");
  });

  it('should handle multiple aliases through full pipeline', () => {
    const code = `import { alpha as a, beta as b } from './utils';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import { alpha as a, beta as b } from './utils';");
  });

  it('should handle mixed aliased and non-aliased imports', () => {
    const code = `import { foo, bar as baz } from './utils';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import { bar as baz, foo } from './utils';");
  });

  it('should handle default import with aliased named imports', () => {
    const code = `import React, { Component as C } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import React, { Component as C } from 'react';");
  });

  it('should track aliases in analyzer context', () => {
    const code = `import { foo as bar } from './utils';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    analyzer.analyze(ast);

    // Analyzer should track the LOCAL name (alias) in context
    const imports = analyzer.getContext().imports;
    expect(imports.has('bar')).toBe(true); // Local name
    expect(imports.get('bar')).toBe('./utils');
    expect(imports.has('foo')).toBe(false); // Not the imported name
  });
});
