# API Reference

**Complete API documentation for Pulsar Transformer**

---

## Core API

### `createPipeline(config?)`

Creates a new transformation pipeline.

**Signature**:

```typescript
function createPipeline(config?: IPipelineConfig): IPipeline;
```

**Parameters**:

- `config` (optional): Pipeline configuration object

**Returns**: Pipeline instance with `transform()` method

**Example**:

```typescript
import { createPipeline } from '@pulsar/transformer';

const pipeline = createPipeline();
const result = pipeline.transform(source);
```

---

### `IPipelineConfig`

Configuration options for the pipeline.

```typescript
interface IPipelineConfig {
  /**
   * Enable debug mode (diagnostics + metrics)
   * @default false
   */
  debug?: boolean;

  /**
   * Emitter configuration
   */
  emitterConfig?: IEmitterConfig;

  /**
   * Source file path (for error messages)
   */
  filePath?: string;
}
```

**Example**:

```typescript
const pipeline = createPipeline({
  debug: true,
  filePath: 'src/components/Counter.psr',
  emitterConfig: {
    indentSize: 4,
    useSpaces: true,
  },
});
```

---

### `IEmitterConfig`

Emitter configuration options.

```typescript
interface IEmitterConfig {
  /**
   * Indent size in spaces
   * @default 2
   */
  indentSize?: number;

  /**
   * Use spaces instead of tabs
   * @default true
   */
  useSpaces?: boolean;

  /**
   * Runtime import paths
   */
  runtimePaths?: {
    core?: string;
    registry?: string;
  };

  /**
   * Auto-generate imports
   * @default true
   */
  autoImport?: boolean;
}
```

**Example**:

```typescript
const config: IEmitterConfig = {
  indentSize: 4,
  useSpaces: true,
  runtimePaths: {
    core: '@my-framework/runtime',
    registry: '@my-framework/registry',
  },
  autoImport: true,
};
```

---

### `IPipeline.transform(source, config?)`

Transform PSR source code to TypeScript.

**Signature**:

```typescript
transform(source: string, config?: Partial<IPipelineConfig>): ITransformResult
```

**Parameters**:

- `source`: PSR source code string
- `config` (optional): Override pipeline config for this transform

**Returns**: Transform result with code, diagnostics, and metrics

**Example**:

```typescript
const pipeline = createPipeline();

const result = pipeline.transform(`
  component Counter() {
    const [count, setCount] = signal(0);
    return <div>{count()}</div>;
  }
`);

console.log(result.code);
// import { createSignal, t_element } from '@pulsar/runtime';
// ...
```

---

### `ITransformResult`

Result of a transformation.

```typescript
interface ITransformResult {
  /**
   * Generated TypeScript code
   */
  code: string;

  /**
   * Diagnostics (errors, warnings, info)
   */
  diagnostics: IDiagnostic[];

  /**
   * Performance metrics (debug mode only)
   */
  metrics?: IMetrics;
}
```

**Example**:

```typescript
const result = pipeline.transform(source);

if (result.diagnostics.some((d) => d.type === 'error')) {
  console.error('Transformation failed:', result.diagnostics);
} else {
  console.log('Generated code:', result.code);
}
```

---

### `IDiagnostic`

Diagnostic message from transformation.

```typescript
interface IDiagnostic {
  /**
   * Diagnostic type
   */
  type: 'error' | 'warning' | 'info';

  /**
   * Pipeline phase that generated diagnostic
   */
  phase: 'lexer' | 'parser' | 'analyzer' | 'transform' | 'emitter';

  /**
   * Diagnostic message
   */
  message: string;

  /**
   * Source location (if available)
   */
  location?: {
    line: number;
    column: number;
    offset: number;
  };
}
```

**Example**:

```typescript
result.diagnostics.forEach((diagnostic) => {
  const prefix = diagnostic.type === 'error' ? '❌' : diagnostic.type === 'warning' ? '⚠️' : 'ℹ️';

  console.log(`${prefix} [${diagnostic.phase}] ${diagnostic.message}`);

  if (diagnostic.location) {
    console.log(`   at line ${diagnostic.location.line}, column ${diagnostic.location.column}`);
  }
});
```

---

### `IMetrics`

Performance metrics (debug mode).

```typescript
interface IMetrics {
  /**
   * Lexer phase time (ms)
   */
  lexerTime: number;

  /**
   * Parser phase time (ms)
   */
  parserTime: number;

  /**
   * Analyzer phase time (ms)
   */
  analyzerTime: number;

  /**
   * Transform phase time (ms)
   */
  transformTime: number;

  /**
   * Emitter phase time (ms)
   */
  emitterTime: number;

  /**
   * Total transformation time (ms)
   */
  totalTime: number;
}
```

**Example**:

```typescript
const pipeline = createPipeline({ debug: true });
const result = pipeline.transform(source);

if (result.metrics) {
  console.log('Performance breakdown:');
  console.log(`  Lexer:     ${result.metrics.lexerTime.toFixed(2)}ms`);
  console.log(`  Parser:    ${result.metrics.parserTime.toFixed(2)}ms`);
  console.log(`  Analyzer:  ${result.metrics.analyzerTime.toFixed(2)}ms`);
  console.log(`  Transform: ${result.metrics.transformTime.toFixed(2)}ms`);
  console.log(`  Emitter:   ${result.metrics.emitterTime.toFixed(2)}ms`);
  console.log(`  Total:     ${result.metrics.totalTime.toFixed(2)}ms`);
}
```

---

## Lexer API

### `createLexer()`

Create a new lexer instance.

**Signature**:

```typescript
function createLexer(): ILexer;
```

**Returns**: Lexer instance

**Example**:

```typescript
import { createLexer } from '@pulsar/transformer';

const lexer = createLexer();
const tokens = lexer.tokenize('component Counter() {}');
```

---

### `ILexer.tokenize(source)`

Tokenize source code.

**Signature**:

```typescript
tokenize(source: string): IToken[]
```

**Parameters**:

- `source`: PSR source code

**Returns**: Array of tokens

**Example**:

```typescript
const tokens = lexer.tokenize('const x = 10;');
// [
//   { type: 'CONST', value: 'const', line: 1, column: 1 },
//   { type: 'IDENTIFIER', value: 'x', line: 1, column: 7 },
//   { type: 'EQUAL', value: '=', line: 1, column: 9 },
//   { type: 'NUMBER', value: '10', line: 1, column: 11 },
//   { type: 'SEMICOLON', value: ';', line: 1, column: 13 },
//   { type: 'EOF', value: '', line: 1, column: 14 }
// ]
```

---

### `IToken`

Token produced by lexer.

```typescript
interface IToken {
  /**
   * Token type
   */
  type: TokenType;

  /**
   * Token value (raw text)
   */
  value: string;

  /**
   * Line number (1-indexed)
   */
  line: number;

  /**
   * Column number (1-indexed)
   */
  column: number;

  /**
   * Byte offset from start
   */
  start: number;

  /**
   * Byte offset to end
   */
  end: number;
}
```

---

## Parser API

### `createParser(tokens)`

Create a new parser instance.

**Signature**:

```typescript
function createParser(tokens: IToken[]): IParser;
```

**Parameters**:

- `tokens`: Token array from lexer

**Returns**: Parser instance

**Example**:

```typescript
import { createParser } from '@pulsar/transformer';

const parser = createParser(tokens);
const ast = parser.parse();
```

---

### `IParser.parse()`

Parse tokens into AST.

**Signature**:

```typescript
parse(): IASTNode[]
```

**Returns**: AST node array

**Example**:

```typescript
const ast = parser.parse();
// [
//   {
//     type: 'ComponentDeclaration',
//     name: 'Counter',
//     params: [],
//     body: [...]
//   }
// ]
```

---

## Analyzer API

### `createAnalyzer()`

Create a new analyzer instance.

**Signature**:

```typescript
function createAnalyzer(): IAnalyzer;
```

**Returns**: Analyzer instance

**Example**:

```typescript
import { createAnalyzer } from '@pulsar/transformer';

const analyzer = createAnalyzer();
const ir = analyzer.analyze(ast);
```

---

### `IAnalyzer.analyze(ast)`

Analyze AST and generate IR.

**Signature**:

```typescript
analyze(ast: IASTNode[]): IIRNode[]
```

**Parameters**:

- `ast`: AST from parser

**Returns**: IR node array

**Example**:

```typescript
const ir = analyzer.analyze(ast);
// [
//   {
//     type: 'ComponentIR',
//     name: 'Counter',
//     usesSignals: true,
//     reactiveDependencies: ['count'],
//     body: [...]
//   }
// ]
```

---

## Emitter API

### `createEmitter(config?)`

Create a new emitter instance.

**Signature**:

```typescript
function createEmitter(config?: IEmitterConfig): IEmitter;
```

**Parameters**:

- `config` (optional): Emitter configuration

**Returns**: Emitter instance

**Example**:

```typescript
import { createEmitter } from '@pulsar/transformer';

const emitter = createEmitter({
  indentSize: 4,
  useSpaces: true,
});
```

---

### `IEmitter.emit(ir)`

Generate TypeScript code from IR.

**Signature**:

```typescript
emit(ir: IIRNode): string
```

**Parameters**:

- `ir`: IR node from analyzer

**Returns**: Generated TypeScript code

**Example**:

```typescript
const code = emitter.emit(componentIR);
// "export function Counter(): HTMLElement {\n  ...\n}"
```

---

## Type Definitions

### `TokenType`

All supported token types.

```typescript
type TokenType =
  | 'COMPONENT'
  | 'IDENTIFIER'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LT'
  | 'GT'
  | 'SLASH'
  | 'EQUAL'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'STRING'
  | 'NUMBER'
  | 'CONST'
  | 'LET'
  | 'RETURN'
  | 'EOF';
```

---

### `ASTNodeType`

All AST node types.

```typescript
enum ASTNodeType {
  COMPONENT_DECLARATION = 'ComponentDeclaration',
  VARIABLE_DECLARATION = 'VariableDeclaration',
  RETURN_STATEMENT = 'ReturnStatement',
  PSR_ELEMENT = 'PSRElement',
  IDENTIFIER = 'Identifier',
  LITERAL = 'Literal',
  CALL_EXPRESSION = 'CallExpression',
  ARROW_FUNCTION = 'ArrowFunction',
}
```

---

### `IRNodeType`

All IR node types.

```typescript
enum IRNodeType {
  COMPONENT_IR = 'ComponentIR',
  ELEMENT_IR = 'ElementIR',
  SIGNAL_BINDING_IR = 'SignalBindingIR',
  EVENT_HANDLER_IR = 'EventHandlerIR',
  LITERAL_IR = 'LiteralIR',
  IDENTIFIER_IR = 'IdentifierIR',
  CALL_EXPRESSION_IR = 'CallExpressionIR',
  ARROW_FUNCTION_IR = 'ArrowFunctionIR',
  VARIABLE_DECLARATION_IR = 'VariableDeclarationIR',
  RETURN_STATEMENT_IR = 'ReturnStatementIR',
  REGISTRY_REGISTRATION_IR = 'RegistryRegistrationIR',
  REGISTRY_LOOKUP_IR = 'RegistryLookupIR',
}
```

---

## Error Types

### `LexerError`

Thrown when lexer encounters invalid syntax.

```typescript
class LexerError extends Error {
  line: number;
  column: number;
  offset: number;
}
```

**Example**:

```typescript
try {
  const tokens = lexer.tokenize(source);
} catch (error) {
  if (error instanceof LexerError) {
    console.error(`Lexer error at ${error.line}:${error.column}: ${error.message}`);
  }
}
```

---

### `ParserError`

Thrown when parser encounters invalid AST.

```typescript
class ParserError extends Error {
  token: IToken;
  expected: string;
}
```

**Example**:

```typescript
try {
  const ast = parser.parse();
} catch (error) {
  if (error instanceof ParserError) {
    console.error(`Parser error at token ${error.token.value}`);
    console.error(`Expected: ${error.expected}`);
  }
}
```

---

### `AnalyzerError`

Thrown when analyzer encounters invalid IR.

```typescript
class AnalyzerError extends Error {
  node: IASTNode;
  context: string;
}
```

---

### `EmitterError`

Thrown when emitter cannot generate code.

```typescript
class EmitterError extends Error {
  ir: IIRNode;
  phase: string;
}
```

---

## Utility Functions

### `isSignalCreation(node)`

Check if call expression creates a signal.

**Signature**:

```typescript
function isSignalCreation(node: ICallExpressionIR): boolean;
```

**Example**:

```typescript
if (isSignalCreation(callExpr)) {
  console.log('Signal creation detected');
}
```

---

### `isStaticElement(node)`

Check if element has no dynamic content.

**Signature**:

```typescript
function isStaticElement(node: IElementIR): boolean;
```

**Example**:

```typescript
if (isStaticElement(elementIR)) {
  // Can optimize rendering
}
```

---

## Advanced Usage

### Custom Transform Pipeline

```typescript
import { createLexer, createParser, createAnalyzer, createEmitter } from '@pulsar/transformer';

// Manual pipeline
const lexer = createLexer();
const tokens = lexer.tokenize(source);

const parser = createParser(tokens);
const ast = parser.parse();

const analyzer = createAnalyzer();
const ir = analyzer.analyze(ast);

// Custom transform
const optimizedIR = myCustomTransform(ir);

const emitter = createEmitter();
const code = emitter.emit(optimizedIR);
```

---

### Streaming Transformation

```typescript
import { createPipeline } from '@pulsar/transformer';

const pipeline = createPipeline();

async function* transformStream(chunks: AsyncIterable<string>) {
  let buffer = '';

  for await (const chunk of chunks) {
    buffer += chunk;

    // Try to transform complete components
    const match = buffer.match(/component\s+\w+\s*\([^)]*\)\s*{[^}]*}/);
    if (match) {
      const result = pipeline.transform(match[0]);
      yield result.code;
      buffer = buffer.slice(match[0].length);
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const result = pipeline.transform(buffer);
    yield result.code;
  }
}
```

---

## TypeScript Integration

### Type Definitions

All exports are fully typed:

```typescript
import type {
  IPipeline,
  IPipelineConfig,
  ITransformResult,
  IToken,
  IASTNode,
  IIRNode,
  IEmitterConfig,
} from '@pulsar/transformer';

const config: IPipelineConfig = {
  debug: true,
  emitterConfig: {
    indentSize: 2,
  },
};

const pipeline: IPipeline = createPipeline(config);
const result: ITransformResult = pipeline.transform(source);
```

---

## Best Practices

### 1. Reuse Pipeline Instances

```typescript
// ✅ Good: Reuse pipeline
const pipeline = createPipeline();
files.forEach((file) => {
  const result = pipeline.transform(file.content);
});

// ❌ Bad: Create new pipeline each time
files.forEach((file) => {
  const pipeline = createPipeline();
  const result = pipeline.transform(file.content);
});
```

### 2. Enable Debug Mode in Development

```typescript
const isDev = process.env.NODE_ENV === 'development';

const pipeline = createPipeline({
  debug: isDev,
});
```

### 3. Handle Errors Gracefully

```typescript
const result = pipeline.transform(source);

const errors = result.diagnostics.filter((d) => d.type === 'error');
if (errors.length > 0) {
  // Handle errors
  console.error('Transformation failed:', errors);
  return;
}

// Use generated code
fs.writeFileSync('output.ts', result.code);
```

### 4. Configure Runtime Paths

```typescript
const pipeline = createPipeline({
  emitterConfig: {
    runtimePaths: {
      core: '@my-org/pulsar-runtime',
      registry: '@my-org/pulsar-registry',
    },
  },
});
```

---

## See Also

- [Architecture Overview](./architecture.md)
- [Usage Examples](./examples.md)
- [Troubleshooting Guide](./troubleshooting.md)
