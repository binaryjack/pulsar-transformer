# NEXT AI AGENT: Phase 4 - AST Transformer Implementation

**Start Date:** 2026-02-10 (or later)  
**Estimated Duration:** 2-3 days  
**Priority:** MEDIUM (Architectural improvement, not critical)  
**Dependencies:** ✅ Lexer, ✅ Parser, ✅ Semantic Analyzer

---

## ⚠️ CRITICAL: UNDERSTAND CURRENT STATE FIRST

### **CodeGenerator Already Works** (Monolithic Approach)

The pipeline WORKS today (84.5% tests passing):

```
PSR → Lexer → Parser → CodeGenerator → TypeScript
                       ↑
                       Does BOTH:
                       • Transformation (PSR AST → TS structures)
                       • Emission (TS structures → string code)
```

**What CodeGenerator does:**

- ✅ Transforms ComponentDeclaration → function with $REGISTRY.execute()
- ✅ Converts JSX → t_element() calls
- ✅ Detects and preserves signal() calls
- ✅ Generates clean TypeScript output
- ⚠️ **BUT:** Mixes transformation logic + emission logic in one phase

### **Why Build a Separate Transformer?**

This is an **ARCHITECTURAL IMPROVEMENT**, not a bug fix:

| Current (Monolithic)         | Future (Clean Separation)      |
| ---------------------------- | ------------------------------ |
| ✅ Works (84.5% tests)       | ✅ Cleaner architecture        |
| ⚠️ Mixed concerns            | ✅ Testable separately         |
| ⚠️ Transform + emit together | ✅ Transform vs. emit isolated |
| ✅ Faster to build           | ⚠️ More files to maintain      |

**Verdict:** This is OPTIONAL cleanup. If pipeline is working well enough, this task can be DEFERRED.

**Proceed ONLY if:**

- Tadeo confirms architectural cleanup is priority
- Tests are all passing and stable
- You have 2-3 days for refactoring

Otherwise, focus on fixing failing tests or adding features.

---

## YOUR MISSION

Implement **Phase 4: AST Transformer** - Transform PSR AST nodes to TypeScript AST nodes.

**Goal:** Convert `component Counter() { ... }` → `export const Counter = (): HTMLElement => { ... }`

---

## CONTEXT: Pipeline Status

| Phase                | Status                    | Your Task         |
| -------------------- | ------------------------- | ----------------- |
| 1. Lexer             | ✅ DONE                   | Use it            |
| 2. Parser            | ✅ DONE                   | Use it            |
| 3. Semantic Analyzer | ✅ DONE                   | Use it (optional) |
| 4. Transformer       | ⏳ **YOU IMPLEMENT THIS** | **DO THIS**       |
| 5. Code Generator    | ✅ DONE                   | Integrate with it |

---

## WHAT ALREADY WORKS

### Code Generator (Phase 5)

- ✅ JSX → `t_element()` transformation
- ✅ Wraps body in `$REGISTRY.execute()`
- ✅ Generates clean TypeScript output
- ✅ 100% tests passing

**Location:** `src/code-generator/`

### Parser (Phase 2)

- ✅ Creates correct AST structure
- ✅ ComponentDeclaration nodes
- ✅ InterfaceDeclaration nodes
- ✅ All TypeScript types
- ✅ 93% tests passing

**Location:** `src/parser/`

### Semantic Analyzer (Phase 3)

- ✅ Symbol tables
- ✅ Scope tracking
- ✅ Error detection
- ✅ 77% tests passing (100% functional)

**Location:** `src/semantic-analyzer/`

---

## WHAT YOU NEED TO BUILD

### Transformer Architecture

```
transformer/
├── transformer.ts (ITransformer interface + constructor)
├── transformer.types.ts (TransformContext, etc.)
├── index.ts (registration + exports)
└── prototypes/
    ├── transform.ts (main entry point)
    ├── transform-program.ts
    ├── transform-component.ts **← CRITICAL**
    ├── transform-interface.ts
    ├── transform-variable.ts
    ├── transform-function.ts
    ├── transform-expression.ts
    ├── transform-statement.ts
    ├── transform-jsx.ts (delegate to code generator)
    └── add-imports.ts **← CRITICAL**
```

---

## KEY TRANSFORMATIONS

### 1. ComponentDeclaration → VariableDeclaration

**INPUT (PSR):**

```typescript
component Counter() {
  const [count, setCount] = createSignal(0);
  return <button>{count()}</button>;
}
```

**OUTPUT (TypeScript AST):**

```typescript
{
  type: 'VariableDeclaration',
  kind: 'const',
  declarations: [{
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'Counter' },
    init: {
      type: 'ArrowFunctionExpression',
      params: [],
      returnType: { type: 'TSTypeAnnotation', typeAnnotation: { type: 'TSTypeReference', typeName: 'HTMLElement' }},
      body: {
        type: 'BlockStatement',
        body: [
          // Return statement with $REGISTRY.execute
          {
            type: 'ReturnStatement',
            argument: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: '$REGISTRY' },
                property: { type: 'Identifier', name: 'execute' }
              },
              arguments: [
                { type: 'StringLiteral', value: 'component:Counter' },
                {
                  type: 'ArrowFunctionExpression',
                  body: {
                    // Original component body here
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }],
  exported: true // Add export
}
```

### 2. Add Framework Imports

**ALWAYS add these imports at the top:**

```typescript
import { createSignal, useEffect } from '@pulsar-framework/pulsar.dev';
import { t_element, $REGISTRY } from '@pulsar-framework/pulsar.dev';
```

**Strategy:**

- Scan AST for used functions (createSignal, useEffect, etc.)
- Generate only needed imports
- Add to top of Program.body

### 3. Preserve Reactivity Calls

**DO NOT TRANSFORM:**

- `createSignal(0)` → Keep as-is
- `useEffect(() => {})` → Keep as-is
- `count()` calls → Keep as-is
- `setCount(x)` calls → Keep as-is

**These are runtime functions, not compile-time transforms.**

### 4. JSX Transformation

**Already handled by code generator - just pass through.**

Code generator will transform:

```typescript
<button onClick={handler}>{count()}</button>
```

To:

```typescript
t_element('button', { onClick: handler }, [count()]);
```

**Your job:** Just ensure JSX nodes are preserved in AST.

---

## IMPLEMENTATION PLAN

### Step 1: Create Structure (30 mins)

```
transformer/
├── transformer.ts
├── transformer.types.ts
└── prototypes/
    └── transform.ts
```

**transformer.types.ts:**

```typescript
export interface ITransformContext {
  sourceFile: string;
  usedImports: Set<string>;
  errors: ITransformError[];
}

export interface ITransformError {
  type: string;
  message: string;
  node: IASTNode;
}

export interface ITransformResult {
  ast: IProgramNode;
  context: ITransformContext;
}
```

**transformer.ts:**

```typescript
export interface ITransformer {
  new (ast: IProgramNode, context?: Partial<ITransformContext>): ITransformer;

  ast: IProgramNode;
  context: ITransformContext;

  transform(): ITransformResult;
  transformProgram(node: IProgramNode): IProgramNode;
  transformStatement(node: any): any;
  transformComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration;
  // ... etc
}
```

### Step 2: Implement transform-component.ts (2 hours)

This is the **CRITICAL** file.

**Pseudocode:**

```typescript
export function transformComponentDeclaration(node: IComponentDeclaration): IVariableDeclaration {
  // 1. Create VariableDeclarator with component name
  const declarator = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: node.name.name },
    init: {
      type: 'ArrowFunctionExpression',
      params: node.params, // Keep params as-is
      returnType: createHTMLElementType(),
      body: {
        type: 'BlockStatement',
        body: [createRegistryExecuteReturn(node.name.name, node.body)],
      },
    },
  };

  // 2. Wrap in VariableDeclaration
  return {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [declarator],
    exported: true,
  };
}

function createRegistryExecuteReturn(name: string, body: IBlockStatement) {
  return {
    type: 'ReturnStatement',
    argument: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: '$REGISTRY' },
        property: { type: 'Identifier', name: 'execute' },
      },
      arguments: [
        { type: 'StringLiteral', value: `component:${name}` },
        {
          type: 'ArrowFunctionExpression',
          params: [],
          body: body, // Original component body
        },
      ],
    },
  };
}
```

### Step 3: Implement add-imports.ts (1 hour)

**Pseudocode:**

```typescript
export function addImports(program: IProgramNode, context: ITransformContext): void {
  const imports: IImportDeclaration[] = [];

  // Always add runtime imports
  imports.push({
    type: 'ImportDeclaration',
    specifiers: [
      { type: 'ImportSpecifier', imported: 'createSignal', local: 'createSignal' },
      { type: 'ImportSpecifier', imported: 'useEffect', local: 'useEffect' },
    ],
    source: { type: 'StringLiteral', value: '@pulsar-framework/pulsar.dev' },
  });

  imports.push({
    type: 'ImportDeclaration',
    specifiers: [
      { type: 'ImportSpecifier', imported: 't_element', local: 't_element' },
      { type: 'ImportSpecifier', imported: '$REGISTRY', local: '$REGISTRY' },
    ],
    source: { type: 'StringLiteral', value: '@pulsar-framework/pulsar.dev' },
  });

  // Add at top of program
  program.body.unshift(...imports);
}
```

### Step 4: Transform Other Nodes (2 hours)

- `transform-interface.ts` → Pass through unchanged (TypeScript handles it)
- `transform-variable.ts` → Pass through unchanged
- `transform-function.ts` → Pass through unchanged
- `transform-expression.ts` → Pass through unchanged
- `transform-statement.ts` → Delegate to specific transformers

### Step 5: Wire Everything Up (1 hour)

**index.ts:**

```typescript
import { Transformer, TransformerPrototype } from './transformer.js';
import { transform } from './prototypes/transform.js';
import { transformProgram } from './prototypes/transform-program.js';
import { transformComponentDeclaration } from './prototypes/transform-component.js';
// ... import all prototypes

// Register all methods
TransformerPrototype.transform = transform;
TransformerPrototype.transformProgram = transformProgram;
TransformerPrototype.transformComponentDeclaration = transformComponentDeclaration;
// ... register all

export { Transformer };
export type { ITransformer } from './transformer.js';
export * from './transformer.types.js';
```

### Step 6: Update Main Pipeline (30 mins)

**src/index.ts:**

```typescript
import { createTransformer } from './transformer/index.js';

// In pipeline:
// Phase 2: Parser
const ast = parser.parse();

// Phase 3: Semantic Analyzer (optional)
const analyzer = new SemanticAnalyzer(ast);
const analysis = analyzer.analyze();
if (analysis.errors.length > 0) {
  // Handle errors
}

// Phase 4: Transformer ← NEW
const transformer = createTransformer(ast);
const transformedAst = transformer.transform();

// Phase 5: Code Generator
const generator = createCodeGenerator(transformedAst);
const code = generator.generate();
```

### Step 7: Write Tests (2 hours)

**Use golden fixtures:**

```typescript
// __tests__/transformer/transform-component.test.ts
it('should transform Counter component', () => {
  const source = fs.readFileSync('tests/fixtures/real-psr/1-counter/counter.psr', 'utf-8');
  const lexer = createLexer(source);
  const tokens = lexer.scanTokens();
  const parser = createParser(tokens);
  const ast = parser.parse();

  const transformer = new Transformer(ast);
  const result = transformer.transform();

  // Check structure
  expect(result.ast.body[0].type).toBe('ImportDeclaration');
  expect(result.ast.body[2].type).toBe('VariableDeclaration');
  expect(result.ast.body[2].declarations[0].id.name).toBe('Counter');
  expect(result.ast.body[2].exported).toBe(true);
});

it('should add framework imports', () => {
  // Test import generation
});

it('should wrap in $REGISTRY.execute', () => {
  // Test registry wrapping
});
```

---

## CRITICAL RULES

### From ai-collaboration-rules.json

1. **NO STUBS** - Zero tolerance. Every function must be complete.
2. **NO ES6 CLASSES** - Use prototype pattern like semantic-analyzer.
3. **NO `any` TYPES** - Proper interfaces required.
4. **ONE PER FILE** - One function per file in prototypes/.
5. **RESEARCH FIRST** - If stuck, look at Babel/SWC/Solid transformer implementations.

### Architectural Patterns

**Follow semantic-analyzer pattern EXACTLY:**

- Main class in `transformer.ts`
- Types in `transformer.types.ts`
- One function per file in `prototypes/`
- Registration in `index.ts`
- Tests in `__tests__/transformer/`

### What NOT To Do

❌ Don't transform reactivity calls (createSignal, useEffect)  
❌ Don't reimplement JSX transformation (use code generator)  
❌ Don't create semantic analysis (already done)  
❌ Don't fix parser issues (not your job)  
❌ Don't optimize prematurely (get it working first)

### What TO Do

✅ Transform ComponentDeclaration → const export  
✅ Add framework imports  
✅ Wrap in $REGISTRY.execute  
✅ Preserve reactivity calls unchanged  
✅ Pass JSX through to code generator  
✅ Follow prototype pattern  
✅ One function per file  
✅ Write complete tests

---

## SUCCESS CRITERIA

Before claiming done, verify:

- [ ] Transformer transforms all 3 golden fixtures (Counter, Badge, Drawer)
- [ ] Output compiles to valid TypeScript
- [ ] Framework imports are added
- [ ] Components are exported as const
- [ ] $REGISTRY.execute wrapping works
- [ ] Reactivity calls preserved
- [ ] Follows prototype pattern
- [ ] No ES6 classes
- [ ] No `any` types
- [ ] One function per file
- [ ] No stubs or TODOs
- [ ] All tests pass
- [ ] Integration test with full pipeline works

---

## FILES TO READ FIRST

**Essential:**

1. `docs/NEXT-AGENT-PROMPT.md` - Your instructions
2. `docs/sessions/2026-02-10-semantic-analyzer-session-summary.md` - This session
3. `src/semantic-analyzer/` - Reference implementation pattern
4. `src/code-generator/` - See what's already done

**Helpful:** 5. `src/parser/parser.types.ts` - AST node types 6. `tests/fixtures/real-psr/` - Golden test files 7. `docs/learnings/2026-02-10-typescript-type-system-implementation.md` - Parser details

---

## WHEN YOU'RE STUCK

### Research Strategy (From ai-collaboration-rules.json)

1. **Use your knowledge** - Try implementing based on AST transformation principles
2. **Search learnings/** - Check existing documentation
3. **Research online** - Look at Babel/SWC/Solid transformer implementations
4. **STOP and ask user** - If still stuck after research

### Key Resources

- Babel transformer: https://github.com/babel/babel
- SWC transformer: https://github.com/swc-project/swc
- Solid compiler: https://github.com/solidjs/solid
- TypeScript compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

---

## ESTIMATED TIMELINE

| Task                   | Time    | Cumulative |
| ---------------------- | ------- | ---------- |
| Create structure       | 30 min  | 30 min     |
| transform-component.ts | 2 hours | 2.5 hours  |
| add-imports.ts         | 1 hour  | 3.5 hours  |
| Other transforms       | 2 hours | 5.5 hours  |
| Wire up                | 1 hour  | 6.5 hours  |
| Write tests            | 2 hours | 8.5 hours  |
| Debug & fix            | 2 hours | 10.5 hours |
| Documentation          | 1 hour  | 11.5 hours |

**Total: ~12 hours (1.5-2 days)**

---

## COMMUNICATION STYLE

From ai-collaboration-rules.json:

- Be direct, minimal, binary
- No politeness fluff
- No optimistic speculation
- Use only ✅ and ❌ emojis
- Report: "Step X/Y complete"

**Good:**

- "transform-component.ts complete ✅"
- "Tests passing: 8/10 ✅, 2 failing ❌"
- "Need to research Babel transformer approach"

**Bad:**

- "I think this should work..."
- "Probably just need to..."
- "Let me try this and we'll see..."

---

## FINAL CHECKLIST

Before marking transformer as DONE:

- [ ] Run `pnpm test transformer` - all pass
- [ ] Run `pnpm test` - no regressions
- [ ] Transform Counter.psr - works
- [ ] Transform Badge.psr - works
- [ ] Transform Drawer.psr - works
- [ ] Full pipeline test - works
- [ ] No `any` types
- [ ] No ES6 classes
- [ ] No stubs
- [ ] Documentation written
- [ ] Learnings documented
- [ ] Next agent prompt updated

---

## AFTER YOU'RE DONE

Create these files:

1. **docs/learnings/2026-02-XX-ast-transformer-implementation.md**
   - What you built
   - How it works
   - Test results
   - Known issues

2. **docs/sessions/2026-02-XX-transformer-session-summary.md**
   - Session summary
   - Statistics
   - Next steps

3. **Update docs/NEXT-AGENT-PROMPT.md**
   - Mark Phase 4 as DONE
   - Add Phase 5 integration instructions

---

## GOOD LUCK

You're implementing the **most critical phase** of the entire pipeline.

This transforms PSR code into executable TypeScript.

**Take your time. Get it right. No shortcuts.**

✅ Follow prototype pattern  
✅ One function per file  
✅ No stubs  
✅ Research when stuck

**You got this.**
