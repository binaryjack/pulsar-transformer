# Pulsar Transformer Documentation

TSX to JavaScript transformer for the Pulsar framework.

---

## 📚 DOCUMENTATION

### Getting Started

- [README](../README.md) - Package overview and quick start
- Installation and basic usage

### [Architecture](./architecture/)

Transformer internals and design:

- Architecture overview
- Detection phase
- Generation phase
- Optimization strategies

### [Guides](./guides/)

How-to guides:

- JSX transformation
- Reactivity detection
- Custom plugins
- Debugging transformer issues

### [Examples](./examples/)

Transformation examples:

- Basic JSX
- Reactive expressions
- Advanced patterns

---

## 🎯 QUICK REFERENCE

### What is the Transformer?

The Pulsar Transformer is a TypeScript compiler plugin that transforms JSX/TSX code into optimized JavaScript that works with Pulsar's reactive system.

**Input (TSX):**

```tsx
const App = () => {
  const [count, setCount] = createSignal(0);
  return <div>Count: {count()}</div>;
};
```

**Output (JS):**

```javascript
const App = () => {
  const [count, setCount] = createSignal(0);
  return wire(div(), 'Count: ', count);
};
```

---

## 🔧 CONFIGURATION

See [README](../README.md) for configuration options.

---

## 🐛 TROUBLESHOOTING

Common issues and solutions:

1. **Transformer not detecting signals**
   - Check configuration
   - Enable debug mode
   - See [Debugging Guide](./guides/debugging.md)

2. **Incorrect transformation**
   - Review [Examples](./examples/)
   - Check [Known Issues](./architecture/known-issues.md)

---

## 🔗 RELATED

- [Transformer Architecture (Root Docs)](../../docs/architecture/transformation/)
- [Pulsar.dev Docs](../pulsar.dev/docs/)
- [Bug Reports](../../docs/bugs/transformer/)

---

**Package:** `@pulsar/transformer`  
**Last Updated:** 2026-02-03
