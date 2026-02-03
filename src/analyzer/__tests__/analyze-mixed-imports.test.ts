/**
 * Mixed Import Analysis Tests
 *
 * Tests analyzer handling of mixed imports (default + named).
 */

import { describe, expect, it } from 'vitest';
import { createParser } from '../../parser/create-parser.js';
import { createAnalyzer } from '../create-analyzer.js';
import type { IImportIR } from '../ir/ir-node-types.js';
import { IRNodeType } from '../ir/ir-node-types.js';

describe('Analyzer - Mixed Imports', () => {
  it('should create correct IR for default + named import', () => {
    const source = `import React, { useState } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    expect(ir.type).toBe(IRNodeType.IMPORT);
    expect(ir.source).toBe('react');
    expect(ir.specifiers).toHaveLength(2);

    // First specifier is default
    expect(ir.specifiers[0].type).toBe('ImportDefaultSpecifier');
    expect(ir.specifiers[0].imported).toBe('React');
    expect(ir.specifiers[0].local).toBe('React');

    // Second specifier is named
    expect(ir.specifiers[1].type).toBe('ImportSpecifier');
    expect(ir.specifiers[1].imported).toBe('useState');
    expect(ir.specifiers[1].local).toBe('useState');
  });

  it('should create correct IR for default + multiple named imports', () => {
    const source = `import React, { useState, useEffect } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    expect(ir.specifiers).toHaveLength(3);

    // First is default
    expect(ir.specifiers[0].type).toBe('ImportDefaultSpecifier');
    expect(ir.specifiers[0].local).toBe('React');

    // Rest are named
    expect(ir.specifiers[1].type).toBe('ImportSpecifier');
    expect(ir.specifiers[1].local).toBe('useState');

    expect(ir.specifiers[2].type).toBe('ImportSpecifier');
    expect(ir.specifiers[2].local).toBe('useEffect');
  });

  it('should handle default + aliased named imports', () => {
    const source = `import React, { Component as C } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    expect(ir.specifiers).toHaveLength(2);

    // Default
    expect(ir.specifiers[0].type).toBe('ImportDefaultSpecifier');
    expect(ir.specifiers[0].imported).toBe('React');
    expect(ir.specifiers[0].local).toBe('React');

    // Named with alias
    expect(ir.specifiers[1].type).toBe('ImportSpecifier');
    expect(ir.specifiers[1].imported).toBe('Component');
    expect(ir.specifiers[1].local).toBe('C');
  });

  it('should track both default and named imports in context', () => {
    const source = `import React, { useState } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(source);

    const analyzer = createAnalyzer();
    analyzer.analyze(ast);

    const imports = analyzer.getContext().imports;

    // Both should be tracked
    expect(imports.has('React')).toBe(true);
    expect(imports.get('React')).toBe('react');

    expect(imports.has('useState')).toBe(true);
    expect(imports.get('useState')).toBe('react');
  });
});
