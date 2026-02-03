/**
 * Import Parsing Integration Tests
 *
 * End-to-end tests verifying imports work through the full transformation pipeline.
 */

import { describe, expect, it } from 'vitest';
import type { IImportDeclarationNode, IProgramNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import { createParser } from '../create-parser.js';

describe('Import Parsing Integration', () => {
  describe('real-world PSR files', () => {
    it('should preserve utility imports', () => {
      const parser = createParser();
      const source = `
import { formatDate, calculateAge } from './utils';

component UserProfile() {
  return <div>User Profile</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      // Should have import + component
      expect(ast.body).toHaveLength(2);

      // Import should be preserved
      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(importDecl.specifiers).toHaveLength(2);
      expect(importDecl.specifiers[0].name).toBe('formatDate');
      expect(importDecl.specifiers[1].name).toBe('calculateAge');
      expect(importDecl.source.value).toBe('./utils');
    });

    it('should preserve component imports', () => {
      const parser = createParser();
      const source = `
import { Button, Card, Modal } from './components';

component Dashboard() {
  return <div>Dashboard</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(3);
      expect(importDecl.specifiers.map((s) => s.name)).toEqual(['Button', 'Card', 'Modal']);
    });

    it('should preserve library imports', () => {
      const parser = createParser();
      const source = `
import { format } from 'date-fns';
import { debounce } from 'lodash';

component SearchBox() {
  return <input />;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      expect(imports).toHaveLength(2);
      expect(imports[0].source.value).toBe('date-fns');
      expect(imports[1].source.value).toBe('lodash');
    });

    it('should preserve side-effect imports', () => {
      const parser = createParser();
      const source = `
import './reset.css';
import './app.css';
import './theme.css';

component App() {
  return <div>Hello</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      expect(imports).toHaveLength(3);
      expect(imports.every((imp) => imp.specifiers.length === 0)).toBe(true);
      expect(imports[0].source.value).toBe('./reset.css');
      expect(imports[1].source.value).toBe('./app.css');
      expect(imports[2].source.value).toBe('./theme.css');
    });

    it('should handle mixed import types', () => {
      const parser = createParser();
      const source = `
import { createSignal } from '@pulsar/runtime';
import Button from './Button';
import { formatCurrency, validateEmail } from '../utils';
import './styles.css';

component PaymentForm() {
  return <div>Payment Form</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      expect(imports).toHaveLength(4);

      // Named import from package
      expect(imports[0].specifiers[0].name).toBe('createSignal');
      expect(imports[0].source.value).toBe('@pulsar/runtime');

      // Default import
      expect(imports[1].specifiers[0].name).toBe('Button');
      expect(imports[1].source.value).toBe('./Button');

      // Named imports from relative path
      expect(imports[2].specifiers.map((s) => s.name)).toEqual(['formatCurrency', 'validateEmail']);
      expect(imports[2].source.value).toBe('../utils');

      // Side-effect import
      expect(imports[3].specifiers).toHaveLength(0);
      expect(imports[3].source.value).toBe('./styles.css');
    });
  });

  describe('complex scenarios', () => {
    it('should handle imports in large file', () => {
      const parser = createParser();
      const source = `
import { createSignal, createEffect } from '@pulsar/runtime';
import { Header, Footer, Sidebar } from './layout';
import { LoginForm, RegisterForm } from './auth';
import { ProductCard, CartWidget } from './shop';
import { formatPrice, calculateDiscount } from '../utils/price';
import { validateEmail, sanitizeInput } from '../utils/validation';
import './app.css';
import './theme.css';

component ShopApp() {
  return <div>Shop App</div>;
}

component ProductList() {
  return <div>Products</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      const components = ast.body.filter((node) => node.type === ASTNodeType.COMPONENT_DECLARATION);

      expect(imports).toHaveLength(8);
      expect(components).toHaveLength(2);

      // Verify imports are before components
      const firstImportIndex = ast.body.findIndex(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      );
      const firstComponentIndex = ast.body.findIndex(
        (node) => node.type === ASTNodeType.COMPONENT_DECLARATION
      );

      expect(firstImportIndex).toBeLessThan(firstComponentIndex);
    });

    it('should handle imports with variable declarations', () => {
      const parser = createParser();
      const source = `
import { createSignal } from '@pulsar/runtime';
import { API_URL } from './config';

const TOKEN_KEY = 'auth_token';

component LoginForm() {
  return <form>Login Form</form>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      const variables = ast.body.filter((node) => node.type === ASTNodeType.VARIABLE_DECLARATION);

      expect(imports).toHaveLength(2);
      expect(variables).toHaveLength(1);
    });
  });

  describe('import ordering', () => {
    it('should preserve import order', () => {
      const parser = createParser();
      const source = `
import { z } from 'z-lib';
import { a } from 'a-lib';
import { m } from 'm-lib';

component Test() {
  return <div>Test</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      // Should preserve order as written, not alphabetize
      expect(imports[0].source.value).toBe('z-lib');
      expect(imports[1].source.value).toBe('a-lib');
      expect(imports[2].source.value).toBe('m-lib');
    });

    it('should handle imports at different locations', () => {
      const parser = createParser();
      const source = `
import { first } from './first';

component FirstComponent() {
  return <div>First</div>;
}

import { second } from './second';

component SecondComponent() {
  return <div>Second</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      // Should parse both imports even if interspersed
      const imports = ast.body.filter(
        (node) => node.type === ASTNodeType.IMPORT_DECLARATION
      ) as IImportDeclarationNode[];

      expect(imports).toHaveLength(2);
      expect(imports[0].source.value).toBe('./first');
      expect(imports[1].source.value).toBe('./second');
    });
  });

  describe('error recovery', () => {
    it('should continue parsing after malformed import', () => {
      const parser = createParser({ collectErrors: true });
      const source = `
import { Button } './components';

component ValidComponent() {
  return <div>Valid</div>;
}
      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      // Should have errors but continue
      expect(parser.hasErrors()).toBe(true);

      // Should still find the valid component
      const components = ast.body.filter((node) => node.type === ASTNodeType.COMPONENT_DECLARATION);
      expect(components).toHaveLength(1);
    });
  });

  describe('empty and whitespace handling', () => {
    it('should handle imports with varying whitespace', () => {
      const parser = createParser();
      const source = `import{a,b,c}from'./module';`;

      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(3);
      expect(importDecl.specifiers.map((s) => s.name)).toEqual(['a', 'b', 'c']);
    });

    it('should handle imports with multiple newlines', () => {
      const parser = createParser();
      const source = `

import { Button } from './components';


component App() {
  return <div>App</div>;
}

      `.trim();

      const ast = parser.parse(source) as IProgramNode;

      const imports = ast.body.filter((node) => node.type === ASTNodeType.IMPORT_DECLARATION);
      expect(imports).toHaveLength(1);
    });
  });
});
