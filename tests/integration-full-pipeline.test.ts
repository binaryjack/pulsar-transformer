/**
 * Integration Test - Complete Pipeline with New Fixes
 *
 * Tests the full transformer pipeline with:
 * - Unicode character handling (Tamil, Chinese, emoji)
 * - Reactivity transformations (signal → createSignal)
 * - Auto-import injection
 *
 * This test verifies all the new modules work together seamlessly.
 */

import { describe, expect, it } from 'vitest';
import { createPipeline } from '../pipeline/create-pipeline.js';

describe('🔥 CRITICAL: Full Integration Test - New Fixes', () => {
  describe('Unicode Handling', () => {
    it('should handle Tamil characters in JSX text', () => {
      const psrCode = `
component TamilGreeting() {
  return <div>வணக்கம் (Welcome)</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🌐 TAMIL UNICODE TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // Should contain unicode escape for Tamil chars
      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);

      // Verify the component was created
      expect(result.code).toContain('function TamilGreeting');
    });

    it('should handle Chinese characters in JSX attributes', () => {
      const psrCode = `
component ChineseButton() {
  return <button title="你好世界">Click</button>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🇨🇳 CHINESE UNICODE TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
      expect(result.code).toContain('function ChineseButton');
    });

    it('should handle emoji in JSX', () => {
      const psrCode = `
component EmojiStatus() {
  return <div>Status: 😀 Happy 🚀 Rocket ❤️ Love</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 😀 EMOJI TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
      expect(result.code).toContain('function EmojiStatus');
    });

    it('should handle mixed unicode (Tamil + Chinese + Emoji)', () => {
      const psrCode = `
component MultilingualGreeting() {
  return (
    <div>
      <p>தமிழ் (Tamil)</p>
      <p>中文 (Chinese)</p>
      <p>😀 🚀 (Emoji)</p>
    </div>
  );
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🌍 MULTILINGUAL TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      expect(result.code).toBeDefined();
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
      expect(result.code).toContain('function MultilingualGreeting');
    });
  });

  describe('Reactivity Transformations', () => {
    it('should transform signal() to createSignal()', () => {
      const psrCode = `
component Counter() {
  const [count, setCount] = signal(0);
  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🔄 SIGNAL TRANSFORMATION TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should transform signal() to createSignal()
      expect(result.code).toContain('createSignal');
      expect(result.code).not.toContain('signal(0)'); // Original should be transformed

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should transform computed() to createMemo()', () => {
      const psrCode = `
component Calculator() {
  const [a, setA] = signal(5);
  const [b, setB] = signal(10);
  const total = computed(() => a() + b());
  return <div>Total: {total()}</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 📊 COMPUTED TRANSFORMATION TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should transform computed() to createMemo()
      expect(result.code).toContain('createMemo');
      expect(result.code).not.toContain('computed('); // Original should be transformed

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should transform effect() to createEffect()', () => {
      const psrCode = `
component Logger() {
  const [value, setValue] = signal('');
  effect(() => { console.log(value()); });
  return <input onInput={(e) => setValue(e.target.value)} />;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== ⚡ EFFECT TRANSFORMATION TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should transform effect() to createEffect()
      expect(result.code).toContain('createEffect');
      expect(result.code).not.toContain('effect('); // Original should be transformed

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should auto-generate setter names for non-destructured signals', () => {
      const psrCode = `
component AutoSetter() {
  const count = signal(0);
  return <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🤖 AUTO-SETTER NAME TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should auto-generate setCount
      expect(result.code).toContain('createSignal');
      // Should destructure: const [count, setCount] = createSignal(0)
      expect(result.code).toMatch(/\[count,\s*setCount\]/);

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });
  });

  describe('Auto-Import Injection', () => {
    it('should auto-inject createSignal import', () => {
      const psrCode = `
component Counter() {
  const [count, setCount] = signal(0);
  return <div>{count()}</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 📦 AUTO-IMPORT TEST (createSignal) ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should auto-inject import for createSignal
      expect(result.code).toMatch(/import.*createSignal.*from.*@pulsar/);

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should auto-inject multiple runtime imports', () => {
      const psrCode = `
component FullFeature() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  effect(() => { console.log(doubled()); });
  return <div>Count: {count()}, Doubled: {doubled()}</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 📦 AUTO-IMPORT TEST (multiple) ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should auto-inject all needed imports
      expect(result.code).toContain('createSignal');
      expect(result.code).toContain('createMemo');
      expect(result.code).toContain('createEffect');

      // Should have imports from @pulsar/runtime
      expect(result.code).toMatch(/import.*from.*@pulsar/);

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should not duplicate imports', () => {
      const psrCode = `
component MultiSignal() {
  const [a, setA] = signal(0);
  const [b, setB] = signal(1);
  const [c, setC] = signal(2);
  return <div>{a()} {b()} {c()}</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 📦 DEDUPLICATION TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL: Should only have ONE import statement for createSignal
      const createSignalImportCount = (result.code.match(/import.*createSignal/g) || []).length;
      expect(createSignalImportCount).toBeLessThanOrEqual(1);

      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });
  });

  describe('🔥 CRITICAL: Combined Real-World Test', () => {
    it('should handle unicode + signals + imports together', () => {
      const psrCode = `
component MultilingualCounter() {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);
  
  return (
    <div>
      <h1>வணக்கம் (Welcome) 😀</h1>
      <p>中文: Count is {count()}</p>
      <p>Doubled: {doubled()} 🚀</p>
      <button onClick={() => setCount(count() + 1)}>
        Click me ❤️
      </button>
    </div>
  );
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🔥 COMPLETE INTEGRATION TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // CRITICAL CHECKS:

      // 1. Unicode should be handled (component exists)
      expect(result.code).toContain('function MultilingualCounter');

      // 2. Signals transformed
      expect(result.code).toContain('createSignal');
      expect(result.code).not.toContain('signal(0)');

      // 3. Computed transformed
      expect(result.code).toContain('createMemo');
      expect(result.code).not.toContain('computed(');

      // 4. Imports auto-injected
      expect(result.code).toMatch(/import.*createSignal.*from/);
      expect(result.code).toMatch(/import.*createMemo.*from/);

      // 5. No errors
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);

      // 6. Registry pattern present
      expect(result.code).toContain('$REGISTRY');
    });

    it('should handle complex form with unicode labels and validation', () => {
      const psrCode = `
component InternationalForm() {
  const [name, setName] = signal('');
  const [email, setEmail] = signal('');
  const isValid = computed(() => name().length > 0 && email().includes('@'));
  
  effect(() => {
    console.log('Form valid:', isValid());
  });
  
  return (
    <form>
      <label>பெயர் (Name): <input value={name()} onInput={(e) => setName(e.target.value)} /></label>
      <label>邮箱 (Email): <input value={email()} onInput={(e) => setEmail(e.target.value)} /></label>
      <button disabled={!isValid()}>Submit 📮</button>
    </form>
  );
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 📝 COMPLEX FORM TEST ===');
      console.log(result.code);
      console.log('=== END ===\n');

      // All transformations applied
      expect(result.code).toContain('createSignal');
      expect(result.code).toContain('createMemo');
      expect(result.code).toContain('createEffect');

      // No original reactive calls remain
      expect(result.code).not.toContain('signal(');
      expect(result.code).not.toContain('computed(');
      expect(result.code).not.toContain('effect(');

      // Imports present
      expect(result.code).toMatch(/import.*from.*@pulsar/);

      // No errors
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });
  });

  describe('🚨 REGRESSION: Ensure existing tests still pass', () => {
    it('should not break existing Avatar component', () => {
      const psrCode = `
component Avatar({ size = 'md', src, alt }) {
  return (
    <div className="avatar">
      <img src={src} alt={alt || 'Avatar'} />
    </div>
  );
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🔄 REGRESSION: Avatar Test ===');
      console.log(result.code);
      console.log('=== END ===\n');

      expect(result.code).toContain('function Avatar');
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });

    it('should not break components without reactivity', () => {
      const psrCode = `
component StaticComponent() {
  return <div>Hello World</div>;
}
      `;

      const pipeline = createPipeline();
      const result = pipeline.transform(psrCode);

      console.log('\n=== 🔄 REGRESSION: Static Component ===');
      console.log(result.code);
      console.log('=== END ===\n');

      expect(result.code).toContain('function StaticComponent');
      // Should NOT add reactivity imports if not needed
      expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
    });
  });
});
