/**
 * Pipeline Integration Tests
 *
 * End-to-end tests for PSR → TypeScript transformation.
 */

import { describe, expect, it } from 'vitest'
import { createPipeline } from '../create-pipeline'

describe('Pipeline Integration', () => {
  describe('simple component transformation', () => {
    it('should transform basic component', async () => {
      const source = `
        component Counter() {
          return <div>Hello</div>;
        }
      `;

      const pipeline = createPipeline({ debug: true });
      const result = await pipeline.transform(source);

      // Debug: Check for errors
      console.log('Diagnostics:', result.diagnostics);
      console.log('Generated code:', result.code);

      expect(result.code).toContain('function Counter');
      expect(result.code).toContain('$REGISTRY.execute');
      expect(result.code).toContain("t_element('div'");
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should transform component with parameters', async () => {
      const source = `
        component Greeting(name: string) {
          return <div>Hello {name}</div>;
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.code).toContain('function Greeting');
      expect(result.code).toContain('function Greeting(name)');
      expect(result.code).toContain('name'); // Parameter used in element children
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });
  });

  describe('signal transformation', () => {
    it('should transform component with signal', async () => {
      const source = `
        component Counter() {
          const [count, setCount] = signal(0);
          return <div>{count()}</div>;
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal');
      expect(result.code).toContain('[count, setCount]');
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should handle multiple signals', async () => {
      const source = `
        component Form() {
          const [name, setName] = signal('');
          const [age, setAge] = signal(0);
          return <div>{name()} - {age()}</div>;
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal');
      // Count createSignal calls in variable declarations (not imports)
      const signalCount = (result.code.match(/= createSignal\(/g) || []).length;
      expect(signalCount).toBe(2);
    });
  });

  describe('imports generation', () => {
    it('should generate required imports', async () => {
      const source = `
        component App() {
          const [count, setCount] = signal(0);
          return <button>Click</button>;
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.code).toContain("import { $REGISTRY");
      expect(result.code).toContain("from '@pulsar-framework/pulsar.dev'");
      expect(result.code).toContain('createSignal'); // In imports or code
      expect(result.code).toContain('t_element'); // In imports or code
    });

    it('should deduplicate imports', async () => {
      const source = `
        component App() {
          const [a, setA] = signal(0);
          const [b, setB] = signal(1);
          return <div><span></span></div>;
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      const signalImportCount = (result.code.match(/import.*createSignal/g) || []).length;
      expect(signalImportCount).toBe(1);

      const elementImportCount = (result.code.match(/import.*t_element/g) || []).length;
      expect(elementImportCount).toBe(1);
    });
  });

  describe('debug mode', () => {
    it('should provide diagnostics in debug mode', async () => {
      const source = `
        component Test() {
          return <div>Test</div>;
        }
      `;

      const pipeline = createPipeline({ debug: true });
      const result = await pipeline.transform(source);

      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics.some((d) => d.phase === 'lexer')).toBe(true);
      expect(result.diagnostics.some((d) => d.phase === 'parser')).toBe(true);
      expect(result.diagnostics.some((d) => d.phase === 'analyzer')).toBe(true);
    });

    it('should provide metrics in debug mode', async () => {
      const source = `
        component Test() {
          return <div>Test</div>;
        }
      `;

      const pipeline = createPipeline({ debug: true });
      const result = await pipeline.transform(source);

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.lexerTime).toBeGreaterThan(0);
      expect(result.metrics!.parserTime).toBeGreaterThan(0);
      expect(result.metrics!.totalTime).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid syntax gracefully', async () => {
      const source = `
        component Invalid() {
          return <div>unclosed
        }
      `;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.diagnostics.some((d) => d.type === 'error')).toBe(true);
    });

    it('should return empty code on error', async () => {
      const source = `totally invalid syntax ###`;

      const pipeline = createPipeline();
      const result = await pipeline.transform(source);

      expect(result.code).toBe('');
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should use custom emitter config', async () => {
      const source = `
        component Test() {
          return <div>Test</div>;
        }
      `;

      const pipeline = createPipeline({
        emitter: {
          format: 'esm',
          indent: '    ', // 4 spaces
        },
      });

      const result = await pipeline.transform(source);
      expect(result.code).toContain('    '); // 4-space indent
    });

    it('should merge per-transform config', async () => {
      const source = `
        component Test() {
          return <div>Test</div>;
        }
      `;

      const pipeline = createPipeline({ debug: false });
      const result = await pipeline.transform(source, { debug: true });

      expect(result.metrics).toBeDefined(); // Debug enabled via transform config
    });
  });
});
