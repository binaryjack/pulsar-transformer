/**
 * Integration Tests - PSR Transformation
 *
 * End-to-end tests for the complete transformation pipeline.
 */

import { describe, expect, it } from 'vitest';
import { createPipeline } from '../pipeline/create-pipeline.js';

describe('PSR Transformation Integration Tests', () => {
  describe('Reactivity Transformation', () => {
    it('should transform signal() to createSignal()', async () => {
      const pipeline = createPipeline();

      const source = `
component Counter() {
  const [count, setCount] = signal(0);
  
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal(0)');
      expect(result.code).not.toContain('signal(0)');
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
    });

    it('should transform computed() to createMemo()', async () => {
      const pipeline = createPipeline();

      const source = `
component Counter() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  return <div>{doubled()}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toMatch(/createMemo\(\(\) => \(?count\(\) \* 2\)?\)/); // Allow optional parens
      expect(result.code).not.toContain('computed(() => count() * 2)');
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createMemo.*from.*@pulsar-framework\/pulsar\.dev/);
    });

    it('should transform effect() to createEffect()', async () => {
      const pipeline = createPipeline();

      const source = `
component Counter() {
  const [count, setCount] = signal(0);
  
  effect(() => {
    console.log('Count changed:', count());
  });
  
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('createEffect(() => {');
      expect(result.code).not.toContain('effect(() => {');
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createEffect.*from.*@pulsar-framework\/pulsar\.dev/);
    });

    it('should handle multiple signal declarations', async () => {
      const pipeline = createPipeline();

      const source = `
component MultiSignal() {
  const [count, setCount] = signal(0);
  const [name, setName] = signal('John');
  const [active, setActive] = signal(true);
  
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      // Count only createSignal in code body, not in imports
      const signalMatches = result.code.replace(/^import.*$/gm, '').match(/createSignal/g);
      expect(signalMatches).toHaveLength(3);
      expect(result.code).not.toContain('signal(');
    });
  });

  describe('Unicode Escaping', () => {
    it('should escape Tamil characters', async () => {
      const pipeline = createPipeline();

      const source = `
component TamilText() {
  return <div>தமிழ்</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD');
      expect(result.code).not.toContain('தமிழ்');
    });

    it('should escape Chinese characters', async () => {
      const pipeline = createPipeline();

      const source = `
component ChineseText() {
  return <div>中文</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('\\u4E2D\\u6587');
      expect(result.code).not.toContain('中文');
    });

    it('should escape emoji with surrogate pairs', async () => {
      const pipeline = createPipeline();

      const source = `
component EmojiText() {
  return <div>😀</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('\\uD83D\\uDE00');
      expect(result.code).not.toContain('😀');
    });

    it('should handle mixed ASCII and unicode', async () => {
      const pipeline = createPipeline();

      const source = `
component MixedText() {
  return <div>Hello தமிழ் 中文 😀</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('Hello');
      expect(result.code).toContain('\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD');
      expect(result.code).toContain('\\u4E2D\\u6587');
      expect(result.code).toContain('\\uD83D\\uDE00');
    });

    it('should not escape regular ASCII', async () => {
      const pipeline = createPipeline();

      const source = `
component ASCIIText() {
  return <div>Hello World 123</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('Hello World 123');
      expect(result.code).not.toMatch(/\\u00[0-9A-F]{2}/);
    });
  });

  describe('Import Auto-Injection', () => {
    it('should auto-inject createSignal import', async () => {
      const pipeline = createPipeline();

      const source = `
component Counter() {
  const [count, setCount] = signal(0);
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      // Should have import with createSignal (may include $REGISTRY)
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
    });

    it('should auto-inject multiple imports', async () => {
      const pipeline = createPipeline();

      const source = `
component Advanced() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  effect(() => {
    console.log('Count:', count());
  });
  
  return <div>{doubled()}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal');
      expect(result.code).toContain('createMemo');
      expect(result.code).toContain('createEffect');
      // Should have all three reactivity imports in the core import
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createMemo.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createEffect.*from.*@pulsar-framework\/pulsar\.dev/);
    });

    it('should not create duplicate imports', async () => {
      const pipeline = createPipeline();

      const source = `
component TwoSignals() {
  const [count, setCount] = signal(0);
  const [name, setName] = signal('John');
  
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      const importMatches = result.code.match(/import.*@pulsar-framework\/pulsar\.dev/g);
      // Expect 2 imports: one for core (with createSignal) and one for jsx-runtime (with t_element)
      expect(importMatches).toHaveLength(2);
    });
  });

  describe('Complete Component Transformation', () => {
    it('should transform a complete counter component', async () => {
      const pipeline = createPipeline();

      const source = `component Counter() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  effect(() => {
    console.log('Count changed:', count());
  });
  
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      // Check reactivity transformation
      expect(result.code).toContain('createSignal(0)');
      expect(result.code).toMatch(/createMemo\(\(\) => \(?count\(\) \* 2\)?\)/);
      expect(result.code).toContain('createEffect(() => {');

      // Check imports
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createMemo.*from.*@pulsar-framework\/pulsar\.dev/);
      expect(result.code).toMatch(/import.*createEffect.*from.*@pulsar-framework\/pulsar\.dev/);

      // Check no PSR syntax remains
      expect(result.code).not.toContain('signal(0)');
      expect(result.code).not.toContain('computed(() =>');
      expect(result.code).not.toContain('effect(() =>');

      // Check diagnostics
      expect(result.diagnostics).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle nested call expressions', async () => {
      const pipeline = createPipeline();

      const source = `
component Nested() {
  const [count, setCount] = signal(signal(0));
  return <div>{count()}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal(createSignal(0))');
      expect(result.code).not.toContain('signal(signal(');
    });

    it('should preserve non-reactivity function calls', async () => {
      const pipeline = createPipeline();

      const source = `
component PreserveOther() {
  const [count, setCount] = signal(0);
  const result = someOtherFunction(count());
  
  return <div>{result}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toContain('createSignal(0)');
      expect(result.code).toContain('someOtherFunction(count())');
    });

    it('should handle empty components', async () => {
      const pipeline = createPipeline();

      const source = `
component Empty() {
  return <div></div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).toBeDefined();
      expect(result.code.length).toBeGreaterThan(0);
    });

    it('should handle components without signals', async () => {
      const pipeline = createPipeline();

      const source = `
component NoSignals() {
  const message = 'Hello World';
  return <div>{message}</div>;
}`;

      const result = await pipeline.transform(source);

      expect(result.code).not.toContain('createSignal');
      expect(result.code).toContain('Hello World');
    });
  });
});
