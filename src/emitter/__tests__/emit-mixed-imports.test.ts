/**
 * Mixed Import Emission Tests
 *
 * Tests emitter formatting of mixed imports (default + named).
 */

import { describe, expect, it } from 'vitest';
import type { IImportIR } from '../../analyzer/ir/index.js';
import { IRNodeType } from '../../analyzer/ir/index.js';
import { createEmitter } from '../create-emitter.js';

describe('emitImport - Mixed Imports', () => {
  it('should emit default + single named import', () => {
    const emitter = createEmitter();

    const importIR: IImportIR = {
      type: IRNodeType.IMPORT,
      source: 'react',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          imported: 'React',
          local: 'React',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useState',
          local: 'useState',
        },
      ],
      metadata: {},
    };

    const code = emitter.emit(importIR);

    expect(code).toContain("import React, { useState } from 'react';");
  });

  it('should emit default + multiple named imports', () => {
    const emitter = createEmitter();

    const importIR: IImportIR = {
      type: IRNodeType.IMPORT,
      source: 'react',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          imported: 'React',
          local: 'React',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useState',
          local: 'useState',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useEffect',
          local: 'useEffect',
        },
      ],
      metadata: {},
    };

    const code = emitter.emit(importIR);

    expect(code).toContain("import React, { useEffect, useState } from 'react';");
  });

  it('should emit default + aliased named import', () => {
    const emitter = createEmitter();

    const importIR: IImportIR = {
      type: IRNodeType.IMPORT,
      source: 'react',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          imported: 'React',
          local: 'React',
        },
        {
          type: 'ImportSpecifier',
          imported: 'Component',
          local: 'C',
        },
      ],
      metadata: {},
    };

    const code = emitter.emit(importIR);

    expect(code).toContain("import React, { Component as C } from 'react';");
  });

  it('should emit default + mixed aliased and non-aliased', () => {
    const emitter = createEmitter();

    const importIR: IImportIR = {
      type: IRNodeType.IMPORT,
      source: 'react',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          imported: 'React',
          local: 'React',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useState',
          local: 'useState',
        },
        {
          type: 'ImportSpecifier',
          imported: 'Component',
          local: 'C',
        },
      ],
      metadata: {},
    };

    const code = emitter.emit(importIR);

    expect(code).toContain("import React, { Component as C, useState } from 'react';");
  });

  it('should handle sorting with mixed imports', () => {
    const emitter = createEmitter();

    const importIR: IImportIR = {
      type: IRNodeType.IMPORT,
      source: 'react',
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          imported: 'React',
          local: 'React',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useEffect',
          local: 'useEffect',
        },
        {
          type: 'ImportSpecifier',
          imported: 'useState',
          local: 'useState',
        },
      ],
      metadata: {},
    };

    const code = emitter.emit(importIR);

    // Named imports should be alphabetically sorted
    expect(code).toContain("import React, { useEffect, useState } from 'react';");
  });
});
