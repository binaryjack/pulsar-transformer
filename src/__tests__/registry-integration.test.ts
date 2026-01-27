/**
 * Registry Integration Tests
 * Tests transformer's ability to generate registry-enhanced code
 */

import * as ts from 'typescript';
import visualSchemaTransformer from '../index.js';

describe('Transformer Registry Integration', () => {
  function transform(source: string, enableRegistry = true): string {
    const sourceFile = ts.createSourceFile(
      'test.tsx',
      source,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TSX
    );

    const compilerOptions: ts.CompilerOptions = {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    };

    const host = ts.createCompilerHost(compilerOptions);
    const program = ts.createProgram(['test.tsx'], compilerOptions, {
      ...host,
      getSourceFile: (fileName) => {
        if (fileName === 'test.tsx') return sourceFile;
        return host.getSourceFile(fileName, ts.ScriptTarget.ESNext);
      },
    });

    const transformerFactory = visualSchemaTransformer(program, {
      enableRegistry,
      optimize: false,
    });

    const result = ts.transform(sourceFile, [transformerFactory]);
    const transformedFile = result.transformed[0];

    const printer = ts.createPrinter();
    const output = printer.printFile(transformedFile);

    result.dispose();
    return output;
  }

  describe('import injection', () => {
    it('should add registry imports for JSX files', () => {
      const source = `
                export const Button = () => {
                    return <button>Click</button>
                }
            `;

      const output = transform(source);

      expect(output).toContain('createElementWithRegistry');
      expect(output).toContain('appendChildren');
      expect(output).toContain('ElementType');
      expect(output).toContain("from 'pulsar/jsx-runtime'");
      expect(output).toContain("from 'pulsar/registry'");
    });

    it('should not add imports for files without JSX', () => {
      const source = `
                export const add = (a: number, b: number) => a + b
            `;

      const output = transform(source);

      expect(output).not.toContain('createElementWithRegistry');
      expect(output).not.toContain('pulsar/jsx-runtime');
    });

    it('should not duplicate imports if already present', () => {
      const source = `
                import { createElementWithRegistry } from 'pulsar/jsx-runtime'
                
                export const Button = () => {
                    return <button>Click</button>
                }
            `;

      const output = transform(source);

      // Count occurrences of import statement
      const importCount = (output.match(/import.*createElementWithRegistry/g) || []).length;
      expect(importCount).toBe(1);
    });
  });

  describe('registry transformation', () => {
    it('should transform simple JSX to createElementWithRegistry', () => {
      const source = `
                export const Button = () => {
                    return <button className="btn">Click</button>
                }
            `;

      const output = transform(source);

      expect(output).toContain('createElementWithRegistry');
      expect(output).toContain("'button'");
      expect(output).toContain('className: "btn"');
      expect(output).toContain('parentId: __parentId');
      expect(output).toContain('ElementType.COMPONENT');
    });

    it('should handle nested elements', () => {
      const source = `
                export const Card = () => {
                    return (
                        <div className="card">
                            <h1>Title</h1>
                            <p>Content</p>
                        </div>
                    )
                }
            `;

      const output = transform(source);

      expect(output).toContain('createElementWithRegistry');
      expect(output).toContain("'div'");
      expect(output).toContain("'h1'");
      expect(output).toContain("'p'");
    });

    it('should handle component calls', () => {
      const source = `
                const Child = () => <span>Child</span>
                
                export const Parent = () => {
                    return <Child />
                }
            `;

      const output = transform(source);

      expect(output).toContain('createElementWithRegistry');
      expect(output).toContain('Child');
    });

    it('should handle components with props', () => {
      const source = `
                export const Button = ({ label, onClick }: any) => {
                    return <button onClick={onClick}>{label}</button>
                }
                
                export const App = () => {
                    return <Button label="Click me" onClick={() => {}} />
                }
            `;

      const output = transform(source);

      expect(output).toContain('label: "Click me"');
      expect(output).toContain('onClick:');
    });

    it('should handle fragments', () => {
      const source = `
                export const List = () => {
                    return (
                        <>
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </>
                    )
                }
            `;

      const output = transform(source);

      // Fragments should be handled specially
      expect(output).toContain('li');
    });
  });

  describe('registry context', () => {
    it('should generate registry context with parentId', () => {
      const source = `
                export const Component = () => {
                    return <div><span>Text</span></div>
                }
            `;

      const output = transform(source);

      expect(output).toContain('parentId: __parentId');
      expect(output).toContain('index: __index');
    });

    it('should include ElementType in context', () => {
      const source = `
                export const Component = () => {
                    return <div />
                }
            `;

      const output = transform(source);

      expect(output).toContain('elementType: ElementType.COMPONENT');
    });

    it('should store element ID for child access', () => {
      const source = `
                export const Parent = () => {
                    return (
                        <div>
                            <span>Child</span>
                        </div>
                    )
                }
            `;

      const output = transform(source);

      expect(output).toContain('__elementId');
    });
  });

  describe('configuration', () => {
    it('should respect enableRegistry: false', () => {
      const source = `
                export const Button = () => {
                    return <button>Click</button>
                }
            `;

      const output = transform(source, false);

      // Should not have registry-specific code
      expect(output).not.toContain('createElementWithRegistry');
      expect(output).toContain('document.createElement');
    });

    it('should enable registry by default', () => {
      const source = `
                export const Button = () => {
                    return <button>Click</button>
                }
            `;

      const output = transform(source, undefined as any);

      expect(output).toContain('createElementWithRegistry');
    });
  });

  describe('edge cases', () => {
    it('should handle self-closing tags', () => {
      const source = `
                export const Component = () => {
                    return <input type="text" />
                }
            `;

      const output = transform(source);

      expect(output).toContain('createElementWithRegistry');
      expect(output).toContain("'input'");
      expect(output).toContain('type: "text"');
    });

    it('should handle elements with dynamic props', () => {
      const source = `
                export const Component = ({ disabled }: any) => {
                    return <button disabled={disabled}>Click</button>
                }
            `;

      const output = transform(source);

      expect(output).toContain('disabled:');
    });

    it('should handle text children', () => {
      const source = `
                export const Component = () => {
                    return <div>Hello World</div>
                }
            `;

      const output = transform(source);

      expect(output).toContain('Hello World');
    });

    it('should handle mixed children', () => {
      const source = `
                export const Component = () => {
                    return (
                        <div>
                            Text before
                            <span>Middle</span>
                            Text after
                        </div>
                    )
                }
            `;

      const output = transform(source);

      expect(output).toContain('Text before');
      expect(output).toContain('Text after');
      expect(output).toContain('span');
    });
  });
});
