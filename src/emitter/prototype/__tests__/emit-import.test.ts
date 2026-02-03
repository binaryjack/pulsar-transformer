/**
 * Tests for _emitImport
 *
 * Validates import emission, preservation, merging, and deduplication.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { IImportIR } from '../../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../../analyzer/ir/ir-node-types.js';
import { createEmitter } from '../../create-emitter.js';
import type { IEmitter } from '../../emitter.types.js';

describe('Emitter: _emitImport', () => {
  let emitter: IEmitter;

  beforeEach(() => {
    emitter = createEmitter();
  });

  describe('Basic Import Emission', () => {
    it('should add named import to tracker', () => {
      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: '@pulsar/core',
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: 'createSignal',
            imported: 'createSignal',
          },
        ],
        metadata: {},
      };

      const result = emitter.emit(importIR);

      expect(result).toContain("import { createSignal } from '@pulsar/core';");
    });

    it('should add multiple named imports from same source to tracker', () => {
      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: '@pulsar/core',
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: 'createSignal',
            imported: 'createSignal',
          },
          {
            type: 'ImportSpecifier',
            local: 'createEffect',
            imported: 'createEffect',
          },
        ],
        metadata: {},
      };

      const result = emitter.emit(importIR);

      // Specifiers are sorted alphabetically
      expect(result).toContain("import { createEffect, createSignal } from '@pulsar/core';");
    });

    it('should add side-effect import to tracker', () => {
      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './styles.css',
        specifiers: [],
        metadata: {},
      };

      const result = emitter.emit(importIR);

      expect(result).toContain("import './styles.css';");
    });
  });

  describe('Default Import Emission', () => {
    it('should emit default import correctly', () => {
      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: 'React',
            imported: 'React',
          },
        ],
        metadata: {},
      };

      const result = emitter.emit(importIR);

      // Should format as: import React from 'react';
      expect(result).toContain("import React from 'react';");
      // Should NOT have braces
      expect(result).not.toContain('{ React }');
    });

    it('should emit multiple default imports from different sources', () => {
      const import1: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: 'React',
            imported: 'React',
          },
        ],
        metadata: {},
      };

      const import2: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'vue',
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: 'Vue',
            imported: 'Vue',
          },
        ],
        metadata: {},
      };

      // Emit both imports
      emitter.emit(import1);
      const result = emitter.emit(import2);

      expect(result).toContain("import React from 'react';");
      expect(result).toContain("import Vue from 'vue';");
    });

    it('should merge default and named imports from same source', () => {
      const defaultImport: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: 'React',
            imported: 'React',
          },
        ],
        metadata: {},
      };

      const namedImport: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: 'useState',
            imported: 'useState',
          },
          {
            type: 'ImportSpecifier',
            local: 'useEffect',
            imported: 'useEffect',
          },
        ],
        metadata: {},
      };

      // Emit both - should merge into: import React, { useEffect, useState } from 'react';
      emitter.emit(defaultImport);
      const result = emitter.emit(namedImport);

      expect(result).toContain("import React, { useEffect, useState } from 'react';");
    });
  });

  describe('Namespace Import Emission', () => {
    it('should emit namespace import correctly', () => {
      const importIR: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: 'utils',
            imported: '*',
          },
        ],
        metadata: {},
      };

      const result = emitter.emit(importIR);

      // Should format as: import * as utils from './utils';
      expect(result).toContain("import * as utils from './utils';");
    });

    it('should emit multiple namespace imports from different sources', () => {
      const import1: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: 'utils',
            imported: '*',
          },
        ],
        metadata: {},
      };

      const import2: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './helpers',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: 'helpers',
            imported: '*',
          },
        ],
        metadata: {},
      };

      emitter.emit(import1);
      const result = emitter.emit(import2);

      expect(result).toContain("import * as utils from './utils';");
      expect(result).toContain("import * as helpers from './helpers';");
    });

    it('should handle namespace import alongside named imports from different source', () => {
      const namespaceImport: IImportIR = {
        type: IRNodeType.IMPORT,
        source: './utils',
        specifiers: [
          {
            type: 'ImportNamespaceSpecifier',
            local: 'utils',
            imported: '*',
          },
        ],
        metadata: {},
      };

      const namedImport: IImportIR = {
        type: IRNodeType.IMPORT,
        source: 'react',
        specifiers: [
          {
            type: 'ImportSpecifier',
            local: 'useState',
            imported: 'useState',
          },
        ],
        metadata: {},
      };

      emitter.emit(namespaceImport);
      const result = emitter.emit(namedImport);

      expect(result).toContain("import * as utils from './utils';");
      expect(result).toContain("import { useState } from 'react';");
    });
  });
});
