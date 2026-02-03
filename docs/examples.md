# Usage Examples

**Practical examples for using Pulsar Transformer**

---

## Basic Usage

### Simple Component Transformation

```typescript
import { createPipeline } from '@pulsar/transformer';

const pipeline = createPipeline();

const source = `
  component HelloWorld() {
    return <div>Hello, World!</div>;
  }
`;

const result = pipeline.transform(source);

console.log(result.code);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function HelloWorld(): HTMLElement {
  return $REGISTRY.execute('component:HelloWorld', () => {
    return t_element('div', null, ['Hello, World!']);
  });
}
```

---

## Signal Handling

### Basic Signal

```typescript
const source = `
  component Counter() {
    const [count, setCount] = signal(0);
    return <div>{count()}</div>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { createSignal, t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function Counter(): HTMLElement {
  return $REGISTRY.execute('component:Counter', () => {
    const [count, setCount] = createSignal(0);
    return t_element('div', null, [count()]);
  });
}
```

---

### Multiple Signals

```typescript
const source = `
  component Form() {
    const [name, setName] = signal('');
    const [age, setAge] = signal(0);
    return <div>{name()} - {age()}</div>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { createSignal, t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function Form(): HTMLElement {
  return $REGISTRY.execute('component:Form', () => {
    const [name, setName] = createSignal('');
    const [age, setAge] = createSignal(0);
    return t_element('div', null, [name(), ' - ', age()]);
  });
}
```

---

## Components with Parameters

### Simple Parameters

```typescript
const source = `
  component Greeting(name: string) {
    return <div>Hello {name}!</div>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function Greeting(name): HTMLElement {
  return $REGISTRY.execute('component:Greeting', () => {
    return t_element('div', null, ['Hello ', name, '!']);
  });
}
```

---

### Multiple Parameters

```typescript
const source = `
  component UserCard(name: string, age: number, role: string) {
    return <div>{name} - {age} - {role}</div>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function UserCard(name, age, role): HTMLElement {
  return $REGISTRY.execute('component:UserCard', () => {
    return t_element('div', null, [name, ' - ', age, ' - ', role]);
  });
}
```

---

## Nested Elements

### Element Hierarchy

```typescript
const source = `
  component Card() {
    return (
      <div>
        <header>Title</header>
        <main>Content</main>
        <footer>Footer</footer>
      </div>
    );
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function Card(): HTMLElement {
  return $REGISTRY.execute('component:Card', () => {
    return t_element('div', null, [
      t_element('header', null, ['Title']),
      t_element('main', null, ['Content']),
      t_element('footer', null, ['Footer']),
    ]);
  });
}
```

---

## Element Attributes

### Static Attributes

```typescript
const source = `
  component Button() {
    return <button class="btn-primary" type="button">Click</button>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function Button(): HTMLElement {
  return $REGISTRY.execute('component:Button', () => {
    return t_element('button', { class: 'btn-primary', type: 'button' }, ['Click']);
  });
}
```

---

### Dynamic Attributes

```typescript
const source = `
  component DynamicButton(label: string, disabled: boolean) {
    return <button disabled={disabled}>{label}</button>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function DynamicButton(label, disabled): HTMLElement {
  return $REGISTRY.execute('component:DynamicButton', () => {
    return t_element('button', { disabled: disabled }, [label]);
  });
}
```

---

## Event Handlers

### Click Handler

```typescript
const source = `
  component ClickButton() {
    const [count, setCount] = signal(0);
    return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
  }
`;

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { createSignal, t_element } from '@pulsar/runtime';
import { $REGISTRY } from '@pulsar/runtime/registry';

export function ClickButton(): HTMLElement {
  return $REGISTRY.execute('component:ClickButton', () => {
    const [count, setCount] = createSignal(0);
    return t_element(
      'button',
      {
        onClick: () => setCount(count() + 1),
      },
      [count()]
    );
  });
}
```

---

## Configuration Examples

### Custom Indentation

```typescript
const pipeline = createPipeline({
  emitterConfig: {
    indentSize: 4,
    useSpaces: true,
  },
});

const result = pipeline.transform(source);
```

**Output** (4-space indentation):

```typescript
import { t_element } from '@pulsar/runtime';

export function Component(): HTMLElement {
  return $REGISTRY.execute('component:Component', () => {
    return t_element('div', null, null);
  });
}
```

---

### Custom Runtime Paths

```typescript
const pipeline = createPipeline({
  emitterConfig: {
    runtimePaths: {
      core: '@my-org/runtime',
      registry: '@my-org/registry',
    },
  },
});

const result = pipeline.transform(source);
```

**Output**:

```typescript
import { t_element } from '@my-org/runtime';
import { $REGISTRY } from '@my-org/registry';

export function Component(): HTMLElement {
  return $REGISTRY.execute('component:Component', () => {
    return t_element('div', null, null);
  });
}
```

---

## Debug Mode

### Enable Diagnostics

```typescript
const pipeline = createPipeline({ debug: true });

const result = pipeline.transform(source);

console.log('Diagnostics:', result.diagnostics);
// [
//   { type: 'info', phase: 'lexer', message: 'Lexer: 17 tokens generated' },
//   { type: 'info', phase: 'parser', message: 'Parser: AST with 1 nodes' },
//   { type: 'info', phase: 'analyzer', message: 'Analyzer: IR generated' },
//   { type: 'info', phase: 'transform', message: 'Transform: IR pass-through (optimization pending)' },
//   { type: 'info', phase: 'emitter', message: 'Emitter: Received IR type ComponentIR' },
//   { type: 'info', phase: 'emitter', message: 'Emitter: 8 lines generated' }
// ]
```

---

### Performance Metrics

```typescript
const pipeline = createPipeline({ debug: true });

const result = pipeline.transform(source);

if (result.metrics) {
  console.table(result.metrics);
  // ┌──────────────┬────────┐
  // │   (index)    │ Values │
  // ├──────────────┼────────┤
  // │  lexerTime   │  0.15  │
  // │  parserTime  │  0.32  │
  // │ analyzerTime │  0.28  │
  // │transformTime │  0.05  │
  // │ emitterTime  │  0.42  │
  // │  totalTime   │  1.22  │
  // └──────────────┴────────┘
}
```

---

## Error Handling

### Check for Errors

```typescript
const result = pipeline.transform(source);

const errors = result.diagnostics.filter((d) => d.type === 'error');

if (errors.length > 0) {
  console.error('Transformation failed:');
  errors.forEach((err) => {
    console.error(`  [${err.phase}] ${err.message}`);
  });
  process.exit(1);
}

// Safe to use code
console.log(result.code);
```

---

### Detailed Error Reporting

```typescript
const result = pipeline.transform(source);

result.diagnostics.forEach((diagnostic) => {
  const icon = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[diagnostic.type];

  console.log(`${icon} [${diagnostic.phase}] ${diagnostic.message}`);

  if (diagnostic.location) {
    console.log(`   at line ${diagnostic.location.line}, column ${diagnostic.location.column}`);
  }
});
```

---

## File Processing

### Single File

```typescript
import fs from 'fs/promises';
import { createPipeline } from '@pulsar/transformer';

async function transformFile(inputPath: string, outputPath: string) {
  const pipeline = createPipeline();

  const source = await fs.readFile(inputPath, 'utf-8');
  const result = pipeline.transform(source);

  if (result.diagnostics.some((d) => d.type === 'error')) {
    throw new Error('Transformation failed');
  }

  await fs.writeFile(outputPath, result.code, 'utf-8');
}

await transformFile('src/Counter.psr', 'dist/Counter.ts');
```

---

### Batch Processing

```typescript
import { glob } from 'glob';
import { createPipeline } from '@pulsar/transformer';

async function transformDirectory(pattern: string) {
  const pipeline = createPipeline({ debug: true });
  const files = await glob(pattern);

  const results = await Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(file, 'utf-8');
      const result = pipeline.transform(source);

      const outputPath = file.replace('.psr', '.ts');
      await fs.writeFile(outputPath, result.code);

      return {
        file,
        metrics: result.metrics,
        diagnostics: result.diagnostics,
      };
    })
  );

  // Aggregate metrics
  const totalTime = results.reduce((sum, r) => sum + (r.metrics?.totalTime || 0), 0);
  console.log(`Transformed ${results.length} files in ${totalTime.toFixed(2)}ms`);
}

await transformDirectory('src/**/*.psr');
```

---

## Watch Mode

```typescript
import chokidar from 'chokidar';
import { createPipeline } from '@pulsar/transformer';

const pipeline = createPipeline({ debug: true });

const watcher = chokidar.watch('src/**/*.psr', {
  persistent: true,
});

watcher.on('change', async (path) => {
  console.log(`File changed: ${path}`);

  const source = await fs.readFile(path, 'utf-8');
  const result = pipeline.transform(source);

  if (result.diagnostics.some((d) => d.type === 'error')) {
    console.error('Transformation failed:', result.diagnostics);
    return;
  }

  const outputPath = path.replace('.psr', '.ts');
  await fs.writeFile(outputPath, result.code);

  console.log(`✓ Transformed ${path} → ${outputPath}`);
});
```

---

## Integration Examples

### Vite Plugin

```typescript
import { createPipeline } from '@pulsar/transformer';
import type { Plugin } from 'vite';

export function pulsarPlugin(): Plugin {
  const pipeline = createPipeline();

  return {
    name: 'vite-plugin-pulsar',

    transform(code, id) {
      if (!id.endsWith('.psr')) {
        return null;
      }

      const result = pipeline.transform(code);

      if (result.diagnostics.some((d) => d.type === 'error')) {
        this.error(result.diagnostics.map((d) => d.message).join('\n'));
        return null;
      }

      return {
        code: result.code,
        map: null, // TODO: Source maps
      };
    },
  };
}
```

---

### Webpack Loader

```typescript
import { createPipeline } from '@pulsar/transformer';

const pipeline = createPipeline();

export default function pulsarLoader(source: string) {
  const callback = this.async();

  const result = pipeline.transform(source);

  const errors = result.diagnostics.filter((d) => d.type === 'error');
  if (errors.length > 0) {
    callback(new Error(errors.map((e) => e.message).join('\n')));
    return;
  }

  callback(null, result.code);
}
```

---

### ESBuild Plugin

```typescript
import { createPipeline } from '@pulsar/transformer';
import type { Plugin } from 'esbuild';
import fs from 'fs/promises';

export function pulsarPlugin(): Plugin {
  const pipeline = createPipeline();

  return {
    name: 'pulsar',
    setup(build) {
      build.onLoad({ filter: /\.psr$/ }, async (args) => {
        const source = await fs.readFile(args.path, 'utf-8');
        const result = pipeline.transform(source);

        if (result.diagnostics.some((d) => d.type === 'error')) {
          return {
            errors: result.diagnostics.map((d) => ({
              text: d.message,
              location: d.location,
            })),
          };
        }

        return {
          contents: result.code,
          loader: 'ts',
        };
      });
    },
  };
}
```

---

## Testing Examples

### Unit Testing Components

```typescript
import { createPipeline } from '@pulsar/transformer';
import { describe, it, expect } from 'vitest';

describe('Component transformation', () => {
  const pipeline = createPipeline();

  it('should transform simple component', () => {
    const source = `
      component Test() {
        return <div>Test</div>;
      }
    `;

    const result = pipeline.transform(source);

    expect(result.code).toContain('export function Test()');
    expect(result.code).toContain("t_element('div'");
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should transform signal component', () => {
    const source = `
      component Counter() {
        const [count, setCount] = signal(0);
        return <div>{count()}</div>;
      }
    `;

    const result = pipeline.transform(source);

    expect(result.code).toContain('createSignal(0)');
    expect(result.code).toContain('[count, setCount]');
    expect(result.diagnostics.filter((d) => d.type === 'error')).toHaveLength(0);
  });
});
```

---

### Snapshot Testing

```typescript
import { createPipeline } from '@pulsar/transformer';

describe('Snapshot tests', () => {
  const pipeline = createPipeline();

  it('matches snapshot for Counter component', () => {
    const source = `
      component Counter() {
        const [count, setCount] = signal(0);
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
      }
    `;

    const result = pipeline.transform(source);
    expect(result.code).toMatchSnapshot();
  });
});
```

---

## Advanced Patterns

### Conditional Transformation

```typescript
const pipeline = createPipeline();

function transformWithFallback(source: string): string {
  const result = pipeline.transform(source);

  if (result.diagnostics.some((d) => d.type === 'error')) {
    // Fallback to identity transformation
    console.warn('Transformation failed, returning original source');
    return source;
  }

  return result.code;
}
```

---

### Caching Results

```typescript
const cache = new Map<string, string>();
const pipeline = createPipeline();

function transformWithCache(source: string): string {
  const hash = createHash('sha256').update(source).digest('hex');

  if (cache.has(hash)) {
    return cache.get(hash)!;
  }

  const result = pipeline.transform(source);
  cache.set(hash, result.code);

  return result.code;
}
```

---

### Pipeline Composition

```typescript
import { createPipeline } from '@pulsar/transformer';

// Pre-processing pipeline
function preProcess(source: string): string {
  return source
    .replace(/\/\/.*$/gm, '') // Remove comments
    .trim();
}

// Post-processing pipeline
function postProcess(code: string): string {
  return code
    .replace(/\s+$/gm, '') // Remove trailing whitespace
    .concat('\n'); // Add final newline
}

const pipeline = createPipeline();

function transformWithProcessing(source: string): string {
  const preprocessed = preProcess(source);
  const result = pipeline.transform(preprocessed);
  return postProcess(result.code);
}
```

---

## See Also

- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)
- [Troubleshooting Guide](./troubleshooting.md)
