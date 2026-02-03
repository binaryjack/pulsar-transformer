/**
 * Emit Import Aliases Tests
 *
 * Tests for import alias emission and formatting.
 */

import { describe, expect, it } from 'vitest';
import type { IImportIR } from '../../analyzer/ir/index.js';
import { IRNodeType } from '../../analyzer/ir/index.js';
import { createEmitter } from '../create-emitter.js';

describe('emitImport - Aliases', () => {
  describe('aliased named imports', () => {
    it('should emit single named import with alias', () => {
      const emitter = createEmitter();

      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'foo',
            local: 'bar',
          },
        ],
        metadata: {},
      };

      const code = emitter.emit(importIR);

      expect(code).toContain("import { foo as bar } from './utils';");
    });

    it('should emit multiple named imports with aliases', () => {
      const emitter = createEmitter();

      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'alpha',
            local: 'a',
          },
          {
            type: 'ImportSpecifier',
            imported: 'beta',
            local: 'b',
          },
        ],
        metadata: {},
      };

      const code = emitter.emit(importIR);

      // Alphabetical sorting by imported name
      expect(code).toContain("import { alpha as a, beta as b } from './utils';");
    });

    it('should emit mixed imports with and without aliases', () => {
      const emitter = createEmitter();

      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'foo',
            local: 'foo', // No alias
          },
          {
            type: 'ImportSpecifier',
            imported: 'bar',
            local: 'baz', // Aliased
          },
        ],
        metadata: {},
      };

      const code = emitter.emit(importIR);

      expect(code).toContain("import { bar as baz, foo } from './utils';");
    });

    it('should handle alias from npm package', () => {
      const emitter = createEmitter();

      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'Component',
            local: 'C',
          },
        ],
        metadata: {},
      };

      const code = emitter.emit(importIR);

      expect(code).toContain("import { Component as C } from 'react';");
    });
  });

  describe('mixed imports with aliases', () => {
    it('should emit default import with aliased named imports', () => {
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
  });

  describe('alphabetical sorting with aliases', () => {
    it('should sort by imported name, not local name', () => {
      const emitter = createEmitter();

      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'zebra',
            local: 'a', // Local name is 'a' but imported is 'zebra'
          },
          {
            type: 'ImportSpecifier',
            imported: 'apple',
            local: 'z', // Local name is 'z' but imported is 'apple'
          },
        ],
        metadata: {},
      };

      const code = emitter.emit(importIR);

      // Should sort by imported name: apple comes before zebra
      expect(code).toContain("import { apple as z, zebra as a } from './utils';");
    });
  });

  describe('import merging with aliases', () => {
    it('should merge aliased imports from same source', () => {
      const emitter = createEmitter();

      const import1: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'foo',
            local: 'bar',
          },
        ],
        metadata: {},
      };

      const import2: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: 'baz',
            local: 'qux',
          },
        ],
        metadata: {},
      };

      emitter.emit(import1);
      const code = emitter.emit(import2);

      // Should merge into single import
      expect(code).toContain("import { baz as qux, foo as bar } from './utils';");
      // Should only have one import statement for './utils'
      expect(code.split("from './utils'").length).toBe(2); // Split creates N+1 parts
    });
  });
});
