/**
 * End-to-end test for default import handling
 *
 * Validates that default imports are correctly parsed, analyzed, and emitted
 * through the full transformation pipeline.
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import type { IImportIR } from '../analyzer/ir/ir-node-types.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Default Import E2E', () => {
  it('should handle default import through full pipeline', () => {
    const source = `import React from 'react';`;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer({});
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const code = emitter.emit(ir);

    // Should preserve default import format
    expect(code).toContain("import React from 'react';");
    // Should NOT have braces
    expect(code).not.toContain('{ React }');
  });

  it('should distinguish default from named imports', () => {
    // Test default import
    const parser1 = createParser();
    const defaultAST = parser1.parse(`import React from 'react';`);
    const defaultIR = createAnalyzer({}).analyze(defaultAST) as IImportIR;

    expect(defaultIR.specifiers).toBeDefined();
    expect(defaultIR.specifiers.length).toBeGreaterThan(0);
    expect(defaultIR.specifiers[0].type).toBe('ImportDefaultSpecifier');

    const emitter1 = createEmitter();
    const defaultCode = emitter1.emit(defaultIR);
    expect(defaultCode).toContain("import React from 'react';");
    expect(defaultCode).not.toContain('{ React }');

    // Test named import (fresh instances to avoid state pollution)
    const parser2 = createParser();
    const namedAST = parser2.parse(`import { useState } from 'react';`);
    const namedIR = createAnalyzer({}).analyze(namedAST) as IImportIR;

    expect(namedIR.specifiers).toBeDefined();
    expect(namedIR.specifiers.length).toBeGreaterThan(0);
    expect(namedIR.specifiers[0].type).toBe('ImportSpecifier');

    const emitter2 = createEmitter();
    const namedCode = emitter2.emit(namedIR);
    expect(namedCode).toContain("import { useState } from 'react';");
  });

  it('should merge default and named imports when emitted separately', () => {
    const emitter = createEmitter();
    const parser = createParser();
    const analyzer = createAnalyzer({});

    // Emit default import first
    const defaultSource = `import React from 'react';`;
    const defaultAST = parser.parse(defaultSource);
    const defaultIR = analyzer.analyze(defaultAST) as IImportIR;
    emitter.emit(defaultIR);

    // Then emit named import from same source
    const namedSource = `import { useState } from 'react';`;
    const namedAST = parser.parse(namedSource);
    const namedIR = analyzer.analyze(namedAST) as IImportIR;
    const code = emitter.emit(namedIR);

    // Should merge into: import React, { useState } from 'react';
    expect(code).toContain("import React, { useState } from 'react';");
  });

  it('should handle multiple default imports from different sources', () => {
    const emitter = createEmitter();
    const parser = createParser();
    const analyzer = createAnalyzer({});

    const sources = [`import React from 'react';`, `import Vue from 'vue';`];

    let code = '';
    sources.forEach((source) => {
      const ast = parser.parse(source);
      const ir = analyzer.analyze(ast) as IImportIR;
      code = emitter.emit(ir);
    });

    // Final emission should have both imports
    expect(code).toContain("import React from 'react';");
    expect(code).toContain("import Vue from 'vue';");
  });

  it('should emit correct IR type based on importKind', () => {
    const parser = createParser();
    const analyzer = createAnalyzer({});

    const defaultAST = parser.parse(`import React from 'react';`);
    const defaultIR = analyzer.analyze(defaultAST) as IImportIR;

    expect(defaultIR.specifiers[0].type).toBe('ImportDefaultSpecifier');
    expect(defaultIR.specifiers[0].local).toBe('React');
    expect(defaultIR.specifiers[0].imported).toBe('React');
  });
});
