# Troubleshooting Guide

**Common issues and solutions for Pulsar Transformer**

---

## Installation Issues

### Module Not Found

**Error**:

```
Cannot find module '@pulsar/transformer'
```

**Solution**:

```bash
# Ensure package is installed
pnpm install @pulsar/transformer

# Check node_modules
ls node_modules/@pulsar/transformer

# Rebuild if needed
pnpm rebuild
```

---

### TypeScript Errors

**Error**:

```
Could not find a declaration file for module '@pulsar/transformer'
```

**Solution**:

```bash
# Ensure TypeScript definitions are included
pnpm install -D @types/node

# Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## Transformation Errors

### Unexpected Token

**Error**:

```
ParserError: Unexpected token 'IDENTIFIER' at line 3, column 10
Expected: 'RPAREN' but got 'IDENTIFIER'
```

**Cause**: Invalid PSR syntax

**Solution**:

```typescript
// ❌ Wrong: Missing closing paren
component Test(name {
  return <div>{name}</div>;
}

// ✅ Correct
component Test(name) {
  return <div>{name}</div>;
}
```

---

### Signal Not Detected

**Error**: `signal()` not transformed to `createSignal()`

**Cause**: Signal detection failed

**Solution**:

```typescript
// ✅ Ensure proper signal syntax
const [count, setCount] = signal(0); // Detected
const count = signal(0); // Not detected (no destructuring)

// Check analyzer output
const pipeline = createPipeline({ debug: true });
const result = pipeline.transform(source);
console.log(result.diagnostics); // Look for analyzer warnings
```

---

### Missing Imports

**Error**: Generated code missing `createSignal` import

**Cause**: Auto-import disabled or signal not detected

**Solution**:

```typescript
// Enable auto-import (default)
const pipeline = createPipeline({
  emitterConfig: {
    autoImport: true,
  },
});

// Verify signal detection
const result = pipeline.transform(source);
console.log(result.code); // Should contain import statement
```

---

## Runtime Issues

### Component Not Rendering

**Error**: Component returns undefined or null

**Cause**: Missing return statement or invalid JSX

**Solution**:

```typescript
// ❌ Wrong: No return
component Test() {
  <div>Content</div>;
}

// ✅ Correct: Explicit return
component Test() {
  return <div>Content</div>;
}
```

---

### Registry Not Found

**Error**: `$REGISTRY is not defined`

**Cause**: Missing runtime dependency

**Solution**:

```bash
# Install runtime
pnpm install @pulsar/runtime

# Verify import path in generated code
import { $REGISTRY } from '@pulsar/runtime/registry';
```

---

### Signal Updates Not Working

**Error**: Component doesn't re-render on signal change

**Cause**: Signal not called as function

**Solution**:

```typescript
// ❌ Wrong: Direct access
<div>{count}</div>

// ✅ Correct: Call as function
<div>{count()}</div>
```

---

## Performance Issues

### Slow Transformation

**Symptom**: Transformation takes >100ms for small files

**Diagnosis**:

```typescript
const pipeline = createPipeline({ debug: true });
const result = pipeline.transform(source);

console.table(result.metrics);
// Identify slow phase
```

**Solutions**:

1. **Cache Pipeline Instance**:

   ```typescript
   // ✅ Good: Reuse pipeline
   const pipeline = createPipeline();
   files.forEach((file) => pipeline.transform(file));

   // ❌ Bad: Create new pipeline each time
   files.forEach((file) => {
     const pipeline = createPipeline();
     pipeline.transform(file);
   });
   ```

2. **Optimize Source**:

   ```typescript
   // Remove unnecessary whitespace
   const source = rawSource.trim();
   ```

3. **Disable Debug Mode in Production**:
   ```typescript
   const pipeline = createPipeline({
     debug: process.env.NODE_ENV === 'development',
   });
   ```

---

### High Memory Usage

**Symptom**: Memory grows with each transformation

**Cause**: Not releasing references

**Solution**:

```typescript
// ✅ Create new pipeline for each batch
async function transformBatch(files: string[]) {
  const pipeline = createPipeline();

  const results = files.map((file) => pipeline.transform(file));

  // Pipeline is garbage collected after function returns
  return results;
}
```

---

## Debug Mode

### Enable Detailed Logging

```typescript
const pipeline = createPipeline({ debug: true });
const result = pipeline.transform(source);

// View all diagnostics
result.diagnostics.forEach((d) => {
  console.log(`[${d.phase}] ${d.type}: ${d.message}`);
  if (d.location) {
    console.log(`  at ${d.location.line}:${d.location.column}`);
  }
});

// View performance metrics
console.table(result.metrics);
```

---

### Inspect Intermediate Representations

```typescript
import { createLexer, createParser, createAnalyzer } from '@pulsar/transformer';

// Step-by-step inspection
const lexer = createLexer();
const tokens = lexer.tokenize(source);
console.log('Tokens:', tokens);

const parser = createParser(tokens);
const ast = parser.parse();
console.log('AST:', JSON.stringify(ast, null, 2));

const analyzer = createAnalyzer();
const ir = analyzer.analyze(ast);
console.log('IR:', JSON.stringify(ir, null, 2));
```

---

## Build Tool Integration

### Vite Plugin Not Working

**Error**: `.psr` files not transforming

**Solution**:

```typescript
// vite.config.ts
import { pulsarPlugin } from '@pulsar/vite-plugin';

export default {
  plugins: [
    pulsarPlugin(), // Must be first plugin
  ],
};
```

---

### Webpack Loader Issues

**Error**: Module parse failed

**Solution**:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.psr$/,
        use: '@pulsar/webpack-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.psr', '.ts', '.js'],
  },
};
```

---

### ESBuild Plugin Not Loading

**Error**: Unknown file extension ".psr"

**Solution**:

```typescript
import { build } from 'esbuild';
import { pulsarPlugin } from '@pulsar/esbuild-plugin';

await build({
  entryPoints: ['src/index.psr'],
  bundle: true,
  plugins: [pulsarPlugin()],
  loader: {
    '.psr': 'ts', // Fallback loader
  },
});
```

---

## Type Issues

### Invalid IR Type

**Error**: `Unsupported expression IR type: XYZ`

**Cause**: Emitter doesn't handle IR node type

**Solution**:

```typescript
// Check if you're using unsupported syntax
// File an issue with example code
```

---

### Type Annotation Errors

**Note**: Type annotations are intentionally skipped

```typescript
// PSR input
component Test(name: string, age: number) {
  return <div>{name} - {age}</div>;
}

// TypeScript output (no types)
export function Test(name, age): HTMLElement {
  return $REGISTRY.execute('component:Test', () => {
    return t_element('div', null, [name, ' - ', age]);
  });
}

// ✅ This is expected behavior
// Use JSDoc for type hints instead
```

---

## Common Gotchas

### 1. JSX Expression Syntax

```typescript
// ❌ Wrong: String interpolation
<div>"Count: {count()}"</div>

// ✅ Correct: Separate text nodes
<div>Count: {count()}</div>
```

---

### 2. Event Handler Binding

```typescript
// ❌ Wrong: Direct method call
<button onClick={handleClick()}>Click</button>

// ✅ Correct: Arrow function
<button onClick={() => handleClick()}>Click</button>
```

---

### 3. Destructuring Syntax

```typescript
// ✅ Correct: Array destructuring
const [count, setCount] = signal(0);

// ❌ Wrong: Object destructuring
const { count, setCount } = signal(0);
```

---

### 4. Return Statement Required

```typescript
// ❌ Wrong: No return
component Test() {
  const result = <div>Test</div>;
  result;
}

// ✅ Correct: Explicit return
component Test() {
  const result = <div>Test</div>;
  return result;
}
```

---

## Getting Help

### Reporting Issues

Include:

1. **Source code** (minimal reproduction)
2. **Error message** (full stack trace)
3. **Environment** (Node version, OS, package versions)
4. **Debug output** (from debug mode)

**Example**:

```typescript
// Minimal reproduction
const source = `
  component Test() {
    return <div>Test</div>;
  }
`;

const pipeline = createPipeline({ debug: true });
const result = pipeline.transform(source);

console.log('Error:', result.diagnostics);
console.log('Metrics:', result.metrics);
console.log('Output:', result.code);
```

---

### Debug Checklist

Before reporting an issue:

- [ ] Source code is valid PSR syntax
- [ ] Dependencies installed (`@pulsar/runtime`)
- [ ] Pipeline configured correctly
- [ ] Debug mode enabled
- [ ] Error reproduced with minimal code
- [ ] Checked this troubleshooting guide
- [ ] Searched existing issues

---

## FAQ

### Q: Why are type annotations removed?

**A**: PSR focuses on runtime behavior. TypeScript types are development-time only and not needed in output. Use JSDoc for type hints.

---

### Q: Can I preserve comments?

**A**: Currently no. Comments are stripped during lexing. This is intentional for clean output.

---

### Q: How do I debug transform optimization?

**A**: Transform phase is currently pass-through. Optimization will be added in future releases.

---

### Q: Can I customize the registry pattern?

**A**: Yes, via emitter configuration:

```typescript
const pipeline = createPipeline({
  emitterConfig: {
    runtimePaths: {
      registry: '@my-org/custom-registry',
    },
  },
});
```

---

### Q: How do I handle large files?

**A**: Consider:

1. Splitting into smaller components
2. Using streaming transformation
3. Processing in batches

---

### Q: What's the file size limit?

**A**: No hard limit, but performance degrades >10MB. Consider preprocessing.

---

## See Also

- [Architecture Overview](./architecture.md)
- [API Reference](./api-reference.md)
- [Usage Examples](./examples.md)
- [Contributing Guide](../CONTRIBUTING.md)
