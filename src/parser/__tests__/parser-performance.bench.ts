import { bench, describe } from 'vitest';
import { createParser } from '../create-parser';

describe('Parser Performance Benchmarks', () => {
  describe('Enum Parsing Performance', () => {
    bench('parse simple enum (5 members)', () => {
      const source = 'enum Color { Red, Blue, Green, Yellow, Purple }';
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse enum with initializers (10 members)', () => {
      const source = `enum HttpStatus {
        OK = 200,
        Created = 201,
        Accepted = 202,
        NoContent = 204,
        BadRequest = 400,
        Unauthorized = 401,
        Forbidden = 403,
        NotFound = 404,
        InternalServerError = 500,
        ServiceUnavailable = 503
      }`;
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse const enum', () => {
      const source = 'const enum Direction { Up, Down, Left, Right }';
      const parser = createParser(source);
      parser.parse();
    });
  });

  describe('Control Flow Parsing Performance', () => {
    bench('parse try-catch-finally', () => {
      const source = `try {
        doWork();
        process();
      } catch (error) {
        handleError(error);
        log(error);
      } finally {
        cleanup();
      }`;
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse switch statement (5 cases)', () => {
      const source = `switch (action) {
        case 'CREATE': create(); break;
        case 'READ': read(); break;
        case 'UPDATE': update(); break;
        case 'DELETE': remove(); break;
        default: unknown();
      }`;
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse for loop', () => {
      const source = 'for (let i = 0; i < 100; i++) { process(i); }';
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse while loop', () => {
      const source = 'while (hasMore()) { processNext(); }';
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse do-while loop', () => {
      const source = 'do { work(); } while (shouldContinue());';
      const parser = createParser(source);
      parser.parse();
    });
  });

  describe('Namespace Parsing Performance', () => {
    bench('parse simple namespace', () => {
      const source = `namespace Utils {
        function helper() {}
        function another() {}
      }`;
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse nested namespace', () => {
      const source = `namespace Outer {
        namespace Inner {
          function deep() {}
        }
      }`;
      const parser = createParser(source);
      parser.parse();
    });
  });

  describe('Complex Code Performance', () => {
    bench('parse real-world function with all features', () => {
      const source = `
        async function complexOperation(items: Item[]) {
          try {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              
              switch (item.type) {
                case 'A':
                  await processA(item);
                  break;
                case 'B':
                  await processB(item);
                  break;
                default:
                  throw new Error('Unknown type');
              }
              
              if (item.skip) {
                continue;
              }
              
              while (item.hasMore()) {
                item.processNext();
              }
            }
          } catch (error) {
            console.error(error);
            throw error;
          } finally {
            cleanup();
          }
        }
      `;
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse file with enums, namespaces, and classes', () => {
      const source = `
        enum Status { Active, Inactive }
        
        namespace Utils {
          function helper() {}
        }
        
        class Service {
          process() {
            try {
              for (let i = 0; i < 10; i++) {
                console.log(i);
              }
            } catch (e) {
              throw e;
            }
          }
        }
      `;
      const parser = createParser(source);
      parser.parse();
    });
  });

  describe('Baseline Comparison', () => {
    bench('parse simple function (baseline)', () => {
      const source = 'function simple() { return 42; }';
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse interface (baseline)', () => {
      const source = 'interface User { id: string; name: string; }';
      const parser = createParser(source);
      parser.parse();
    });

    bench('parse class (baseline)', () => {
      const source = 'class User { constructor(public name: string) {} }';
      const parser = createParser(source);
      parser.parse();
    });
  });
});
