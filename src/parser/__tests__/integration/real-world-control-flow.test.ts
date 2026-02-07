import { describe, expect, it } from 'vitest';
import { createParser } from '../../create-parser';

describe('Real-World Control Flow Integration', () => {
  it('should parse try-catch error handling pattern', () => {
    const source = `
      async function fetchUser(id: string) {
        try {
          const response = await fetch(\`/api/users/\${id}\`);
          if (!response.ok) {
            throw new Error('User not found');
          }
          return await response.json();
        } catch (error) {
          console.error('Failed to fetch user:', error);
          throw error;
        } finally {
          cleanup();
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('FunctionDeclaration');
  });

  it('should parse switch statement routing pattern', () => {
    const source = `
      function handleAction(action: string) {
        switch (action) {
          case 'CREATE':
            return create();
          case 'UPDATE':
            return update();
          case 'DELETE':
            return remove();
          default:
            throw new Error('Unknown action');
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('FunctionDeclaration');
  });

  it('should parse complex loop with break/continue', () => {
    const source = `
      function processItems(items: Item[]) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.skip) {
            continue;
          }
          
          if (item.error) {
            break;
          }
          
          process(item);
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('FunctionDeclaration');
  });

  it('should parse labeled break in nested loops', () => {
    const source = `
      function findInMatrix(matrix: number[][], target: number) {
        outer: for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === target) {
              console.log('Found at', i, j);
              break outer;
            }
          }
        }
      }
    `;

    const parser = createParser();
    const ast = parser.parse(source);

    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('FunctionDeclaration');
  });
});
