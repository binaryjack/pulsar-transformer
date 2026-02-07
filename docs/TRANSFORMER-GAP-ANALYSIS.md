# Pulsar Transformer Gap Analysis

**Date:** February 6, 2026  
**Status:** Critical Issues Identified  
**Priority:** P0 - Blocking Production Use

---

## Executive Summary

Based on research of official transformers from **React**, **SolidJS**, **Vue**, and **Svelte**, the Pulsar transformer is missing several **critical features** that prevent it from working correctly. This document outlines the gaps and provides a roadmap for fixes.

---

## 🔥 Critical Issues (P0 - Must Fix)

### 1. **Unicode Character Handling**

#### Issue

Unicode characters in JSX/template strings are not being handled correctly. Leads to:

- Broken string output
- Escaped characters appearing as raw text
- Template compilation failures with non-ASCII characters

#### What React Does

From `ReactCompilerBabelPlugin`:

```typescript
// React escapes unicode in JSX attributes to avoid Babel generator bugs
const STRING_REQUIRES_EXPR_CONTAINER_PATTERN =
  /[\u{0000}-\u{001F}\u{007F}\u{0080}-\u{FFFF}\u{010000}-\u{10FFFF}]|"|\\/u;

function codegenJsxAttribute(attr) {
  if (STRING_REQUIRES_EXPR_CONTAINER_PATTERN.test(attr.value)) {
    // Use JSX expression container for special chars
    return b.jsxExpressionContainer(b.literal(attr.value));
  }
  return b.jsxAttribute(attr.name, b.literal(attr.value));
}
```

**Test case from React:**

```jsx
// React handles this correctly:
<Post text="támil், 中文, 日本語, 한국어 and i think that's pretty cool" />
```

#### What Pulsar Is Missing

1. **No unicode escape pattern detection**
2. **No special handling for control characters (U+0000-U+001F, U+007F-U+009F)**
3. **No handling for astral plane characters (U+010000-U+10FFFF)**
4. **No escape sequence preservation** in JSX attributes

#### Fix Required

```typescript
// packages/pulsar-transformer/src/parser/utils/unicode-handler.ts

export const UNICODE_REQUIRES_ESCAPE = /[\u0000-\u001F\u007F\u0080-\u009F\u00A0-\uFFFF]|"|\\/u;

export function needsUnicodeEscape(str: string): boolean {
  return UNICODE_REQUIRES_ESCAPE.test(str);
}

export function escapeUnicode(str: string): string {
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
}
```

---

### 2. **Import/Export Transformation**

#### Issue

Import/export handling is incomplete. Missing:

- Lazy imports
- Dynamic imports `import()`
- Re-exports `export * from`
- Type-only imports/exports
- Side-effect imports `import './styles.css'`

#### What SolidJS Does

From `solid-js/babel-preset-solid`:

```javascript
// Solid handles JSX imports automatically
export default function solidPreset(context, options = {}) {
  return {
    plugins: [
      [jsxTransform, {
        moduleName: "solid-js/web",
        generate: options.generate || "dom",
        // Automatically injects imports
        generate dynamic import helpers
      }]
    ]
  };
}
```

**Generated import injection:**

```javascript
// Input:
<div>{count()}</div>;

// Output:
import { template as _$template } from 'solid-js/web';
import { insert as _$insert } from 'solid-js/web';
// ... Solid auto-injects based on usage
```

#### What Vue Does

From `@vue/compiler-sfc`:

```typescript
// Vue tracks imports and generates them
export interface TransformContext {
  imports: ImportItem[];
  helpers: Map<symbol, number>;
  // ...
}

export interface ImportItem {
  exp: string | ExpressionNode;
  path: string;
}

// Vue adds imports based on template usage
function transformTemplate(template: string) {
  const imports: ImportItem[] = [];

  // Analyze template, add required imports
  if (hasVModel) {
    imports.push({ exp: '_vModelText', path: 'vue' });
  }

  return { code, imports };
}
```

#### What Svelte Does

From `svelte/compiler`:

```javascript
// Svelte tracks reactive imports
export function reactive_import(fn) {
  var s = source(0);

  return function () {
    if (arguments.length === 1) {
      set(s, get(s) + 1); // Track mutation
      return arguments[0];
    } else {
      get(s); // Track read
      return fn();
    }
  };
}
```

#### What Pulsar Is Missing

1. **No automatic import injection** based on JSX/component usage
2. **No import deduplication** (same import added multiple times)
3. **No lazy import transformation** (`React.lazy()`, `defineAsyncComponent()`)
4. **No dynamic import handling** (`import()` expressions)
5. **No re-export support** (`export * from './module'`)
6. **No side-effect import preservation** (`import './style.css'`)
7. **No import hoisting** to top of file
8. **No import source path resolution**

#### Fix Required

```typescript
// packages/pulsar-transformer/src/analyzer/import-manager.ts

export interface ImportManager {
  // Track required runtime imports
  addRuntimeImport(name: string, source: string): void;

  // Handle lazy/dynamic imports
  addLazyImport(source: string): string; // returns identifier

  // Track type imports separately
  addTypeImport(name: string, source: string): void;

  // Generate final import statements
  generateImports(): string[];

  // Deduplicate imports
  mergeImports(): void;
}
```

---

### 3. **Reactivity Transformation**

#### Issue

Reactivity transformation is incomplete. Missing:

- Automatic signal detection
- Dependency tracking
- Memoization
- Effect scheduling

#### What SolidJS Does

From `solid-js/src/reactive/signal.ts`:

```typescript
export function createSignal<T>(value: T) {
  const s = new Signal(value); // Internal reactive primitive

  const read = () => {
    if (Listener) {
      // Track dependency
      if (!s.observers) s.observers = [Listener];
      else s.observers.push(Listener);
    }
    return s.value;
  };

  const write = (nextValue: T) => {
    s.value = nextValue;
    // Notify observers
    if (s.observers) {
      for (const observer of s.observers) {
        observer.execute();
      }
    }
  };

  return [read, write];
}
```

**Compiler transformation:**

```javascript
// Input:
const [count, setCount] = signal(0);

// Transformed:
import { createSignal } from '@pulsar/runtime';
const [count, setCount] = createSignal(0);
```

#### What Vue Does

```typescript
// Vue's reactivity transform (deprecated now, but instructive)
export function transformReactivity(code: string) {
  // $ref() -> ref()
  // $computed() -> computed()
  // $$() -> toRefs()

  return {
    code: transformed,
    imports: ['ref', 'computed', 'toRefs'],
  };
}
```

#### What Pulsar Is Missing

1. **No automatic `signal()` → `createSignal()` transformation**
2. **No dependency tracking codegen**
3. **No computed/derived detection**
4. **No effect/watch transformation**
5. **No reactivity scope analysis**

#### Fix Required

```typescript
// packages/pulsar-transformer/src/analyzer/reactivity-analyzer.ts

export interface ReactivityAnalyzer {
  // Detect signal declarations
  detectSignals(ast: IASTNode): ISignalDeclaration[];

  // Detect computed/derived values
  detectComputed(ast: IASTNode): IComputedDeclaration[];

  // Detect effects/watchers
  detectEffects(ast: IASTNode): IEffectDeclaration[];

  // Transform signal() calls
  transformSignalCall(node: ICallExpressionNode): ITransformedSignal;
}
```

---

### 4. **JSX Transform Issues**

#### Issue

JSX transformation has several critical bugs:

- Attributes not properly escaped
- Children not flattened correctly
- Spread attributes broken
- Event handlers not bound correctly

#### What React Does

```typescript
// React JSX transform
export function jsx(type, config, maybeKey) {
  const props = {};
  let key = null;
  let ref = null;

  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // Copy props, skip reserved
  for (const propName in config) {
    if (propName !== 'key' && propName !== 'ref') {
      props[propName] = config[propName];
    }
  }

  return ReactElement(type, key, ref, props);
}
```

#### What Pulsar Is Missing

1. **No proper key extraction**
2. **No ref handling**
3. **No props copying with reserved prop filtering**
4. **No children flattening**
5. **No Fragment support**
6. **No spread attribute merging**

---

## 🚨 Additional Critical Issues

### 5. **Template String Handling**

#### What Svelte Does

```javascript
// Svelte handles template literals in expressions
export function build_template_chunk(values, context) {
  const expressions = [];
  const quasis = [b.quasi('')];

  for (const node of values) {
    if (node.type === 'Text') {
      quasis[quasis.length - 1].value.cooked += node.data;
    } else {
      expressions.push(build_expression(node));
      quasis.push(b.quasi(''));
    }
  }

  return b.template(quasis, expressions);
}
```

#### Pulsar Missing

- No template literal expression building
- No proper cooked/raw string handling

---

### 6. **Source Map Generation**

#### What Vue Does

```typescript
export function compileTemplate(options: SFCTemplateCompileOptions) {
  const { code, map } = compiler.compile(source, {
    sourceMap: true,
    filename: options.filename,
  });

  // Merge source maps from preprocessors
  if (options.inMap) {
    map = mapLines(options.inMap, map);
  }

  return { code, map };
}
```

#### Pulsar Missing

- No source map generation
- No source map merging
- No position tracking

---

## 📋 Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

1. ✅ Fix unicode handling
2. ✅ Fix import/export transformation
3. ✅ Add import deduplication
4. ✅ Add dynamic import support

### Phase 2: Reactivity (Week 2)

1. ✅ Implement signal detection
2. ✅ Add dependency tracking
3. ✅ Implement computed transformation
4. ✅ Add effect transformation

### Phase 3: JSX Hardening (Week 3)

1. ✅ Fix attribute escaping
2. ✅ Fix children flattening
3. ✅ Add spread attribute support
4. ✅ Add Fragment support

### Phase 4: Quality (Week 4)

1. ✅ Add source maps
2. ✅ Add comprehensive tests
3. ✅ Performance optimization
4. ✅ Documentation

---

## 🧪 Test Coverage Requirements

### Unicode Tests

- [ ] ASCII characters
- [ ] Latin-1 Supplement (U+00A0-U+00FF)
- [ ] Basic Multilingual Plane (U+0000-U+FFFF)
- [ ] Astral plane (U+010000-U+10FFFF)
- [ ] Control characters (U+0000-U+001F)
- [ ] Escape sequences `\n`, `\t`, `\r`
- [ ] Tamil, Chinese, Japanese, Korean characters
- [ ] Emoji

### Import/Export Tests

- [ ] Named imports/exports
- [ ] Default imports/exports
- [ ] Namespace imports (`import * as`)
- [ ] Re-exports (`export * from`)
- [ ] Type-only imports/exports
- [ ] Side-effect imports
- [ ] Dynamic imports
- [ ] Lazy imports

### Reactivity Tests

- [ ] Signal declarations
- [ ] Computed values
- [ ] Effects/watchers
- [ ] Nested reactivity
- [ ] Reactive arrays
- [ ] Reactive objects

### JSX Tests

- [ ] Self-closing tags
- [ ] Nested children
- [ ] Text interpolation
- [ ] Spread attributes
- [ ] Event handlers
- [ ] Fragments
- [ ] Keys and refs
- [ ] Unicode in attributes
- [ ] Unicode in text content

---

## 📚 Research References

### React

- `@babel/plugin-react-jsx` - JSX transform
- `react/compiler` - React Compiler (optimizing)
- Position tracking for errors
- Unicode escape patterns

### SolidJS

- `babel-preset-solid` - Main transform
- `solid-js/web` - Template compilation
- Automatic import injection
- Signal transformation

### Vue

- `@vue/compiler-sfc` - Single File Component compiler
- `@vue/compiler-dom` - Template compiler
- Import tracking system
- Source map merging

### Svelte

- `svelte/compiler` - Main compiler
- Template literal building
- Reactive import handling
- Fragment management

---

## ✅ Success Criteria

The transformer is considered "working" when:

1. ✅ **All unicode characters** render correctly in output
2. ✅ **All import/export patterns** transform correctly
3. ✅ **Reactivity** is automatically detected and transformed
4. ✅ **JSX output** matches expected structure
5. ✅ **Source maps** are accurate
6. ✅ **Performance** is within 10% of SolidJS benchmark
7. ✅ **Test coverage** is >95%
8. ✅ **No known blocking bugs**

---

## 🛠️ Immediate Action Items

1. **Create unicode handler module** (2 hours)
2. **Implement import manager** (4 hours)
3. **Add reactivity analyzer** (8 hours)
4. **Fix JSX transform bugs** (6 hours)
5. **Add comprehensive test suite** (8 hours)
6. **Add source map support** (4 hours)

**Total Estimated Time:** 32 hours (4 days)

---

## 📞 Get Help From

- **React Team:** JSX transform patterns, unicode handling
- **Solid Team:** Signal transformation, automatic imports
- **Vue Team:** Source map merging, import tracking
- **Svelte Team:** Template building, reactive imports

---

**Next Steps:** Start with unicode handler (highest impact, lowest effort)
