# PSR Transformer Learning Index

**Comprehensive transformation patterns from major frameworks**

---

## 📚 Learning Documents

### Core Compilation Phases

1. **[Lexer & Tokenization Patterns](./01-lexer-tokenization-patterns.md)**
   - Token types and lexer architecture
   - JSX tokenization state machines
   - Template literal handling
   - Position tracking for source maps
   - Performance optimizations (SWC-inspired)
   - **Frameworks:** TypeScript, Babel, SWC, Solid.js

2. **[Parser & AST Construction](./02-parser-ast-construction.md)**
   - Recursive descent parsing
   - Pratt parsing (operator precedence)
   - JSX element parsing
   - Error recovery strategies
   - AST node types (standard + PSR)
   - **Frameworks:** TypeScript, Babel, Svelte, Vue

3. **[Reactivity Transformation Patterns](./03-reactivity-transformation-patterns.md)**
   - Signal detection & transformation
   - Dependency graph construction
   - Effect/computed transformation
   - Static vs dynamic optimization
   - Event handler transformation
   - **Frameworks:** Solid.js, Vue 3, Svelte, React, Angular Signals

---

## 🔜 Coming Soon

4. **JSX to Runtime Call Transformation**
   - Element creation (`<div>` → `t_element('div')`)
   - Attribute handling (static vs dynamic)
   - Children transformation
   - Fragment handling
   - Component vs element detection
   - **Frameworks:** React, Solid.js, Vue JSX

5. **Code Generation & Emitters**
   - AST to TypeScript code
   - Indentation & formatting
   - Comment preservation
   - Code optimization
   - **Frameworks:** TypeScript, Babel

6. **Import Management**
   - Auto-import detection
   - Import deduplication
   - Import organization
   - Named vs default imports
   - **Frameworks:** TypeScript, Babel

7. **Source Maps Generation**
   - Position mapping (original → generated)
   - Inline vs external maps
   - Debug information preservation
   - **Tools:** TypeScript, Babel, source-map library

8. **HMR (Hot Module Replacement)**
   - Module update detection
   - State preservation
   - Component reloading
   - Registry pattern integration
   - **Tools:** Vite, Webpack, Solid.js

9. **Error Handling & Recovery**
   - Error reporting
   - Partial AST construction
   - Synchronization points
   - Helpful error messages
   - **Frameworks:** TypeScript, Babel

10. **Optimization Techniques**
    - Constant folding
    - Dead code elimination
    - Static hoisting
    - Minification preparation
    - **Frameworks:** SWC, Babel, Terser

---

## 🎯 Quick Reference by Framework

### Solid.js

- **Reactivity Model:** Fine-grained signals with getter/setter functions
- **JSX Transformation:** Direct to DOM calls, no VDOM
- **Key Patterns:**
  - `signal()` → `createSignal()`
  - `<div>{count()}</div>` → `t_element('div', null, [() => count()])`
  - Event delegation for performance
  - Static vs dynamic JSX detection
- **Files:** `learnings/03-reactivity-transformation-patterns.md`

### Vue 3

- **Reactivity Model:** Proxy-based with ref/reactive
- **Template Compilation:** String templates → render functions
- **Key Patterns:**
  - `ref(0)` → tracked via Proxy
  - `.value` access for refs
  - `computed()` for derived state
  - Directive transformation (`v-if`, `v-for`, `v-bind`)
- **Files:** `learnings/03-reactivity-transformation-patterns.md`

### Svelte

- **Reactivity Model:** Compile-time analysis + $$invalidate injections
- **Template Compilation:** <template> → imperative DOM updates
- **Key Patterns:**
  - `let x = 0` → reactive variable (compiler-detected)
  - `$: doubled = x * 2` → reactive declaration
  - Directives: `bind:`, `on:`, `use:`
  - Store auto-subscription with `$`
- **Files:** `learnings/02-parser-ast-construction.md`, `learnings/03-reactivity-transformation-patterns.md`

### React

- **Reactivity Model:** Virtual DOM diffing with hooks
- **JSX Transformation:** `createElement` or `jsx()` runtime
- **Key Patterns:**
  - `useState(0)` → state + setter
  - Whole component re-renders on state change
  - `<div>` → `jsx('div')` (new transform)
  - Effect hooks for side effects
- **Files:** N/A (for context only)

### TypeScript

- **Compilation:** Types → JavaScript (type erasure)
- **Key Patterns:**
  - Lexer: Character classification arrays
  - Parser: Recursive descent with lookahead
  - Emitter: AST → formatted JS/TS
  - Source maps: Mapping preservation
- **Files:** `learnings/01-lexer-tokenization-patterns.md`, `learnings/02-parser-ast-construction.md`

### Babel

- **Compilation:** JS/JSX → Transformed JS (polyfills, plugins)
- **Key Patterns:**
  - Plugin architecture (visitors)
  - AST transformation pipeline
  - Polyfill injection
  - JSX → React.createElement
- **Files:** `learnings/01-lexer-tokenization-patterns.md`, `learnings/02-parser-ast-construction.md`

### SWC

- **Compilation:** Rust-based, extremely fast
- **Key Patterns:**
  - Character classification for O(1) lookup
  - Minimal allocations
  - Parallel processing
  - Drop-in Babel replacement
- **Files:** `learnings/01-lexer-tokenization-patterns.md`

---

## 🔑 Key Concepts Glossary

**AST (Abstract Syntax Tree)**: Tree representation of source code structure  
**Token**: Smallest unit of meaning (keyword, identifier, operator, etc.)  
**Signal**: Reactive primitive that tracks reads/writes  
**Effect**: Function that re-runs when dependencies change  
**Memo/Computed**: Cached derived value that updates reactively  
**Dependency Tracking**: Recording which signals an effect reads  
**Fine-Grained Reactivity**: Updates only affected DOM nodes (no VDOM)  
**VDOM (Virtual DOM)**: In-memory representation for diffing  
**HMR (Hot Module Replacement)**: Update modules without full reload  
**Source Map**: Mapping between generated and original code  
**Pratt Parsing**: Operator precedence parsing technique  
**Registry Pattern**: Component isolation for HMR support

---

## 🎓 Learning Workflow

### For a New Feature (e.g., "Add Signal Support")

1. **Read relevant learning docs:**
   - `01-lexer-tokenization-patterns.md` → How to tokenize `signal(0)`
   - `02-parser-ast-construction.md` → How to parse into AST
   - `03-reactivity-transformation-patterns.md` → How to transform signal

2. **Study framework examples:**
   - Solid.js: How they handle `createSignal()`
   - Vue: How they handle `ref()`
   - Compare patterns

3. **Extract patterns:**
   - Detection: How to find `signal()` calls in AST
   - Transformation: `signal(0)` → `createSignal(0)`
   - Tracking: Where is signal read? (effects, JSX, etc.)

4. **Implement:**
   - Write detection function
   - Write transformation function
   - Write tests
   - Integrate into pipeline

### For Understanding a Phase

1. **Read phase overview in `architecture.md`**
2. **Read corresponding learning doc**
3. **Check framework references at bottom of learning doc**
4. **Study code examples in learning doc**
5. **See how it connects to next phase**

---

## 📊 Pipeline Integration Chart

```
┌────────────┐
│   LEXER    │ → learnings/01-lexer-tokenization-patterns.md
│  Tokens    │    - Token types, JSX states, position tracking
└────────────┘
      ↓
┌────────────┐
│  PARSER    │ → learnings/02-parser-ast-construction.md
│    AST     │    - Recursive descent, Pratt, JSX parsing, error recovery
└────────────┘
      ↓
┌────────────┐
│  ANALYZER  │ → (Coming: semantic analysis patterns)
│  Symbols   │    - Scope, types, dependencies
└────────────┘
      ↓
┌────────────┐
│ TRANSFORMER│ → learnings/03-reactivity-transformation-patterns.md
│ PSR→TS AST │    - Signal→createSignal, JSX→t_element, effects
└────────────┘
      ↓
┌────────────┐
│  EMITTER   │ → (Coming: code generation patterns)
│TS Code+Map │    - AST→code, imports, formatting, source maps
└────────────┘
```

---

## 🏗️ Implementation Checklist

Use this to track which patterns have been implemented:

### Lexer

- [ ] Basic token types (identifiers, keywords, literals)
- [ ] Operators & punctuation
- [ ] JSX state machine (`<`, `>`, `{}`)
- [ ] Template literals (`backticks with`${}`)
- [ ] Custom PSR keywords (`component`, `signal`)
- [ ] Position tracking (line, column)
- [ ] Error recovery

### Parser

- [ ] Recursive descent base
- [ ] Pratt parsing (operators)
- [ ] JSX element parsing
- [ ] JSX attribute parsing
- [ ] JSX expression containers
- [ ] Component declarations
- [ ] Error recovery & sync points

### Analyzer (Semantic)

- [ ] Scope tracking
- [ ] Signal detection
- [ ] Dependency graph construction
- [ ] Import/export analysis
- [ ] Type checking (optional)

### Transformer

- [ ] `component` → `export function`
- [ ] `signal()` → `createSignal()`
- [ ] JSX → runtime calls
- [ ] Signal usage tracking
- [ ] Effect transformation
- [ ] Static JSX optimization
- [ ] Registry pattern wrapping

### Emitter

- [ ] AST → TypeScript code
- [ ] Import management
- [ ] Format & indent (2 spaces)
- [ ] Source map generation
- [ ] Comment preservation

---

## 🔗 External Resources

**TypeScript Compiler:**

- `packages/typescript/src/compiler/scanner.ts` - Lexer
- `packages/typescript/src/compiler/parser.ts` - Parser
- `packages/typescript/src/compiler/checker.ts` - Type checker

**Babel:**

- `@babel/parser` - Parser
- `@babel/traverse` - AST traversal
- `@babel/generator` - Code generation

**Solid.js:**

- `babel-preset-solid` - JSX transformation
- [Solid.js Reactivity Docs](https://docs.solidjs.com/concepts/intro-to-reactivity)

**Svelte:**

- `svelte/compiler` - Full compiler
- [Svelte Compiler Docs](https://svelte.dev/docs/svelte-compiler)

**Vue:**

- `@vue/compiler-core` - Template compiler
- [Vue Reactivity Docs](https://vuejs.org/guide/extras/reactivity-in-depth.html)

**Vite:**

- [HMR API](https://vite.dev/guide/api-hmr.html)
- Hot module replacement patterns

---

## ✅ Status Summary

**Research Phase:** ✅ Complete  
**Learning Docs Created:** 3/10 (30%)  
**Pipeline Architecture:** ✅ Determined  
**Ready for Implementation:** ✅ Yes

**Next Steps:**

1. Complete remaining learning docs (JSX transformation, code generation, HMR)
2. Begin Phase 1 implementation (Lexer → Parser → Basic Emitter)
3. Implement test suite for each phase
4. Integrate phases into full pipeline

---

**Last Updated:** February 10, 2026  
**Maintained By:** Synetics Transformer Team
