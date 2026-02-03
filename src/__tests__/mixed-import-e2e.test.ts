/**
 * Mixed Import E2E Test
 *
 * Tests complete pipeline with mixed imports (default + named).
 */

import { describe, expect, it } from 'vitest';
import { createAnalyzer } from '../analyzer/create-analyzer.js';
import type { IImportIR } from '../analyzer/ir/ir-node-types.js';
import { createEmitter } from '../emitter/create-emitter.js';
import { createParser } from '../parser/create-parser.js';

describe('Mixed Import E2E', () => {
  it('should handle default + single named import', () => {
    const code = `import React, { useState } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import React, { useState } from 'react';");
  });

  it('should handle default + multiple named imports', () => {
    const code = `import React, { useState, useEffect } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import React, { useEffect, useState } from 'react';");
  });

  it('should handle default + aliased named imports', () => {
    const code = `import React, { Component as C, useState as S } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import React, { Component as C, useState as S } from 'react';");
  });

  it('should handle default + mixed aliased and non-aliased', () => {
    const code = `import React, { useState, Component as C } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    // Should sort named imports alphabetically
    expect(output).toContain("import React, { Component as C, useState } from 'react';");
  });

  it('should track all imports in analyzer context', () => {
    const code = `import React, { useState, useEffect } from 'react';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    analyzer.analyze(ast);

    const imports = analyzer.getContext().imports;

    // All three should be tracked
    expect(imports.has('React')).toBe(true);
    expect(imports.get('React')).toBe('react');

    expect(imports.has('useState')).toBe(true);
    expect(imports.get('useState')).toBe('react');

    expect(imports.has('useEffect')).toBe(true);
    expect(imports.get('useEffect')).toBe('react');
  });

  it('should handle import from npm package', () => {
    const code = `import styled, { css } from 'styled-components';`;

    const parser = createParser();
    const ast = parser.parse(code);

    const analyzer = createAnalyzer();
    const ir = analyzer.analyze(ast) as IImportIR;

    const emitter = createEmitter();
    const output = emitter.emit(ir);

    expect(output).toContain("import styled, { css } from 'styled-components';");
  });
});
