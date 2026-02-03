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
});
