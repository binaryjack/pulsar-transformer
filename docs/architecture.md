# Transformer Architecture

**Complete PSR → TypeScript transformation pipeline**

---

## Overview

The Synetics Transformer converts PSR (Synetics Syntax) source code into optimized TypeScript through a **5-phase pipeline**:

ALWAYS READ `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\synetics-transformer\docs\rules.md`
before starting a session

the previous version that I've totally eleted was polluted by several AI Agents who bullshited me along the way this is unacceptable so from now ON you are not authorized to act without my permission!
or unles I say do it in one go excplicitely

always refesr to this file `C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\synetics-transformer\docs\rules.md`
if you have any doubt about how to work with me!

# Main Goal: Transform PSR Files into Web app that uses Synetics framework with all reactivity wired. As React, Svelte, Vue, Angular, Solid do.

# Use exclusively TypeScript transformation transpiling from PSR TO JS

---

## ✅ RESEARCH COMPLETE - PIPELINE DETERMINED

**Research Date:** February 10, 2026  
**Frameworks Analyzed:** TypeScript, Babel, SWC, Solid.js, Svelte, Vue 3, React  
**Documentation Created:** `docs/learnings/` (3 comprehensive guides)

---

## 🔄 PSR → TypeScript Transformation Pipeline

Based on industry-standard compiler architecture and reactive framework patterns:

```
┌──────────────────────────────────────────────────────────────┐
│                       PSR Source Code                         │
│  component Counter() {                                         │
│    const [count, setCount] = signal(0);                       │
│    return <button onClick={() => setCount(count() + 1)}>      │
│      {count()}                                                │
│    </button>;                                                 │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1: LEXER (Tokenization)                               │
│  ────────────────────────────────                            │
│  Purpose: Convert source text → tokens                        │
│                                                               │
│  Modules Needed:                                              │
│  • Base Lexer: Standard JS/TS tokens                         │
│  • JSX Extension: State machine for JSX (< > { })            │
│  • Template Literal Handler: `${}` expressions               │
│  • Custom Keywords: 'component', 'signal'                    │
│  • Position Tracker: Line/column for source maps             │
│                                                               │
│  Tokens: COMPONENT, IDENTIFIER(Counter), LPAREN, RPAREN,     │
│          LBRACE, CONST, LBRACKET, IDENTIFIER(count), ...     │
│                                                               │
│  Pattern: Character-by-character with lookahead (TypeScript) │
│  Performance: Character classification arrays (SWC)           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 2: PARSER (AST Construction)                          │
│  ─────────────────────────────────                           │
│  Purpose: Build Abstract Syntax Tree from tokens             │
│                                                               │
│  Modules Needed:                                              │
│  • Recursive Descent Parser: Statement/expression parsing    │
│  • Pratt Parser: Operator precedence handling                │
│  • JSX Parser: JSX elements, attributes, children            │
│  • Component Parser: PSR component declarations              │
│  • Type Parser: TypeScript type annotations                  │
│  • Error Recovery: Continue parsing after errors             │
│                                                               │
│  AST Output:                                                  │
│    ComponentDeclaration {                                     │
│      name: "Counter",                                         │
│      body: {                                                  │
│        VariableDeclaration (signal),                          │
│        ReturnStatement (JSXElement)                           │
│      }                                                        │
│    }                                                          │
│                                                               │
│  Pattern: Recursive descent + Pratt (TypeScript, Babel)      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 3: SEMANTIC ANALYZER (Analysis & Validation)          │
│  ──────────────────────────────────────────────────          │
│  Purpose: Validate semantics, build symbol tables, detect    │
│           reactive patterns                                   │
│                                                               │
│  Modules Needed:                                              │
│  • Scope Analyzer: Track variable scopes, shadowing          │
│  • Signal Detector: Find signal() calls, track usage         │
│  • Dependency Tracker: Build dependency graph                │
│  • Import/Export Analyzer: Resolve module dependencies       │
│  • Type Checker: Validate types (optional but recommended)   │
│  • Reactivity Validator: Detect circular dependencies        │
│                                                               │
│  Analysis Output:                                             │
│    - Symbol Table: All identifiers with scopes               │
│    - Signal Map: {getter: 'count', setter: 'setCount'}       │
│    - Dependency Graph: count → [button onClick, textNode]    │
│    - Import Requirements: ['createSignal', 't_element']      │
│                                                               │
│  Pattern: Multi-pass analysis (TypeScript)                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 4: TRANSFORMER (AST-to-AST Transformation)            │
│  ────────────────────────────────────────────────            │
│  Purpose: Transform PSR constructs → TypeScript equivalents   │
│                                                               │
│  Modules Needed:                                              │
│  • Component Transformer:                                     │
│      component Counter() → export function Counter()          │
│      Wrap in $REGISTRY.execute()                              │
│                                                               │
│  • Signal Transformer:                                        │
│      signal(0) → createSignal(0)                              │
│      Track all getter/setter usages                           │
│                                                               │
│  • JSX Transformer (CRITICAL):                                │
│      <button onClick={fn}>{text}</button>                     │
│      → t_element('button', {onClick: fn}, [text])             │
│      Static vs Dynamic optimization                           │
│                                                               │
│  • Reactivity Injector:                                       │
│      Wrap reactive JSX expressions                            │
│      Insert effect tracking where needed                      │
│                                                               │
│  • Event Handler Transformer:                                 │
│      onClick={() => ...} → optimized delegation               │
│                                                               │
│  • Constant Folder: Optimize static expressions              │
│  • Dead Code Eliminator: Remove unused code                  │
│                                                               │
│  Pattern: Visitor pattern (Babel), Solid.js reactive model   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 5: CODE GENERATOR / EMITTER                           │
│  ─────────────────────────────────────                       │
│  Purpose: Generate clean, formatted TypeScript code          │
│                                                               │
│  Modules Needed:                                              │
│  • Import Manager:                                            │
│      Auto-import runtime functions                            │
│      Deduplicate imports                                      │
│      Organize by source                                       │
│                                                               │
│  • Code Emitter:                                              │
│      AST → TypeScript code                                    │
│      Proper indentation (2 spaces)                            │
│      Preserve comments where possible                         │
│                                                               │
│  • Source Map Generator:                                      │
│      Track original → generated positions                     │
│      Inline or separate .map files                            │
│                                                               │
│  • Registry Pattern Injector:                                 │
│      Wrap components in $REGISTRY.execute()                   │
│      Generate unique component IDs                            │
│                                                               │
│  Output:                                                      │
│    import { createSignal, t_element } from '@synetics/runtime';│
│    import { $REGISTRY } from '@synetics/runtime/registry';     │
│                                                               │
│    export function Counter(): HTMLElement {                   │
│      return $REGISTRY.execute('component:Counter', () => {   │
│        const [count, setCount] = createSignal(0);            │
│        return t_element('button', {                           │
│          onClick: () => setCount(count() + 1)                 │
│        }, [count()]);                                         │
│      });                                                      │
│    }                                                          │
│                                                               │
│  Pattern: TypeScript Compiler Emitter, Babel Generator       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                     TypeScript Code (.ts)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Pipeline Justification

**Why This Architecture:**

✅ **Industry Standard**: TypeScript, Babel, SWC all use 5-phase pipeline  
✅ **Clear Separation**: Each phase has single responsibility  
✅ **Testable**: Each phase can be unit tested independently  
✅ **Incremental**: Can optimize one phase without affecting others  
✅ **Reactive Framework Aligned**: Matches Solid.js transformation model  
✅ **HMR Compatible**: Registry pattern enables Hot Module Replacement  
✅ **Debuggable**: Source maps link generated code to original PSR

---

## 📚 Learning Materials Created

1. **`learnings/01-lexer-tokenization-patterns.md`**
   - Token types, lexer patterns, JSX tokenization
   - Template literal handling, position tracking
   - Performance optimizations from SWC

2. **`learnings/02-parser-ast-construction.md`**
   - Recursive descent parsing, Pratt parsing
   - AST node types, JSX parsing
   - Error recovery strategies

3. **`learnings/03-reactivity-transformation-patterns.md`**
   - Signal detection & transformation
   - Dependency tracking, effect transformation
   - Static vs dynamic optimization
   - Patterns from Solid.js, Vue, Svelte

**More to come:** JSX transformation, code generation, HMR, source maps

---

## 🔧 Implementation Priority

**Phase 1 (Foundation):**

1. Basic Lexer (tokens)
2. Basic Parser (AST)
3. Simple Emitter (code generation)

**Phase 2 (PSR Support):**

1. Component parsing
2. Signal detection
3. JSX transformation

**Phase 3 (Reactivity):**

1. Dependency tracking
2. Effect transformation
3. Static optimization

**Phase 4 (Production):**

1. Source maps
2. HMR support
3. Error handling
4. Performance optimization

---

**Status:** ✅ Pipeline architecture determined, ready for implementation
**Next Step:** Begin Phase 1 implementation with detailed sub-tasks
