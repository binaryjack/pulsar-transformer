import { describe, expect, it } from 'vitest';
import { createParser } from '../../create-parser';

describe('Real-World Enum Integration', () => {
  it('should parse HttpStatus enum from real code', () => {
    const source = `
      enum HttpStatus {
        OK = 200,
        Created = 201,
        Accepted = 202,
        NoContent = 204,
        BadRequest = 400,
        Unauthorized = 401,
        Forbidden = 403,
        NotFound = 404,
        InternalServerError = 500
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('EnumDeclaration');
    const enumNode = ast.body[0];
    expect(enumNode.name?.name).toBe('HttpStatus');
  });

  it('should parse string enum from real code', () => {
    const source = `
      enum LogLevel {
        Error = 'ERROR',
        Warn = 'WARN',
        Info = 'INFO',
        Debug = 'DEBUG'
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('EnumDeclaration');
  });

  it('should parse const enum for optimization', () => {
    const source = `
      const enum Direction {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    const enumNode = ast.body[0];
    expect(enumNode.isConst).toBe(true);
  });
});
