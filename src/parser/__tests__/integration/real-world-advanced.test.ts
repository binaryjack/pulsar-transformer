import { describe, expect, it } from 'vitest';
import { createParser } from '../../create-parser.js';

describe('Real-World Advanced Features Integration', () => {
  describe('decorators in classes', () => {
    it('should parse class with multiple decorators', () => {
      const source = `
        @Component({ selector: 'app-root' })
        @Injectable()
        class AppComponent {
          @Input() title: string;
          @Output() change: EventEmitter;
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('ClassDeclaration');
    });

    it('should parse method decorators', () => {
      const source = `
        class Service {
          @Get('/users')
          @Auth()
          getUsers() {
            return users;
          }
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('ClassDeclaration');
    });
  });

  describe('generator functions', () => {
    it('should parse generator function with yield', () => {
      const source = `
        function* generateSequence() {
          yield 1;
          yield 2;
          yield 3;
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
    });

    it('should parse generator with yield*', () => {
      const source = `
        function* delegateGenerator() {
          yield* anotherGenerator();
          yield* [1, 2, 3];
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
    });
  });

  describe('async/await patterns', () => {
    it('should parse async function with await', () => {
      const source = `
        async function fetchUser(id: string) {
          const response = await fetch(\`/api/users/\${id}\`);
          const data = await response.json();
          return data;
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
    });

    it('should parse async arrow function', () => {
      const source = `
        const loadData = async () => {
          const users = await getUsers();
          const posts = await getPosts();
          return { users, posts };
        };
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('VariableDeclaration');
    });

    it('should parse async method in class', () => {
      const source = `
        class DataService {
          async loadData() {
            const result = await this.fetch();
            return result;
          }
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('ClassDeclaration');
    });
  });

  describe('combined patterns', () => {
    it('should parse decorated async method', () => {
      const source = `
        class ApiController {
          @Post('/users')
          @ValidateBody()
          async createUser() {
            const user = await this.userService.create();
            return user;
          }
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('ClassDeclaration');
    });

    it('should parse async generator', () => {
      const source = `
        async function* fetchPages() {
          let page = 1;
          while (true) {
            const data = await fetchPage(page);
            if (!data) break;
            yield data;
            page++;
          }
        }
      `;

      const parser = createParser(source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
    });
  });
});
