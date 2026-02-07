/**
 * Reactivity Analyzer Tests
 *
 * Tests for reactivity analysis and transformation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createReactivityAnalyzer,
  detectReactivityPatterns,
  extractReactiveBindings,
} from '../src/analyzer/reactivity-analyzer.js';

describe('Reactivity Analyzer', () => {
  let analyzer: ReturnType<typeof createReactivityAnalyzer>;

  beforeEach(() => {
    analyzer = createReactivityAnalyzer();
  });

  describe('scope management', () => {
    it('should enter and exit scopes', () => {
      const scopeId = analyzer.enterScope();
      expect(scopeId).toBe(0);

      const scope = analyzer.getCurrentScope();
      expect(scope.id).toBe(scopeId);

      analyzer.exitScope();
    });

    it('should create nested scopes', () => {
      const parentId = analyzer.enterScope();
      const childId = analyzer.enterScope();

      const childScope = analyzer.getCurrentScope();
      expect(childScope.parentId).toBe(parentId);

      analyzer.exitScope();
      const parentScope = analyzer.getCurrentScope();
      expect(parentScope.id).toBe(parentId);
    });

    it('should throw when exiting without active scope', () => {
      expect(() => analyzer.exitScope()).toThrow();
    });
  });

  describe('registerBinding()', () => {
    it('should register signal binding', () => {
      analyzer.enterScope();
      analyzer.registerBinding({
        name: 'count',
        type: 'signal',
        initializer: '0',
        isDestructured: false,
        scopeDepth: 0,
      });

      expect(analyzer.isReactive('count')).toBe(true);
      const binding = analyzer.getBinding('count');
      expect(binding?.type).toBe('signal');
    });

    it('should register destructured signal', () => {
      analyzer.enterScope();
      analyzer.registerBinding({
        name: 'count',
        type: 'signal',
        initializer: '0',
        isDestructured: true,
        accessor: 'count',
        setter: 'setCount',
        scopeDepth: 0,
      });

      expect(analyzer.isReactive('count')).toBe(true);
      const binding = analyzer.getBinding('count');
      expect(binding?.accessor).toBe('count');
      expect(binding?.setter).toBe('setCount');
    });
  });

  describe('trackDependency()', () => {
    it('should track dependency', () => {
      analyzer.enterScope();
      analyzer.trackDependency('count', 'total', 'read');

      const deps = analyzer.getDependencies('count');
      expect(deps).toHaveLength(1);
      expect(deps[0].source).toBe('count');
      expect(deps[0].target).toBe('total');
      expect(deps[0].type).toBe('read');
    });

    it('should not duplicate dependencies', () => {
      analyzer.enterScope();
      analyzer.trackDependency('count', 'total', 'read');
      analyzer.trackDependency('count', 'total', 'read');

      const deps = analyzer.getDependencies('count');
      expect(deps).toHaveLength(1);
    });
  });

  describe('transformSignal()', () => {
    it('should transform destructured signal', () => {
      const code = 'const [count, setCount] = signal(0);';
      const transformed = analyzer.transformSignal(code);
      expect(transformed).toBe('const [count, setCount] = createSignal(0);');
    });

    it('should transform direct signal assignment', () => {
      const code = 'const count = signal(0);';
      const transformed = analyzer.transformSignal(code);
      expect(transformed).toBe('const [count, setCount] = createSignal(0);');
    });

    it('should transform standalone signal call', () => {
      const code = 'const s = signal(10);';
      const transformed = analyzer.transformSignal(code);
      expect(transformed).toBe('const [s, setS] = createSignal(10);');
    });

    it('should transform multiple signals', () => {
      const code = `
        const [count, setCount] = signal(0);
        const [name, setName] = signal("Alice");
      `;
      const transformed = analyzer.transformSignal(code);
      expect(transformed).toContain('createSignal(0)');
      expect(transformed).toContain('createSignal("Alice")');
    });

    it('should preserve non-signal code', () => {
      const code = 'const foo = bar();';
      const transformed = analyzer.transformSignal(code);
      expect(transformed).toBe(code);
    });
  });

  describe('transformComputed()', () => {
    it('should transform computed', () => {
      const code = 'const total = computed(() => count() + 1);';
      const transformed = analyzer.transformComputed(code);
      expect(transformed).toBe('const total = createMemo(() => count() + 1);');
    });

    it('should transform multiple computed', () => {
      const code = `
        const total = computed(() => a() + b());
        const doubled = computed(() => total() * 2);
      `;
      const transformed = analyzer.transformComputed(code);
      expect(transformed).toContain('createMemo(() => a() + b())');
      expect(transformed).toContain('createMemo(() => total() * 2)');
    });
  });

  describe('transformEffect()', () => {
    it('should transform effect', () => {
      const code = 'effect(() => { console.log(count()); });';
      const transformed = analyzer.transformEffect(code);
      expect(transformed).toBe('createEffect(() => { console.log(count()); });');
    });

    it('should transform multiple effects', () => {
      const code = `
        effect(() => { console.log(a()); });
        effect(() => { console.log(b()); });
      `;
      const transformed = analyzer.transformEffect(code);
      expect(transformed).toContain('createEffect(() => { console.log(a()); })');
      expect(transformed).toContain('createEffect(() => { console.log(b()); })');
    });
  });

  describe('generateDependencyTracking()', () => {
    it('should generate dependency comments', () => {
      analyzer.enterScope();
      analyzer.registerBinding({
        name: 'count',
        type: 'signal',
        isDestructured: false,
        scopeDepth: 0,
      });
      analyzer.trackDependency('count', 'total', 'read');

      const comments = analyzer.generateDependencyTracking('count');
      expect(comments).toContain('producer');
      expect(comments).toContain('total');
    });

    it('should handle no dependencies', () => {
      analyzer.enterScope();
      analyzer.registerBinding({
        name: 'count',
        type: 'signal',
        isDestructured: false,
        scopeDepth: 0,
      });

      const comments = analyzer.generateDependencyTracking('count');
      expect(comments).toContain('No dependencies tracked');
    });

    it('should handle missing binding', () => {
      const comments = analyzer.generateDependencyTracking('unknown');
      expect(comments).toContain('No reactive binding found');
    });
  });

  describe('clear()', () => {
    it('should clear all state', () => {
      analyzer.enterScope();
      analyzer.registerBinding({
        name: 'count',
        type: 'signal',
        isDestructured: false,
        scopeDepth: 0,
      });

      analyzer.clear();
      expect(analyzer.getScopes()).toHaveLength(0);
    });
  });
});

describe('detectReactivityPatterns()', () => {
  it('should detect signals', () => {
    const code = 'const [count, setCount] = signal(0);';
    const patterns = detectReactivityPatterns(code);
    expect(patterns.hasSignals).toBe(true);
  });

  it('should detect createSignal', () => {
    const code = 'const [count, setCount] = createSignal(0);';
    const patterns = detectReactivityPatterns(code);
    expect(patterns.hasSignals).toBe(true);
  });

  it('should detect memos', () => {
    const code = 'const total = computed(() => count() + 1);';
    const patterns = detectReactivityPatterns(code);
    expect(patterns.hasMemos).toBe(true);
  });

  it('should detect effects', () => {
    const code = 'effect(() => { console.log(count()); });';
    const patterns = detectReactivityPatterns(code);
    expect(patterns.hasEffects).toBe(true);
  });

  it('should detect multiple patterns', () => {
    const code = `
      const [count, setCount] = signal(0);
      const total = computed(() => count() + 1);
      effect(() => { console.log(total()); });
    `;
    const patterns = detectReactivityPatterns(code);
    expect(patterns.hasSignals).toBe(true);
    expect(patterns.hasMemos).toBe(true);
    expect(patterns.hasEffects).toBe(true);
  });
});

describe('extractReactiveBindings()', () => {
  it('should extract destructured signal binding', () => {
    const code = 'const [count, setCount] = signal(0);';
    const bindings = extractReactiveBindings(code);

    expect(bindings).toHaveLength(1);
    expect(bindings[0].name).toBe('count');
    expect(bindings[0].type).toBe('signal');
    expect(bindings[0].isDestructured).toBe(true);
    expect(bindings[0].accessor).toBe('count');
    expect(bindings[0].setter).toBe('setCount');
    expect(bindings[0].initializer).toBe('0');
  });

  it('should extract direct signal binding', () => {
    const code = 'const count = signal(0);';
    const bindings = extractReactiveBindings(code);

    expect(bindings).toHaveLength(1);
    expect(bindings[0].name).toBe('count');
    expect(bindings[0].type).toBe('signal');
    expect(bindings[0].isDestructured).toBe(false);
    expect(bindings[0].initializer).toBe('0');
  });

  it('should extract memo bindings', () => {
    const code = 'const total = computed(() => count() + 1);';
    const bindings = extractReactiveBindings(code);

    expect(bindings).toHaveLength(1);
    expect(bindings[0].name).toBe('total');
    expect(bindings[0].type).toBe('memo');
  });

  it('should extract effect bindings', () => {
    const code = `
      effect(() => { console.log(a()); });
      effect(() => { console.log(b()); });
    `;
    const bindings = extractReactiveBindings(code);

    const effectBindings = bindings.filter((b) => b.type === 'effect');
    expect(effectBindings).toHaveLength(2);
    expect(effectBindings[0].name).toBe('__effect_0');
    expect(effectBindings[1].name).toBe('__effect_1');
  });

  it('should extract multiple bindings', () => {
    const code = `
      const [count, setCount] = signal(0);
      const [name, setName] = createSignal("Alice");
      const total = computed(() => count() + 1);
      effect(() => { console.log(total()); });
    `;
    const bindings = extractReactiveBindings(code);

    expect(bindings.length).toBeGreaterThanOrEqual(4);
    expect(bindings.some((b) => b.name === 'count')).toBe(true);
    expect(bindings.some((b) => b.name === 'name')).toBe(true);
    expect(bindings.some((b) => b.name === 'total')).toBe(true);
    expect(bindings.some((b) => b.type === 'effect')).toBe(true);
  });
});
