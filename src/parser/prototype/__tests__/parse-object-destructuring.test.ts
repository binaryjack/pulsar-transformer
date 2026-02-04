/**
 * Parser Tests: Object Destructuring
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../../ast/index.js';
import { createParser } from '../../create-parser.js';

describe('Parser: Object Destructuring', () => {
  it('should parse simple object destructuring', () => {
    const source = 'const { name, age } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    expect(program.type).toBe(ASTNodeType.PROGRAM);
    const ast = program.body[0];

    expect(ast.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    expect(ast.kind).toBe('const');
    expect(ast.declarations).toHaveLength(1);

    const decl = ast.declarations[0];
    expect(decl.id.type).toBe(ASTNodeType.OBJECT_PATTERN);
    expect(decl.id.properties).toHaveLength(2);
    expect(decl.id.properties[0].key.name).toBe('name');
    expect(decl.id.properties[0].value.name).toBe('name');
    expect(decl.id.properties[0].shorthand).toBe(true);
    expect(decl.id.properties[1].key.name).toBe('age');
    expect(decl.id.properties[1].value.name).toBe('age');
    expect(decl.id.properties[1].shorthand).toBe(true);
  });

  it('should parse object destructuring with renaming', () => {
    const source = 'const { name: firstName, age: userAge } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];

    expect(ast.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    const decl = ast.declarations[0];
    expect(decl.id.type).toBe(ASTNodeType.OBJECT_PATTERN);
    expect(decl.id.properties).toHaveLength(2);

    expect(decl.id.properties[0].key.name).toBe('name');
    expect(decl.id.properties[0].value.name).toBe('firstName');
    expect(decl.id.properties[0].shorthand).toBe(false);

    expect(decl.id.properties[1].key.name).toBe('age');
    expect(decl.id.properties[1].value.name).toBe('userAge');
    expect(decl.id.properties[1].shorthand).toBe(false);
  });

  it('should parse mixed shorthand and renamed properties', () => {
    const source = 'const { name, age: userAge, email } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];
    const decl = ast.declarations[0];
    expect(decl.id.properties).toHaveLength(3);

    expect(decl.id.properties[0].shorthand).toBe(true);
    expect(decl.id.properties[1].shorthand).toBe(false);
    expect(decl.id.properties[2].shorthand).toBe(true);
  });

  it('should parse object destructuring with type annotation', () => {
    const source = 'const { name, age }: { name: string; age: number } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];
    const decl = ast.declarations[0];
    expect(decl.id.type).toBe(ASTNodeType.OBJECT_PATTERN);
    expect(decl.typeAnnotation).toBeTruthy();
    // Type annotation parsing captures raw tokens (may have extra whitespace)
    expect(decl.typeAnnotation.typeString).toContain('name');
    expect(decl.typeAnnotation.typeString).toContain('string');
    expect(decl.typeAnnotation.typeString).toContain('age');
    expect(decl.typeAnnotation.typeString).toContain('number');
  });

  it('should parse single property destructuring', () => {
    const source = 'const { name } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];
    const decl = ast.declarations[0];
    expect(decl.id.properties).toHaveLength(1);
    expect(decl.id.properties[0].key.name).toBe('name');
  });

  it('should parse object destructuring with let', () => {
    const source = 'let { name, age } = user;';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];
    expect(ast.kind).toBe('let');
    expect(ast.declarations[0].id.type).toBe(ASTNodeType.OBJECT_PATTERN);
  });

  it('should parse object destructuring from function call', () => {
    const source = 'const { data, error } = fetchUser();';
    const parser = createParser();
    const program = parser.parse(source);

    const ast = program.body[0];
    const decl = ast.declarations[0];
    expect(decl.id.type).toBe(ASTNodeType.OBJECT_PATTERN);
    expect(decl.init).toBeTruthy();
  });
});
