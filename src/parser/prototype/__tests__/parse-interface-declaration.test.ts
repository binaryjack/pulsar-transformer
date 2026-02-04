import { describe, it, expect } from 'vitest';
import { createParser } from '../../create-parser.js';
import { ASTNodeType } from '../../ast/index.js';
import type { IInterfaceDeclarationNode } from '../../ast/index.js';

describe('parseInterfaceDeclaration', () => {
  describe('Basic Interfaces', () => {
    it('should parse empty interface', () => {
      const source = 'interface IEmpty {}';
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.type).toBe(ASTNodeType.INTERFACE_DECLARATION);
      expect(interfaceDecl.name.name).toBe('IEmpty');
      expect(interfaceDecl.extends).toBeUndefined();
      expect(interfaceDecl.body).toBe('');
    });

    it('should parse interface with properties', () => {
      const source = `interface IUser {
  name: string;
  age: number;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.type).toBe(ASTNodeType.INTERFACE_DECLARATION);
      expect(interfaceDecl.name.name).toBe('IUser');
      expect(interfaceDecl.body).toContain('name: string');
      expect(interfaceDecl.body).toContain('age: number');
    });

    it('should parse interface with methods', () => {
      const source = `interface ICalculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.type).toBe(ASTNodeType.INTERFACE_DECLARATION);
      expect(interfaceDecl.name.name).toBe('ICalculator');
      expect(interfaceDecl.body).toContain('add(a: number, b: number): number');
      expect(interfaceDecl.body).toContain('subtract(a: number, b: number): number');
    });

    it('should parse interface with optional properties', () => {
      const source = `interface IConfig {
  host: string;
  port?: number;
  ssl?: boolean;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('port?: number');
      expect(interfaceDecl.body).toContain('ssl?: boolean');
    });

    it('should parse interface with readonly properties', () => {
      const source = `interface IPoint {
  readonly x: number;
  readonly y: number;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('readonly x: number');
      expect(interfaceDecl.body).toContain('readonly y: number');
    });
  });

  describe('Extends Clause', () => {
    it('should parse interface extending single interface', () => {
      const source = 'interface IEmployee extends IPerson {}';
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.type).toBe(ASTNodeType.INTERFACE_DECLARATION);
      expect(interfaceDecl.name.name).toBe('IEmployee');
      expect(interfaceDecl.extends).toHaveLength(1);
      expect(interfaceDecl.extends![0].name).toBe('IPerson');
    });

    it('should parse interface extending multiple interfaces', () => {
      const source = 'interface IExtended extends IBase, IMixin, IHelper {}';
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.extends).toHaveLength(3);
      expect(interfaceDecl.extends![0].name).toBe('IBase');
      expect(interfaceDecl.extends![1].name).toBe('IMixin');
      expect(interfaceDecl.extends![2].name).toBe('IHelper');
    });

    it('should parse interface extending with properties', () => {
      const source = `interface IManager extends IEmployee {
  department: string;
  teamSize: number;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.extends).toHaveLength(1);
      expect(interfaceDecl.extends![0].name).toBe('IEmployee');
      expect(interfaceDecl.body).toContain('department: string');
      expect(interfaceDecl.body).toContain('teamSize: number');
    });
  });

  describe('Complex Types', () => {
    it('should parse interface with nested object types', () => {
      const source = `interface IConfig {
  server: {
    host: string;
    port: number;
  };
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('server: {');
      expect(interfaceDecl.body).toContain('host: string');
      expect(interfaceDecl.body).toContain('port: number');
    });

    it('should parse interface with array types', () => {
      const source = `interface IData {
  items: string[];
  matrix: number[][];
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('items: string[]');
      expect(interfaceDecl.body).toContain('matrix: number[][]');
    });

    it('should parse interface with union types', () => {
      const source = `interface IResponse {
  status: 'success' | 'error' | 'pending';
  data: string | number | null;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain("'success' | 'error' | 'pending'");
      expect(interfaceDecl.body).toContain('string | number | null');
    });

    it('should parse interface with generic types', () => {
      const source = `interface IContainer<T> {
  value: T;
  get(): T;
  set(val: T): void;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.name.name).toBe('IContainer');
      expect(interfaceDecl.body).toContain('value: T');
      expect(interfaceDecl.body).toContain('get(): T');
      expect(interfaceDecl.body).toContain('set(val: T): void');
    });

    it('should parse interface with function types', () => {
      const source = `interface IEventHandler {
  onClick: (event: MouseEvent) => void;
  onSubmit: (data: FormData) => Promise<void>;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('onClick: (event: MouseEvent) => void');
      expect(interfaceDecl.body).toContain('onSubmit: (data: FormData) => Promise<void>');
    });
  });

  describe('Edge Cases', () => {
    it('should parse interface with semicolon terminator', () => {
      const source = 'interface ITest { value: string; };';
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.type).toBe(ASTNodeType.INTERFACE_DECLARATION);
      expect(interfaceDecl.name.name).toBe('ITest');
    });

    it('should parse interface with trailing comma', () => {
      const source = `interface IOptions {
  a: string,
  b: number,
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      const interfaceDecl = ast.body[0] as IInterfaceDeclarationNode;
      expect(interfaceDecl.body).toContain('a: string');
      expect(interfaceDecl.body).toContain('b: number');
    });

    it('should parse multiple interface declarations', () => {
      const source = `interface IFirst {
  a: string;
}

interface ISecond {
  b: number;
}`;
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(2);
      const first = ast.body[0] as IInterfaceDeclarationNode;
      const second = ast.body[1] as IInterfaceDeclarationNode;

      expect(first.name.name).toBe('IFirst');
      expect(second.name.name).toBe('ISecond');
    });
  });
});
