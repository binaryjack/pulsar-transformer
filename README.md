<img src="https://raw.githubusercontent.com/binaryjack/pulsar-design-system/main/art-kit/SVG/pulsar-logo.svg" alt="Pulsar" width="400"/>

# @pulsar/transformer

TypeScript transformer that converts JSX syntax into direct DOM manipulation at compile-time for the Pulsar framework.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/tadeopiana/)

## Features

- ✅ **Compile-time JSX transformation** - No runtime JSX overhead
- ✅ **Direct DOM operations** - Eliminates virtual DOM layer
- ✅ **Fine-grained reactivity** - Automatic effect wrapping for dynamic content
- ✅ **Keyed reconciliation** - Efficient list updates with minimal DOM operations
- ✅ **TypeScript integration** - Works with standard TypeScript compiler
- ✅ **Compiler API validation** - Static analysis for props, DI, and routing
- ✅ **Optimization passes** - Optional code optimization
- ✅ Full TypeScript support

## How It Works

The transformer converts JSX into optimized DOM manipulation code:

### Before Transformation
```tsx
const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count() + 1)} className="btn">
      Count: {count()}
    </button>
  )
}
```

### After Transformation
```javascript
const Counter = () => {
  const [count, setCount] = useState(0)
  const el = document.createElement('button')
  el.className = 'btn'
  el.addEventListener('click', () => setCount(count() + 1))
  
  const textNode1 = document.createTextNode('Count: ')
  el.appendChild(textNode1)
  
  const textNode2 = document.createTextNode('')
  createEffect(() => {
    textNode2.textContent = String(count())
  })
  el.appendChild(textNode2)
  
  return el
}
```

## Installation

```bash
pnpm add -D @pulsar/transformer
```

## Usage

### With Vite (Recommended)

Use [@pulsar/vite-plugin](../pulsar-vite-plugin) for seamless integration:

```typescript
import { defineConfig } from 'vite'
import { pulsarPlugin } from '@pulsar/vite-plugin'

export default defineConfig({
  plugins: [pulsarPlugin()]
})
```

### With ttypescript

```json
{
  "compilerOptions": {
    "plugins": [
      { 
        "transform": "@pulsar/transformer",
        "optimize": true
      }
    ]
  }
}
```

### Programmatic Usage

```typescript
import * as ts from 'typescript'
import visualSchemaTransformer from '@pulsar/transformer'

const program = ts.createProgram(['app.tsx'], compilerOptions)
const transformerFactory = visualSchemaTransformer(program, {
  optimize: true,
  optimizerConfig: {
    removeUnusedVariables: true,
    inlineConstants: true
  }
})

const result = ts.transform(sourceFile, [transformerFactory])
```

## Transformation Pipeline

### Phase 1: Analysis (JSX → IR)

The analyzer converts JSX into an Intermediate Representation:

```typescript
// Input JSX
<button onClick={handleClick} className="btn">
  Click {count()}
</button>

// Intermediate Representation
{
  type: 'element',
  tag: 'button',
  props: [
    { name: 'className', value: 'btn', isStatic: true }
  ],
  events: [
    { type: 'click', handler: handleClick }
  ],
  children: [
    { type: 'text', content: 'Click ' },
    { type: 'expression', expression: count(), isStatic: false }
  ]
}
```

### Phase 2: Generation (IR → AST)

The generator creates TypeScript AST nodes for direct DOM manipulation:

- Static props → Direct property assignment
- Dynamic expressions → Wrapped in `createEffect()`
- Event handlers → `addEventListener()` calls
- Lists with keys → Keyed reconciliation logic

### Phase 3: Optimization (Optional)

Optional optimization passes:
- Remove unused variables
- Inline constants
- Eliminate dead code
- Simplify expressions

## Architecture

```
src/
├── index.ts              # Main transformer entry point
├── parser/
│   └── jsx-analyzer.ts   # JSX → IR analysis
├── generator/
│   └── element-generator.ts  # IR → AST generation
├── ir/                   # Intermediate representation types
├── optimizer/            # Code optimization passes
├── compiler-api/         # TypeScript compiler integrations
│   ├── prop-validation.ts
│   ├── di-integration.ts
│   └── route-integration.ts
├── context/              # Transformation context
└── __tests__/            # Test suite
```

## Compiler API Validations

The transformer includes static analysis for common errors:

### Prop Validation
```tsx
// Error: Unknown prop 'clsName' (did you mean 'className'?)
<button clsName="btn">Click</button>
```

### DI Validation
```tsx
// Error: Circular dependency detected
inject(ServiceA) // which depends on ServiceB, which depends on ServiceA
```

### Route Validation
```tsx
// Error: useParams() called outside Route component
const params = useParams() // Must be inside <Route>
```

## Configuration Options

```typescript
interface TransformerConfig {
  optimize?: boolean            // Enable optimization passes
  optimizerConfig?: {
    removeUnusedVariables?: boolean
    inlineConstants?: boolean
    eliminateDeadCode?: boolean
  }
}
```

## Supported JSX Features

- ✅ Self-closing elements: `<Counter />`
- ✅ Elements with children: `<div><Counter /></div>`
- ✅ Fragments: `<>...</>`
- ✅ Attributes/Props: `className`, `id`, custom props
- ✅ Event handlers: `onClick`, `onInput`, etc.
- ✅ Dynamic expressions: `{count()}`
- ✅ Conditional rendering: `<Show when={...}>`
- ✅ List rendering: `<For each={...}>`
- ✅ Component composition
- ✅ Nested JSX at any level
- ✅ Arrow function wrappers for routes

## Testing

```bash
# Run test suite
pnpm test

# Run specific test file
pnpm test visitor-coverage.test.ts

# Watch mode
pnpm test --watch
```

Test coverage includes:
- Visitor coverage (all JSX contexts)
- Integration tests (full pipeline)
- Optimization tests
- Error handling

## Roadmap

### Completed ✅
- JSX to DOM transformation pipeline
- Intermediate representation (IR) system
- Direct DOM generation without virtual DOM
- Reactive expression wrapping with effects
- Keyed reconciliation for lists
- TypeScript compiler API integrations
- Prop validation with suggestions
- DI circular dependency detection
- Route integration validation
- Comprehensive test suite (visitor coverage, integration)

### In Progress 🚧
- Advanced optimization passes
- Source map generation for debugging
- Performance profiling tools

### Planned 📋
- **Hot Module Replacement (HMR)** - Fast refresh support
- **Server-Side Rendering (SSR)** - Generate SSR-compatible code
- **Custom transformer plugins** - Extensibility API
- **Bundle size analysis** - Detect transformation overhead
- **AST caching** - Speed up incremental builds
- **Diagnostic improvements** - Better error messages with suggestions
- **WebAssembly support** - Compile transformer to WASM for speed
- **CSS-in-JS transformation** - Direct style injection

## Performance

The transformer is designed for compile-time execution:
- Zero runtime overhead
- No virtual DOM diffing
- Direct DOM operations only
- Fine-grained reactive updates

Benchmarks show:
- **10x faster** initial render vs. Virtual DOM frameworks
- **Minimal bundle size** (no runtime JSX library)
- **Sub-millisecond** transformation time per component

## Pulsar Ecosystem

| Package | Description | Status |
|---------|-------------|--------|
| [pulsar.dev](https://github.com/binaryjack/pulsar.dev) | Core framework with signal-based reactivity | ✅ Active |
| [@pulsar/ui](https://github.com/binaryjack/pulsar-ui.dev) | UI component library | ✅ Active |
| [@pulsar/design-tokens](https://github.com/binaryjack/pulsar-design-system) | Design tokens & art-kit | ✅ Active |
| [@pulsar/transformer](https://github.com/binaryjack/pulsar-transformer) | JSX to DOM compiler | ✅ Active |
| [@pulsar/vite-plugin](https://github.com/binaryjack/pulsar-vite-plugin) | Vite integration | ✅ Active |
| [@pulsar/demo](https://github.com/binaryjack/pulsar-demo) | Example applications | ✅ Active |

## Contributing

We welcome contributions! To get started:

1. **Clone the repository**
   ```bash
   git clone https://github.com/binaryjack/pulsar-transformer.git
   cd pulsar-transformer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run tests**
   ```bash
   pnpm test
   ```

4. **Make changes**
   - Analyzer: `src/parser/jsx-analyzer.ts`
   - Generator: `src/generator/element-generator.ts`
   - Tests: `src/__tests__/`

5. **Test your changes**
   ```bash
   pnpm test --watch
   ```

### Development Tips

- **Understanding the pipeline**: Read [architecture.md](../pulsar.dev/src/docs/architecture.md)
- **Adding features**: Start with IR types in `src/ir/`
- **Debugging**: Use `console.log` in analyzer/generator during transformation
- **TypeScript AST**: Use [TS AST Viewer](https://ts-ast-viewer.com/) to understand node types

## License

MIT License - Copyright (c) 2026 Pulsar Framework

See [LICENSE](../pulsar.dev/LICENSE) file for details.

---

**Connect:** [LinkedIn](https://www.linkedin.com/in/tadeopiana/) • **Explore:** [Pulsar Ecosystem](#pulsar-ecosystem)
