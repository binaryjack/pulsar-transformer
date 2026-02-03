/**
 * Import Declaration Parser Tests
 *
 * Tests for parsing import statements in PSR files.
 */

import { describe, expect, it } from 'vitest';
import type { IImportDeclarationNode, IProgramNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import { createParser } from '../create-parser.js';

describe('parseImportDeclaration', () => {
  describe('named imports', () => {
    it('should parse single named import', () => {
      const parser = createParser();
      const source = `import { createSignal } from '@pulsar/runtime';`;
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('createSignal');
      expect(importDecl.source.value).toBe('@pulsar/runtime');
    });

    it('should parse multiple named imports', () => {
      const parser = createParser();
      const source = `import { createSignal, createEffect, createMemo } from '@pulsar/runtime';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(3);
      expect(importDecl.specifiers[0].name).toBe('createSignal');
      expect(importDecl.specifiers[1].name).toBe('createEffect');
      expect(importDecl.specifiers[2].name).toBe('createMemo');
      expect(importDecl.source.value).toBe('@pulsar/runtime');
    });

    it('should parse import from relative path', () => {
      const parser = createParser();
      const source = `import { Button } from './components';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('Button');
      expect(importDecl.source.value).toBe('./components');
    });

    it('should parse import from parent directory', () => {
      const parser = createParser();
      const source = `import { utils } from '../utils';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('utils');
      expect(importDecl.source.value).toBe('../utils');
    });

    it('should parse import from deep path', () => {
      const parser = createParser();
      const source = `import { Helper } from '../../shared/helpers/utils';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.source.value).toBe('../../shared/helpers/utils');
    });

    it('should parse import with trailing comma', () => {
      const parser = createParser();
      const source = `import { createSignal, createEffect, } from '@pulsar/runtime';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(2);
      expect(importDecl.specifiers[0].name).toBe('createSignal');
      expect(importDecl.specifiers[1].name).toBe('createEffect');
    });

    it('should parse import without semicolon', () => {
      const parser = createParser();
      const source = `import { Button } from './components'`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('Button');
    });
  });

  describe('default imports', () => {
    it('should parse default import', () => {
      const parser = createParser();
      const source = `import React from 'react';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('React');
      expect(importDecl.source.value).toBe('react');
    });

    it('should parse default import from relative path', () => {
      const parser = createParser();
      const source = `import App from './App';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('App');
      expect(importDecl.source.value).toBe('./App');
    });
  });

  describe('side-effect imports', () => {
    it('should parse side-effect import (CSS)', () => {
      const parser = createParser();
      const source = `import './styles.css';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(0);
      expect(importDecl.source.value).toBe('./styles.css');
    });

    it('should parse side-effect import (JS)', () => {
      const parser = createParser();
      const source = `import './polyfills';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(0);
      expect(importDecl.source.value).toBe('./polyfills');
    });

    it('should parse side-effect import with semicolon', () => {
      const parser = createParser();
      const source = `import './setup.js';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(0);
      expect(importDecl.source.value).toBe('./setup.js');
    });
  });

  describe('multiple imports in file', () => {
    it('should parse multiple import statements', () => {
      const parser = createParser();
      const source = `
import { createSignal } from '@pulsar/runtime';
import { Button } from './components';
import './styles.css';
      `.trim();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(3);

      const import1 = ast.body[0] as IImportDeclarationNode;
      expect(import1.type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(import1.specifiers[0].name).toBe('createSignal');
      expect(import1.source.value).toBe('@pulsar/runtime');

      const import2 = ast.body[1] as IImportDeclarationNode;
      expect(import2.specifiers[0].name).toBe('Button');
      expect(import2.source.value).toBe('./components');

      const import3 = ast.body[2] as IImportDeclarationNode;
      expect(import3.specifiers).toHaveLength(0);
      expect(import3.source.value).toBe('./styles.css');
    });
  });

  describe('imports with components', () => {
    it('should parse imports before component', () => {
      const parser = createParser();
      const source = `
import { createSignal } from '@pulsar/runtime';

component Counter() {
  const [count, setCount] = createSignal(0);
  return <div>$(count)</div>;
}
      `.trim();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(2);

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(importDecl.specifiers[0].name).toBe('createSignal');

      const component = ast.body[1];
      expect(component.type).toBe(ASTNodeType.COMPONENT_DECLARATION);
    });

    it('should parse multiple imports before component', () => {
      const parser = createParser();
      const source = `
import { createSignal, createEffect } from '@pulsar/runtime';
import { Button } from './components';
import './app.css';

component App() {
  return <div><Button /></div>;
}
      `.trim();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(4);

      expect(ast.body[0].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[1].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[2].type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(ast.body[3].type).toBe(ASTNodeType.COMPONENT_DECLARATION);
    });
  });

  describe('edge cases', () => {
    it('should handle empty import specifiers', () => {
      const parser = createParser();
      const source = `import { } from 'module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(0);
    });

    it('should parse import with whitespace variations', () => {
      const parser = createParser();
      const source = `import   {   createSignal   ,   createEffect   }   from   '@pulsar/runtime'   ;`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(2);
      expect(importDecl.specifiers[0].name).toBe('createSignal');
      expect(importDecl.specifiers[1].name).toBe('createEffect');
    });

    it('should parse import with single quotes', () => {
      const parser = createParser();
      const source = `import { Button } from './components';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.source.value).toBe('./components');
    });

    it('should parse import with double quotes', () => {
      const parser = createParser();
      const source = `import { Button } from "./components";`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.source.value).toBe('./components');
    });
  });

  describe('real-world examples', () => {
    it('should parse React-style imports', () => {
      const parser = createParser();
      const source = `import { useState, useEffect } from 'react';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(2);
      expect(importDecl.specifiers[0].name).toBe('useState');
      expect(importDecl.specifiers[1].name).toBe('useEffect');
      expect(importDecl.source.value).toBe('react');
    });

    it('should parse library imports', () => {
      const parser = createParser();
      const source = `import { format } from 'date-fns';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers[0].name).toBe('format');
      expect(importDecl.source.value).toBe('date-fns');
    });

    it('should parse scoped package imports', () => {
      const parser = createParser();
      const source = `import { Chart } from '@chartjs/core';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers[0].name).toBe('Chart');
      expect(importDecl.source.value).toBe('@chartjs/core');
    });

    it('should parse complete PSR file with imports', () => {
      const parser = createParser();
      const source = `
import { createSignal } from '@pulsar/runtime';
import { Button, Card } from './components';
import { formatDate } from '../utils';
import './Counter.css';

component Counter() {
  const [count, setCount] = createSignal(0);
  
  return <div>Counter</div>;
}
      `.trim();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body.length).toBeGreaterThanOrEqual(5);

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];
      expect(imports).toHaveLength(4);

      // Verify each import
      expect(imports[0].specifiers[0].name).toBe('createSignal');
      expect(imports[0].source.value).toBe('@pulsar/runtime');

      expect(imports[1].specifiers).toHaveLength(2);
      expect(imports[1].specifiers[0].name).toBe('Button');
      expect(imports[1].specifiers[1].name).toBe('Card');
      expect(imports[1].source.value).toBe('./components');

      expect(imports[2].specifiers[0].name).toBe('formatDate');
      expect(imports[2].source.value).toBe('../utils');

      expect(imports[3].specifiers).toHaveLength(0);
      expect(imports[3].source.value).toBe('./Counter.css');

      // Verify component is parsed
      const component = ast.body.find((node) => node.type === ASTNodeType.COMPONENT_DECLARATION);
      expect(component).toBeDefined();
    });
  });

  describe('location information', () => {
    it('should provide accurate location data', () => {
      const parser = createParser();
      const source = `import { createSignal } from '@pulsar/runtime';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.location).toBeDefined();
      expect(importDecl.location.start).toBeDefined();
      expect(importDecl.location.end).toBeDefined();
      expect(importDecl.location.start.line).toBe(1);
      expect(importDecl.location.start.column).toBeGreaterThanOrEqual(0);
    });

    it('should provide location for specifiers', () => {
      const parser = createParser();
      const source = `import { createSignal, createEffect } from '@pulsar/runtime';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers[0].location).toBeDefined();
      expect(importDecl.specifiers[1].location).toBeDefined();
    });

    it('should provide location for source', () => {
      const parser = createParser();
      const source = `import { Button } from './components';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.source.location).toBeDefined();
      expect(importDecl.source.location.start.line).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle missing from keyword', () => {
      const parser = createParser({ collectErrors: true });
      const source = `import { Button } './components';`;

      parser.parse(source);

      expect(parser.hasErrors()).toBe(true);
      const errors = parser.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('MISSING_FROM');
    });

    it('should recover from missing from keyword', () => {
      const parser = createParser({ collectErrors: true });
      const source = `
import { Button } './components';
component App() { return <div />; }
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      // Should parse the component even after import error
      const component = ast.body.find((node) => node.type === ASTNodeType.COMPONENT_DECLARATION);
      expect(component).toBeDefined();
    });
  });
});
