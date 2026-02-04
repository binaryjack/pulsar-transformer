import { describe, it, expect } from 'vitest';
import { createParser } from '../../create-parser.js';
import { ASTNodeType } from '../../ast/index.js';
import type { ITypeAliasNode } from '../../ast/index.js';

describe('parseTypeAlias', () => {
  describe('Literal Types', () => {
    it('should parse string literal type', () => {
      const source = "type Status = 'active';";
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.type).toBe(ASTNodeType.TYPE_ALIAS);
      expect(typeAlias.name.name).toBe('Status');
      expect(typeAlias.typeAnnotation).toBe("'active'");
    });

    it('should parse number literal type', () => {
      const source = 'type Zero = 0;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.name.name).toBe('Zero');
      expect(typeAlias.typeAnnotation).toBe('0');
    });

    it('should parse boolean literal type', () => {
      const source = 'type AlwaysTrue = true;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('true');
    });
  });

  describe('Union Types', () => {
    it('should parse simple union type', () => {
      const source = "type Status = 'idle' | 'loading' | 'success' | 'error';";
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.name.name).toBe('Status');
      expect(typeAlias.typeAnnotation).toContain("'idle'");
      expect(typeAlias.typeAnnotation).toContain("'loading'");
      expect(typeAlias.typeAnnotation).toContain("'success'");
      expect(typeAlias.typeAnnotation).toContain("'error'");
      expect(typeAlias.typeAnnotation).toContain('|');
    });

    it('should parse mixed type union', () => {
      const source = 'type Value = string | number | boolean | null;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('string');
      expect(typeAlias.typeAnnotation).toContain('number');
      expect(typeAlias.typeAnnotation).toContain('boolean');
      expect(typeAlias.typeAnnotation).toContain('null');
    });

    it('should parse object union type', () => {
      const source = 'type Response = { success: true; data: string } | { success: false; error: string };';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('success: true');
      expect(typeAlias.typeAnnotation).toContain('success: false');
      expect(typeAlias.typeAnnotation).toContain('|');
    });
  });

  describe('Object Types', () => {
    it('should parse simple object type', () => {
      const source = 'type User = { name: string; age: number };';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.name.name).toBe('User');
      expect(typeAlias.typeAnnotation).toContain('name: string');
      expect(typeAlias.typeAnnotation).toContain('age: number');
    });

    it('should parse object type with optional properties', () => {
      const source = 'type Config = { host: string; port?: number };';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('port?: number');
    });

    it('should parse nested object type', () => {
      const source = `type Data = {
  user: {
    name: string;
    profile: {
      bio: string;
    };
  };
};`;
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('user: {');
      expect(typeAlias.typeAnnotation).toContain('profile: {');
      expect(typeAlias.typeAnnotation).toContain('bio: string');
    });
  });

  describe('Array Types', () => {
    it('should parse array type with brackets', () => {
      const source = 'type Items = string[];';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('string[]');
    });

    it('should parse array type with Array<T>', () => {
      const source = 'type Items = Array<string>;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('Array<string>');
    });

    it('should parse multi-dimensional array', () => {
      const source = 'type Matrix = number[][];';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('number[][]');
    });
  });

  describe('Generic Types', () => {
    it('should parse simple generic type', () => {
      const source = 'type Nullable<T> = T | null;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.name.name).toBe('Nullable');
      expect(typeAlias.typeAnnotation).toBe('T | null');
    });

    it('should parse multiple generic parameters', () => {
      const source = 'type Result<T, E> = { value: T } | { error: E };';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.name.name).toBe('Result');
      expect(typeAlias.typeAnnotation).toContain('value: T');
      expect(typeAlias.typeAnnotation).toContain('error: E');
    });

    it('should parse constrained generic type', () => {
      const source = 'type KeyOf<T extends object> = keyof T;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('keyof T');
    });

    it('should parse generic with default type', () => {
      const source = 'type Optional<T = string> = T | undefined;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('T | undefined');
    });
  });

  describe('Function Types', () => {
    it('should parse simple function type', () => {
      const source = 'type Handler = () => void;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('() => void');
    });

    it('should parse function type with parameters', () => {
      const source = 'type Add = (a: number, b: number) => number;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('(a: number, b: number) => number');
    });

    it('should parse generic function type', () => {
      const source = 'type Transform<T, U> = (input: T) => U;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('(input: T) => U');
    });
  });

  describe('Utility Types', () => {
    it('should parse Partial utility type', () => {
      const source = 'type PartialUser = Partial<User>;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('Partial<User>');
    });

    it('should parse Pick utility type', () => {
      const source = "type UserName = Pick<User, 'name' | 'email'>;";
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('Pick<User');
      expect(typeAlias.typeAnnotation).toContain("'name' | 'email'");
    });

    it('should parse Record utility type', () => {
      const source = 'type StringMap = Record<string, string>;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('Record<string, string>');
    });
  });

  describe('Complex Types', () => {
    it('should parse mapped type', () => {
      const source = 'type Readonly<T> = { readonly [P in keyof T]: T[P] };';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('readonly');
      expect(typeAlias.typeAnnotation).toContain('[P in keyof T]');
    });

    it('should parse conditional type', () => {
      const source = 'type IsString<T> = T extends string ? true : false;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('extends string');
      expect(typeAlias.typeAnnotation).toContain('?');
      expect(typeAlias.typeAnnotation).toContain('true : false');
    });

    it('should parse intersection type', () => {
      const source = 'type Combined = TypeA & TypeB & TypeC;';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toContain('TypeA & TypeB & TypeC');
    });

    it('should parse tuple type', () => {
      const source = 'type Point = [number, number];';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.typeAnnotation).toBe('[number, number]');
    });
  });

  describe('Edge Cases', () => {
    it('should parse type alias without semicolon', () => {
      const source = 'type Simple = string';
      const parser = createParser();
      const ast = parser.parse(source);

      const typeAlias = ast.body[0] as ITypeAliasNode;
      expect(typeAlias.type).toBe(ASTNodeType.TYPE_ALIAS);
    });

    it('should parse multiple type aliases', () => {
      const source = `type First = string;
type Second = number;
type Third = boolean;`;
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(3);
      expect((ast.body[0] as ITypeAliasNode).name.name).toBe('First');
      expect((ast.body[1] as ITypeAliasNode).name.name).toBe('Second');
      expect((ast.body[2] as ITypeAliasNode).name.name).toBe('Third');
    });

    it('should parse type alias referencing another', () => {
      const source = 'type AliasA = string; type AliasB = AliasA;';
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(2);
      const second = ast.body[1] as ITypeAliasNode;
      expect(second.typeAnnotation).toBe('AliasA');
    });
  });
});
