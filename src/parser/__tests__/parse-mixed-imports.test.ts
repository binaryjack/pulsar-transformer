/**
 * Mixed Import Tests
 *
 * Tests for mixed import declarations (default + named in single statement).
 */

import { describe, expect, it } from 'vitest';
import { createParser } from '../create-parser.js';

describe('parseImportDeclaration - Mixed Imports', () => {
  describe('default + named imports', () => {
    it('should parse default import with single named import', () => {
      const source = `import React, { useState } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
      const importNode = ast.body[0];

      expect(importNode.type).toBe('ImportDeclaration');
      expect(importNode.importKind).toBe('mixed');
      expect(importNode.source.value).toBe('react');
      expect(importNode.specifiers).toHaveLength(2);

      // First specifier is default
      expect(importNode.specifiers[0].name).toBe('React');
      expect(importNode.specifiers[0].alias).toBeUndefined();

      // Second specifier is named
      expect(importNode.specifiers[1].name).toBe('useState');
      expect(importNode.specifiers[1].alias).toBeUndefined();
    });

    it('should parse default import with multiple named imports', () => {
      const source = `import React, { useState, useEffect } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const importNode = ast.body[0];

      expect(importNode.importKind).toBe('mixed');
      expect(importNode.specifiers).toHaveLength(3);
      expect(importNode.specifiers[0].name).toBe('React');
      expect(importNode.specifiers[1].name).toBe('useState');
      expect(importNode.specifiers[2].name).toBe('useEffect');
    });

    it('should parse default import with aliased named imports', () => {
      const source = `import React, { Component as C } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const importNode = ast.body[0];

      expect(importNode.importKind).toBe('mixed');
      expect(importNode.specifiers).toHaveLength(2);

      // Default
      expect(importNode.specifiers[0].name).toBe('React');
      expect(importNode.specifiers[0].alias).toBeUndefined();

      // Named with alias
      expect(importNode.specifiers[1].name).toBe('Component');
      expect(importNode.specifiers[1].alias).toBe('C');
    });

    it('should parse default import with mixed aliased and non-aliased', () => {
      const source = `import React, { useState, Component as C } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const importNode = ast.body[0];

      expect(importNode.importKind).toBe('mixed');
      expect(importNode.specifiers).toHaveLength(3);
      expect(importNode.specifiers[0].name).toBe('React');
      expect(importNode.specifiers[1].name).toBe('useState');
      expect(importNode.specifiers[1].alias).toBeUndefined();
      expect(importNode.specifiers[2].name).toBe('Component');
      expect(importNode.specifiers[2].alias).toBe('C');
    });

    it('should handle trailing comma in named imports', () => {
      const source = `import React, { useState, useEffect, } from 'react';`;

      const parser = createParser();
      const ast = parser.parse(source);

      const importNode = ast.body[0];

      expect(importNode.importKind).toBe('mixed');
      expect(importNode.specifiers).toHaveLength(3);
      expect(importNode.specifiers[0].name).toBe('React');
      expect(importNode.specifiers[1].name).toBe('useState');
      expect(importNode.specifiers[2].name).toBe('useEffect');
    });
  });
});
