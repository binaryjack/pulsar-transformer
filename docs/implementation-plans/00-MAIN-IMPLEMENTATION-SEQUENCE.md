# Main Implementation Sequence - Synetics Transformer Features

**Date:** 2026-02-11 (Updated post-validation)  
**Purpose:** Sequential implementation roadmap for PSR transformer features  
**Status:** ✅ VALIDATED - Corrected scope (14 features, 6-8 weeks)

---

## ⚠️ VALIDATION UPDATE (2026-02-11)

**CRITICAL CORRECTION APPLIED:**

Original plan had **36 features** with **19-week timeline**.

**Validation finding:** 61% of plans (22/36) were misconceived—they confused runtime features (already in `@synetics/synetics.dev`) with transformer features.

**Actions taken:**

- ✅ Archived 22 invalid plans → `archive-misconceived-runtime-features/`
- ✅ Created scope definition → `PSR-TRANSFORMER-SCOPE.md`
- ✅ Rewrote 3 partially valid plans (Show, For, Dynamic)
- ✅ Updated this file with corrected scope

**Corrected scope:** 14 valid features, 6-8 weeks timeline

**See:** [VALIDATION-REPORT-2026-02-11.md](VALIDATION-REPORT-2026-02-11.md) for full analysis

---

## 🏗️ Synetics framework Architecture Analysis

### Current Implementation Status

**Synetics Transformer Pipeline (3-Phase Monolithic):**

```
PSR Source Code
    ↓
[1] LEXER → Tokens (TypeScript/JSX)
    ├── Location: src/lexer/
    ├── Status: ✅ Complete (100% tests passing)
    └── Capabilities: Standard tokens + JSX + Custom keywords
    ↓
[2] PARSER → AST (Abstract Syntax Tree)
    ├── Location: src/parser/
    ├── Status: ✅ Complete (100% tests passing)
    └── Capabilities: Recursive descent + Pratt parser
    ↓
[3] CODE GENERATOR → JavaScript (Transform + Emit)
    ├── Location: src/code-generator/
    ├── Status: ⚠️ Partial - Does BOTH transformation & emission
    └── Issue: Monolithic - should be split into Transform + Emit
```

**Debug Infrastructure:**

```
Debug System
├── Logger (src/debug/logger.ts)
│   ├── Channel-based logging (lexer, parser, codegen, pipeline, jsx, transform)
│   ├── Log levels (error, warn, info, debug, trace)
│   └── Performance tracking with timers
│
└── Tracer (src/debug/tracer/)
    ├── TracerManager - Singleton managing all channels
    ├── ChannelTracer - Per-channel tracing with ring buffers
    ├── Decorators - @traced for functions, tracedLoop for iterations
    ├── HTTP Target - Optional remote trace reporting
    └── Env Config - PULSAR_TRACE, PULSAR_TRACE_CHANNELS, PULSAR_TRACE_WINDOW
```

**Key Patterns:**

1. **Prototype-based Classes** - All constructors use prototype pattern (NO `class` keyword)
2. **Single Responsibility** - One feature per file (enforced by project rules)
3. **Visitor Pattern** - AST traversal uses visitor pattern
4. **Registry Pattern** - Component execution via $REGISTRY.execute()
5. **Factory Functions** - createLexer(), createParser(), createPipeline()

---

## 📊 Valid Features - Corrected Sequencing

### Phase 1: Foundation (Weeks 1-3)

**Core PSR syntax transformation - must be implemented first**

**1. Template Literals** (template-literals)

- **Priority:** 🔴 Critical
- **Dependencies:** None
- **Transformer Role:** Transform `${}` expressions to string concatenation
- **Runtime Role:** None (native JavaScript feature)
- **Estimated Time:** 2-3 days

**2. Complex JSX Expressions** (complex-jsx-expressions)

- **Priority:** 🔴 Critical
- **Dependencies:** Template Literals
- **Transformer Role:** Parse ternary, logical operators, complex expressions in JSX
- **Runtime Role:** None (standard JSX)
- **Estimated Time:** 3-4 days

**3. Generic Type Arguments** (generic-type-arguments)

- **Priority:** 🔴 Critical
- **Dependencies:** None
- **Transformer Role:** Preserve TypeScript generics during transformation
- **Runtime Role:** None (TypeScript feature)
- **Estimated Time:** 4-5 days

**4. Type Inference System** (type-inference-system)

- **Priority:** 🔴 Critical
- **Dependencies:** Generic Type Arguments
- **Transformer Role:** Infer types from PSR syntax (JSX, signals, components)
- **Runtime Role:** None (compile-time only)
- **Estimated Time:** 5-7 days

---

### Phase 2: Runtime Component JSX (Weeks 4-5)

**Verify runtime components transform correctly as normal JSX (no special handling)**

**5. Show Components** (show-components) ⚠️ REWRITTEN

- **Priority:** 🟠 High
- **Dependencies:** Complex JSX Expressions
- **Transformer Role:** Transform `<Show>` as normal JSX → `t_element('Show', ...)`
- **Runtime Role:** `<Show>` component from `@synetics/synetics.dev` (already exists)
- **Note:** No special transformation—just verify JSX handling works
- **Estimated Time:** 1-2 days

**6. For Iteration** (for-iteration) ⚠️ REWRITTEN

- **Priority:** 🟠 High
- **Dependencies:** Show Components
- **Transformer Role:** Transform `<For>` as normal JSX, handle callback with JSX children
- **Runtime Role:** `<For>` component from `@synetics/synetics.dev` (already exists)
- **Note:** Only concern is transforming JSX inside render callback
- **Estimated Time:** 1-2 days

**7. Dynamic Components** (dynamic-components) ⚠️ REWRITTEN

- **Priority:** 🟠 High
- **Dependencies:** Show Components, For Iteration
- **Transformer Role:** Transform `<Dynamic>` as normal JSX, handle spread props
- **Runtime Role:** `<Dynamic>` component from `@synetics/synetics.dev` (if exists)
- **Note:** No special transformation—standard JSX + spread handling
- **Estimated Time:** 1-2 days

---

### Phase 3: Performance & SSR (Weeks 6-8)

**Optimization and server-side rendering support**

**8. Batch Updates** (batch-updates)

- **Priority:** 🟡 Medium
- **Dependencies:** None
- **Transformer Role:** Parse `batch()` calls as normal function calls, auto-import
- **Runtime Role:** `batch()` from `@synetics/synetics.dev` (already exists)
- **Note:** Minimal transformation—just ensure parsing works
- **Estimated Time:** 1 day

**9. Untrack Execution** (untrack-execution)

- **Priority:** 🟡 Medium
- **Dependencies:** None
- **Transformer Role:** Parse `untrack()` calls as normal function calls, auto-import
- **Runtime Role:** `untrack()` from `@synetics/synetics.dev` (already exists)
- **Note:** Minimal transformation—just ensure parsing works
- **Estimated Time:** 1 day

**10. Defer Computation** (defer-computation)

- **Priority:** 🟢 Low
- **Dependencies:** None
- **Transformer Role:** Parse `defer()` calls as normal function calls, auto-import
- **Runtime Role:** `defer()` from `@synetics/synetics.dev` (if exists)
- **Note:** Minimal transformation—just ensure parsing works
- **Estimated Time:** 1 day

**11. Static/Dynamic Optimization** (static-dynamic-optimization)

- **Priority:** 🟢 Low
- **Dependencies:** None
- **Transformer Role:** Detect static JSX at compile-time, emit optimized code
- **Runtime Role:** Use `t_element_static()` for static content (if exists)
- **Note:** Compile-time analysis to avoid reactive overhead for static JSX
- **Estimated Time:** 3-4 days

**12. Client-Server Detection** (client-server-detection)

- **Priority:** 🟡 Medium
- **Dependencies:** None
- **Transformer Role:** Parse `'use client'`/`'use server'` directives, annotate output
- **Runtime Role:** Framework/bundler uses annotations for code splitting
- **Note:** Parse directives and emit metadata for bundler
- **Estimated Time:** 1-2 days

**13. Server-Side Rendering** (server-side-rendering)

- **Priority:** 🟡 Medium
- **Dependencies:** Client-Server Detection
- **Transformer Role:** Emit SSR-compatible JavaScript, handle hydration
- **Runtime Role:** SSR runtime in `@synetics/synetics.dev` (if exists)
- **Note:** Ensure transformed code works in Node.js environment
- **Estimated Time:** 4-5 days

**14. Hydration Markers** (hydration-markers)

- **Priority:** 🟡 Medium
- **Dependencies:** Server-Side Rendering
- **Transformer Role:** Insert comment/attribute markers during JSX transformation
- **Runtime Role:** Runtime uses markers for hydration coordination
- **Note:** Emit markers that runtime can detect for hydration
- **Estimated Time:** 3 days

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Duration:** 3 weeks  
**Features:** 1-4 (Template Literals, JSX, Generics, Type Inference)  
**Goal:** Core syntax support  
**Validation:** All basic PSR syntax transforms correctly

### Phase 2: Reactive Core (Weeks 4-6)

**Duration:** 3 weeks  
**Features:** 5-8 (Show, For, Dynamic, Suspense)  
**Goal:** Core control flow  
**Validation:** Conditional rendering and lists work

### Phase 3: Resources (Weeks 7-9)

**Duration:** 3 weeks  
**Features:** 9-16 (All resource patterns)  
**Goal:** Async data management  
**Validation:** Data fetching patterns functional

### Phase 4: Resilience (Weeks 10-11)

**Duration:** 2 weeks  
**Features:** 17-20 (Error boundaries)  
**Goal:** Error handling  
**Validation:** Errors caught and recovered

### Phase 5: Performance (Weeks 12-14)

**Duration:** 3 weeks  
**Features:** 21-24, 33-36 (Lazy loading, optimizations)  
**Goal:** Code splitting and optimization  
**Validation:** Bundle size optimized

### Phase 6: Composition (Weeks 15-17)

**Duration:** 3 weeks  
**Features:** 25-32 (Portals, Context)  
**Goal:** Advanced composition  
**Validation:** Portal and context patterns work

### Phase 7: SSR (Weeks 18-19)

**Duration:** 2 weeks  
**Features:** 37-39 (SSR, Hydration)  
**Goal:** Server rendering  
**Validation:** SSR produces correct HTML

---

## 🔍 Debug Tracking Requirements

### For Each Implementation

Every feature implementation MUST include:

#### 1. **Tracer Integration**

```typescript
import { traced, tracedLoop } from '../debug/tracer/index.js';

// Wrap all transformation functions
export const transformTemplateString = traced(
  'transformer',
  function (node: ASTNode) {
    // Implementation
  },
  {
    extractPertinent: (args, result) => ({
      nodeType: args[0].type,
      hasExpressions: result.expressions.length > 0,
    }),
  }
);

// Wrap loops that process AST nodes
export function processExpressions(expressions: Expression[]) {
  return tracedLoop(
    'transformer',
    expressions,
    (expr, i) => {
      // Process each expression
    },
    {
      extractPertinent: (expr) => ({
        type: expr.type,
        position: expr.location,
      }),
    }
  );
}
```

#### 2. **Logger Integration**

```typescript
import { createLogger } from '../debug/logger.js';

const logger = createLogger({
  enabled: context.debug,
  level: 'debug',
  channels: ['transform'],
});

export function transformFeature(node: ASTNode) {
  logger.debug('transform', `Transforming ${node.type}`);
  logger.time('transform-feature');

  try {
    const result = performTransformation(node);
    logger.info('transform', `✅ Transformed successfully`, {
      inputType: node.type,
      outputType: result.type,
    });
    return result;
  } catch (error) {
    logger.error('transform', `❌ Transform failed`, error);
    throw error;
  } finally {
    logger.timeEnd('transform-feature');
  }
}
```

#### 3. **Diagnostic Collection**

```typescript
export interface ITransformDiagnostic {
  phase: 'parse' | 'analyze' | 'transform' | 'emit';
  type: 'error' | 'warning' | 'info';
  message: string;
  code: string; // e.g., 'PSR-T001'
  location: {
    file: string;
    line: number;
    column: number;
  };
  suggestions?: string[];
}

// Collect diagnostics during transformation
context.diagnostics.push({
  phase: 'transform',
  type: 'warning',
  message: 'Template literal contains untracked expression',
  code: 'PSR-T001',
  location: getLocation(node),
  suggestions: ['Wrap in createMemo()', 'Use tracked context'],
});
```

#### 4. **Transformation Steps**

```typescript
export interface ITransformStep {
  id: string;
  phase: 'detect' | 'classify' | 'generate' | 'wrap';
  timestamp: number;
  duration: number;
  input: {
    nodeType: string;
    code: string;
    location: { line: number; column: number };
  };
  output: {
    nodeType: string;
    code: string;
  };
  metadata: {
    reactive: boolean;
    dependencies: string[];
    generated: string[];
  };
}

// Track each transformation step
function trackTransformStep(step: Omit<ITransformStep, 'id' | 'timestamp'>) {
  const fullStep = {
    ...step,
    id: generateStepId(),
    timestamp: Date.now(),
  };

  context.steps.push(fullStep);

  if (context.debug) {
    logger.trace('transform', `Step ${fullStep.id}`, fullStep);
  }
}
```

#### 5. **Test Coverage Tracking**

Each feature must have:

- **Unit Tests:** Test isolated transformation logic
- **Integration Tests:** Test within full pipeline
- **E2E Tests:** Test in actual PSR files
- **Snapshot Tests:** Verify transformation output

```typescript
// Example test structure
describe('Template Literals Transformation', () => {
  describe('Unit Tests', () => {
    it('transforms simple template literal', () => {});
    it('handles nested expressions', () => {});
    it('escapes special characters', () => {});
  });

  describe('Integration Tests', () => {
    it('integrates with lexer', () => {});
    it('integrates with parser', () => {});
    it('produces valid code', () => {});
  });

  describe('E2E Tests', () => {
    it('transforms real PSR file', () => {});
    it('handles edge cases' (Corrected)

### Phase 1: Foundation (Weeks 1-3)

**Duration:** 3 weeks
**Features:** 1-4 (Template Literals, Complex JSX, Generics, Type Inference)
**Goal:** Core PSR syntax transformation
**Validation:** All basic PSR syntax transforms correctly
**Success Criteria:**
- ✅ Template literals with `${}` transform to concatenation
- ✅ Complex JSX expressions (ternary, logical, etc.) parse correctly
- ✅ TypeScript generics preserved in output
- ✅ Type inference works for PSR constructs

### Phase 2: Runtime Component JSX (Weeks 4-5)

**Duration:** 1-2 weeks
**Features:** 5-7 (Show, For, Dynamic - runtime components)
**Goal:** Verify JSX transformation handles runtime components
**Validation:** Runtime components transform as normal JSX
**Success Criteria:**
- ✅ `<Show>` transforms to `t_element('Show', ...)` correctly
- ✅ `<For>` with render callback transforms correctly (JSX in callback works)
- ✅ `<Dynamic>` with spread props transforms correctly
- ✅ Auto-imports work for these components
- ✅ **Confirmed:** No special transformation logic needed

### Phase 3: Performance & SSR (Weeks 6-8)

**Duration:** 3 weeks
**Features:** 8-14 (batch/untrack/defer, optimization, SSR, hydration)
**Goal:** Compile-time optimizations and server rendering
**Validation:** Optimized output and SSR support
**Success Criteria:**
- ✅ `batch()`, `untrack()`, `defer()` parse as normal function calls
- ✅ Static JSX detected at compile-time
- ✅ `'use client'`/`'use server'` directives parsed
- ✅ SSR-compatible JavaScript emitted
- ✅ Hydration markers inserted correctlyk)
- [ ] Memory leaks checked (profiling)
- [ ] Bundle size acceptable
- [ ] Transform time acceptable (<100ms per file)

---

## 🚨 Critical Rules

1. **NEVER skip debug tracking** - All transformations must be traceable
2. **NEVER mix responsibilities** - Keep transform and emit separate
3. **NEVER use `any` types** - Proper type safety always
4. **ALWAYS write tests first** - TDD approach
5. **ALWAYS update docs** - Keep documentation in sync
6. **ALWAYS run supervisor** - Final validation step
7. **ALWAYS follow sequence** - Don't skip dependencies

---

## 📝 Workflow

For each feature implementation:

1. **Read** implementation plan
2. **Read** ai-collaboration-rules.json
3. **Read** supervisor plan
4. **Implement** feature with debug tracking
8. **NEVER implement runtime features** - Transformer transforms syntax, runtime provides features
9. **ALWAYS check PSR-TRANSFORMER-SCOPE.md** - Verify feature is transformer concern, not runtime
5. **Test** with unit/integration/e2e tests
6. **Document** changes
7. **Run** supervisor validation
8. ❌ Archived Plans (Runtime Features - Not Transformer Work)

**22 plans archived** to `archive-misconceived-runtime-features/`:

- **waiting-suspense** - `<Suspense>` is runtime component
- **create-resource** + 7 resource plans - `createResource()` is runtime function
- **tryer-error-boundaries** + 3 error plans - `<Tryer>`/`<Catcher>` are runtime components
- **lazy-dynamic-imports** + 3 lazy plans - `lazy()` is runtime function, code splitting is bundler feature
- **portal-transformation** + 3 portal plans - `<Portal>` is runtime component
- **create-context-providers** + 3 context plans - `createContext()`/`useContext()` are runtime functions

**Why archived:** These are features already implemented in `@synetics/synetics.dev`. The transformer's job is NOT to implement them—it's to parse PSR syntax and transform to JavaScript.

**See:** [PSR-TRANSFORMER-SCOPE.md](../PSR-TRANSFORMER-SCOPE.md) for clear boundary definition.

---

## 📝 Workflow

For each feature implementation:

1. **Read** implementation plan (or rewritten plan for Show/For/Dynamic)
2. **Read** ai-collaboration-rules.json
3. **Read** PSR-TRANSFORMER-SCOPE.md (understand transformer vs runtime boundary)
4. **Implement** feature with debug tracking
5. **Test** with unit/integration/e2e tests
6. **Verify** against runtime (ensure transformed output works with `@synetics/synetics.dev`)
7. **Document** changes
8. **Run** supervisor validation
9. **Commit** when supervisor passes

---

## 📊 Progress Tracking (Corrected)

## 🔗 Related Documentation

- **Scope Definition:** [PSR-TRANSFORMER-SCOPE.md](../PSR-TRANSFORMER-SCOPE.md) - Transformer vs runtime boundary
- **Validation Report:** [VALIDATION-REPORT-2026-02-11.md](VALIDATION-REPORT-2026-02-11.md) - Full validation analysis
- **Corrected Summary:** [00-CORRECTED-IMPLEMENTATION-SUMMARY.md](00-CORRECTED-IMPLEMENTATION-SUMMARY.md) - Post-validation summary
- **Archived Plans:** [archive-misconceived-runtime-features/](archive-misconceived-runtime-features/) - Invalid plans
- **Rewritten Plans:**
  - [show-components/2026-02-11-REWRITTEN-show-components.md](show-components/2026-02-11-REWRITTEN-show-components.md)
  - [for-iteration/2026-02-11-REWRITTEN-for-iteration.md](for-iteration/2026-02-11-REWRITTEN-for-iteration.md)
  - [dynamic-components/2026-02-11-REWRITTEN-dynamic-components.md](dynamic-components/2026-02-11-REWRITTEN-dynamic-components.md)

---

**Created:** 2026-02-11
**Last Updated:** 2026-02-11 (Post-validation correction)
**Next Review:** After Phase 1 completion
**Maintainer:** Tadeo Piana
**Status:** ✅ Validated and corrected (14 features, 6-8 weeks)ot Started | -          | -        | 3 weeks  |
| Phase 2 | 5-7      | ⚪ Pending     | -          | -        | 1-2 weeks|
| Phase 3 | 8-14     | ⚪ Pending     | -          | -        | 3 weeks  |

**Total:** 6-8 weeks (1.5-2 months)

**Time saved vs original plan:** 10-12 weeksmpletion
**Maintainer:** Tadeo Piana
```
