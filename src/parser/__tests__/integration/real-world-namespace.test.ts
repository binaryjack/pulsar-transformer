import { describe, expect, it } from 'vitest';
import { createParser } from '../../create-parser';

describe('Real-World Namespace Integration', () => {
  it('should parse utility namespace', () => {
    const source = `
      namespace StringUtils {
        export function capitalize(str: string): string {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
        
        export function trim(str: string): string {
          return str.trim();
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('NamespaceDeclaration');
  });

  it('should parse nested namespace structure', () => {
    const source = `
      namespace App {
        export namespace Models {
          export interface User {
            id: string;
            name: string;
          }
        }
        
        export namespace Services {
          export class UserService {
            getUser(id: string) {
              return null;
            }
          }
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('NamespaceDeclaration');
  });

  it('should parse module declaration (legacy syntax)', () => {
    const source = `
      module Legacy {
        export function oldMethod() {
          return 'legacy';
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('NamespaceDeclaration');
  });
});
