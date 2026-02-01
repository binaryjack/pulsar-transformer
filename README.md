# Pulsar Transformer

TypeScript transformer that converts JSX to Registry Pattern calls for the Pulsar Framework.

## Overview

This transformer rewrites JSX elements into explicit DOM manipulation code using the Pulsar `$REGISTRY` pattern. This approach:

- **Eliminates infinite loops** - No `createEffect` wrappers during render
- **Enables surgical updates** - Only reactive properties update via `wire()`
- **Maintains component isolation** - Each component runs once in `$REGISTRY.execute()`

## Architecture

Based on the Registry Pattern:

```tsx
// Input (JSX)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count()}</button>;
}

// Output (Registry Pattern)
function Counter() {
  return $REGISTRY.execute('fileHash:Counter:0', () => {
    const [count, setCount] = useState(0);
    return (() => {
      const el1 = document.createElement('button');
      el1.addEventListener('click', () => setCount((c) => c + 1));
      $REGISTRY.wire(el1, 'textContent', () => count());
      return el1;
    })();
  });
}
```

## Features (Phase 1 MVP)

✅ **Signal Detection**

- Tracks `useState`, `createSignal`, `createMemo` imports
- Identifies signal getter functions
- Distinguishes reactive vs static expressions

✅ **Expression Classification**

- Static values → direct assignment
- Signal calls → `$REGISTRY.wire()`
- Event handlers → `addEventListener()`

✅ **Code Generation**

- `document.createElement()` for elements
- Property assignment for static attributes
- Wire calls for reactive properties
- Event listener registration

✅ **Component Wrapping**

- Unique component IDs: `{fileHash}:{componentName}:{index}`
- `$REGISTRY.execute()` wrapper
- Stable hashing for file paths

✅ **Debug Infrastructure**

- Step-by-step transformation tracking
- AST node classification logging
- Performance profiling
- Multiple output formats

## Usage

### With Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import pulsarTransformer from '@pulsar-framework/transformer';

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  plugins: [
    {
      name: 'pulsar-transformer',
      transform(code, id) {
        if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
          // Apply transformer
          return transformWithPulsar(code, id);
        }
      },
    },
  ],
});
```

### Programmatic API

```typescript
import pulsarTransformer from '@pulsar-framework/transformer';
import * as ts from 'typescript';

const program = ts.createProgram(['src/app.tsx'], compilerOptions);
const transformers = {
  before: [pulsarTransformer(program)],
};

program.emit(sourceFile, writeFile, undefined, false, transformers);
```

## Debug Mode

Enable comprehensive debugging:

```bash
PULSAR_DEBUG=true pnpm build
```

Debug channels:

- `transform` - Overall transformation progress
- `detector` - Signal detection and expression classification
- `generator` - Code generation steps
- `visitor` - AST traversal

Output options:

- Console logging
- File output
- Source maps
- AST dumps

## Design Patterns

- **Factory** - Creates transformer components (context, classifier, generator)
- **Visitor** - Traverses TypeScript AST nodes
- **Strategy** - Classifies expressions (static/dynamic/event)
- **Builder** - Constructs output code statements
- **Prototype** - Prototype-based class pattern (no ES6 classes)

## Testing

```bash
pnpm test          # Run tests
pnpm test:watch    # Watch mode
```

Current coverage: **8/8 tests passing** (100%)

## Coding Standards

From `COPILOT-INSTRUCTIONS-MASTER.md`:

- ✅ **One item per file** - Single function/class/interface per file
- ✅ **kebab-case naming** - All file names use kebab-case
- ✅ **Prototype-based** - No ES6 classes, only prototype pattern
- ✅ **Zero `any` types** - Strict TypeScript, no escape hatches
- ✅ **95%+ coverage** - Comprehensive test coverage required

## Status

**Phase 1 MVP: ✅ COMPLETE**

- Core transformation pipeline
- Signal detection
- Expression classification
- Static attributes
- Dynamic properties with wires
- Event handlers
- Component wrapping
- Debug infrastructure

**Phase 2: Planned**

- Dynamic attributes (conditional rendering)
- `Show` component transformation
- Comment anchor nodes

**Phase 3: Planned**

- Child components (nested JSX)
- `For` component transformation
- Recursive visitor pattern

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT © 2026 Tadeo Piana
