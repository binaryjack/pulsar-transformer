/**
 * Tests for class declaration parsing
 *
 * Covers:
 * - Basic classes
 * - Inheritance (extends)
 * - Generic classes
 * - Abstract classes
 * - Properties (with access modifiers)
 * - Methods (instance and static)
 * - Constructors
 * - Getters and setters
 */

import { describe, expect, it } from 'vitest';
import type {
  IClassDeclarationNode,
  IConstructorDefinitionNode,
  IMethodDefinitionNode,
  IProgramNode,
  IPropertyDefinitionNode,
} from '../ast/ast-node-types.js';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { createParser } from '../create-parser.js';

describe('Class Declaration Parsing', () => {
  describe('Basic Classes', () => {
    it('should parse empty class', () => {
      const source = 'class Empty {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(1);
      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.type).toBe(ASTNodeType.CLASS_DECLARATION);
      expect(classNode.name.name).toBe('Empty');
      expect(classNode.superClass).toBeNull();
      expect(classNode.abstract).toBe(false);
      expect(classNode.body.members).toHaveLength(0);
    });

    it('should parse class with single property', () => {
      const source = `
        class User {
          name: string;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.body.members).toHaveLength(1);

      const prop = classNode.body.members[0] as IPropertyDefinitionNode;
      expect(prop.type).toBe(ASTNodeType.PROPERTY_DEFINITION);
      expect(prop.name.name).toBe('name');
      expect(prop.typeAnnotation?.typeString).toBe('string');
      expect(prop.static).toBe(false);
      expect(prop.readonly).toBe(false);
      expect(prop.accessModifier).toBeNull();
    });

    it('should parse class with multiple properties', () => {
      const source = `
        class User {
          name: string;
          age: number;
          active: boolean;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.body.members).toHaveLength(3);

      const names = classNode.body.members.map((m) => (m as IPropertyDefinitionNode).name.name);
      expect(names).toEqual(['name', 'age', 'active']);
    });

    it('should parse class with property initializers', () => {
      const source = `
        class Config {
          apiKey: string = "abc123";
          timeout: number = 5000;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop1 = classNode.body.members[0] as IPropertyDefinitionNode;
      const prop2 = classNode.body.members[1] as IPropertyDefinitionNode;

      expect(prop1.initializer).toBeDefined();
      expect(prop2.initializer).toBeDefined();
    });
  });

  describe('Constructors', () => {
    it('should parse empty constructor', () => {
      const source = `
        class User {
          constructor() {}
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const ctor = classNode.body.members[0] as IConstructorDefinitionNode;

      expect(ctor.type).toBe(ASTNodeType.CONSTRUCTOR_DEFINITION);
      expect(ctor.parameters).toHaveLength(0);
    });

    it('should parse constructor with parameters', () => {
      const source = `
        class User {
          constructor(name: string, age: number) {
            this.name = name;
            this.age = age;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const ctor = classNode.body.members[0] as IConstructorDefinitionNode;

      expect(ctor.parameters).toHaveLength(2);
      expect(ctor.parameters[0].name.name).toBe('name');
      expect(ctor.parameters[1].name.name).toBe('age');
    });

    it('should parse constructor with body', () => {
      const source = `
        class User {
          constructor(name: string) {
            this.name = name;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const ctor = classNode.body.members[0] as IConstructorDefinitionNode;

      expect(ctor.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
      expect(ctor.body.body.length).toBeGreaterThan(0);
    });
  });

  describe('Methods', () => {
    it('should parse basic method', () => {
      const source = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.type).toBe(ASTNodeType.METHOD_DEFINITION);
      expect(method.name.name).toBe('add');
      expect(method.kind).toBe('method');
      expect(method.parameters).toHaveLength(2);
      expect(method.returnType?.typeString).toBe('number');
    });

    it('should parse method without return type', () => {
      const source = `
        class Logger {
          log(message: string) {
            console.log(message);
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.name.name).toBe('log');
      expect(method.returnType).toBeNull();
    });

    it('should parse async method', () => {
      const source = `
        class DataService {
          async fetchData(): Promise<Data> {
            return await fetch();
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.async).toBe(true);
      expect(method.name.name).toBe('fetchData');
    });

    it('should parse generator method', () => {
      const source = `
        class Generator {
          *generate() {
            yield 1;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.generator).toBe(true);
      expect(method.name.name).toBe('generate');
    });
  });

  describe('Inheritance', () => {
    it('should parse class with extends', () => {
      const source = 'class Admin extends User {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.name.name).toBe('Admin');
      expect(classNode.superClass?.name).toBe('User');
    });

    it('should parse class extending generic base', () => {
      const source = 'class MyList extends Array<string> {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.superClass?.name).toBe('Array');
    });
  });

  describe('Static Members', () => {
    it('should parse static property', () => {
      const source = `
        class MathUtils {
          static PI = 3.14159;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.static).toBe(true);
      expect(prop.name.name).toBe('PI');
    });

    it('should parse static method', () => {
      const source = `
        class MathUtils {
          static square(n: number): number {
            return n * n;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.static).toBe(true);
      expect(method.name.name).toBe('square');
    });
  });

  describe('Getters and Setters', () => {
    it('should parse getter', () => {
      const source = `
        class Temperature {
          get celsius(): number {
            return this._celsius;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const getter = classNode.body.members[0] as IMethodDefinitionNode;

      expect(getter.kind).toBe('get');
      expect(getter.name.name).toBe('celsius');
      expect(getter.parameters).toHaveLength(0);
    });

    it('should parse setter', () => {
      const source = `
        class Temperature {
          set celsius(value: number) {
            this._celsius = value;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const setter = classNode.body.members[0] as IMethodDefinitionNode;

      expect(setter.kind).toBe('set');
      expect(setter.name.name).toBe('celsius');
      expect(setter.parameters).toHaveLength(1);
    });

    it('should parse static getter', () => {
      const source = `
        class Config {
          static get instance(): Config {
            return _instance;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const getter = classNode.body.members[0] as IMethodDefinitionNode;

      expect(getter.static).toBe(true);
      expect(getter.kind).toBe('get');
    });
  });

  describe('Access Modifiers', () => {
    it('should parse public property', () => {
      const source = `
        class User {
          public name: string;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.accessModifier).toBe('public');
    });

    it('should parse private property', () => {
      const source = `
        class BankAccount {
          private balance: number;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.accessModifier).toBe('private');
    });

    it('should parse protected property', () => {
      const source = `
        class Base {
          protected data: string;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.accessModifier).toBe('protected');
    });

    it('should parse private method', () => {
      const source = `
        class Service {
          private validate(): boolean {
            return true;
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.accessModifier).toBe('private');
    });
  });

  describe('Readonly Properties', () => {
    it('should parse readonly property', () => {
      const source = `
        class Config {
          readonly apiKey: string = "abc123";
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.readonly).toBe(true);
    });

    it('should parse public readonly property', () => {
      const source = `
        class Config {
          public readonly version: string = "1.0";
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.readonly).toBe(true);
      expect(prop.accessModifier).toBe('public');
    });
  });

  describe('Generic Classes', () => {
    it('should parse class with single type parameter', () => {
      const source = `
        class Box<T> {
          value: T;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.typeParameters).toBeTruthy();
      expect(classNode.typeParameters).toContain('T');
    });

    it('should parse class with multiple type parameters', () => {
      const source = `
        class Pair<T, U> {
          first: T;
          second: U;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.typeParameters).toBeTruthy();
    });
  });

  describe('Abstract Classes', () => {
    it('should parse abstract class', () => {
      const source = `
        abstract class Shape {
          abstract area(): number;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.abstract).toBe(true);
    });

    it('should parse abstract method', () => {
      const source = `
        abstract class Animal {
          abstract makeSound(): void;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const method = classNode.body.members[0] as IMethodDefinitionNode;

      expect(method.abstract).toBe(true);
    });

    it('should parse abstract class with concrete method', () => {
      const source = `
        abstract class Animal {
          abstract makeSound(): void;

          move(): void {
            console.log('Moving...');
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.body.members).toHaveLength(2);

      const abstractMethod = classNode.body.members[0] as IMethodDefinitionNode;
      const concreteMethod = classNode.body.members[1] as IMethodDefinitionNode;

      expect(abstractMethod.abstract).toBe(true);
      expect(concreteMethod.abstract).toBe(false);
    });
  });

  describe('Complex Classes', () => {
    it('should parse class with mixed members', () => {
      const source = `
        class UserService {
          private static instance: UserService;
          public readonly name: string = "UserService";

          private constructor() {}

          public static getInstance(): UserService {
            return this.instance;
          }

          public async getUser(id: string): Promise<User> {
            return await fetch();
          }
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.body.members.length).toBeGreaterThan(0);
    });

    it('should parse class extending generic with own generics', () => {
      const source = `
        class Repository<T> extends BaseRepository<T> {
          items: T[];
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.typeParameters).toBeTruthy();
      expect(classNode.superClass?.name).toBe('BaseRepository');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty constructor body', () => {
      const source = `
        class User {
          constructor() {}
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const ctor = classNode.body.members[0] as IConstructorDefinitionNode;

      expect(ctor.body.body).toHaveLength(0);
    });

    it('should handle semicolons between members', () => {
      const source = `
        class User {
          name: string;
          age: number;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.body.members).toHaveLength(2);
    });

    it('should parse multiple classes in one file', () => {
      const source = `
        class User {}
        class Admin extends User {}
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(2);
      expect((ast.body[0] as IClassDeclarationNode).name.name).toBe('User');
      expect((ast.body[1] as IClassDeclarationNode).name.name).toBe('Admin');
    });
  });

  describe('Location Tracking', () => {
    it('should track class declaration location', () => {
      const source = 'class User {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      expect(classNode.location).toBeDefined();
      expect(classNode.location.start).toBeDefined();
      expect(classNode.location.end).toBeDefined();
    });

    it('should track member locations', () => {
      const source = `
        class User {
          name: string;
        }
      `;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;

      const classNode = ast.body[0] as IClassDeclarationNode;
      const prop = classNode.body.members[0] as IPropertyDefinitionNode;

      expect(prop.location).toBeDefined();
    });
  });
});
