# 🤖 AGENT HANDOFF: NEXT PHASE - Union Types & Advanced Parsing

**Date:** February 7, 2026  
**Session:** Phase 2 - Post-Core-Parser-Fixes  
**Status:** 28 Core Failures RESOLVED ✅ → New Challenge: Union Types & Integration

---

## 🚨 MANDATORY READING ORDER FOR NEXT AGENT

**READ IN THIS EXACT ORDER - NO EXCEPTIONS:**

### 0. CRITICAL PROJECT RULES (10 minutes) - MANDATORY!

```bash
.github/copilot-instructions.md
```

**🔴 STOP! READ THIS FIRST BEFORE ANY CODE CHANGES!**

### 1. Current Context Files (5 minutes)

```bash
packages/pulsar-transformer/TEST-FAILURES-ANALYSIS.md          # Original 28 failures (RESOLVED)
packages/pulsar-transformer/FRAMEWORK-RESEARCH-FINDINGS.md     # Framework patterns used
```

### 2. Successful Implementations (Study These Patterns!)

```bash
src/parser/prototype/parse-type-alias.ts      # Type whitespace fixes
src/parser/prototype/parse-import-declaration.ts  # Namespace imports
src/parser/prototype/parse-export-declaration.ts  # Export all
src/parser/prototype/parse.ts                 # JSX Fragment detection
src/parser/prototype/parse-expression.ts     # Expression statement wrapping
src/parser/prototype/parse-class-declaration.ts   # Generic parameter handling
src/parser/prototype/parse-interface-declaration.ts  # Generic skipping
```

---

## 🚫 NON-NEGOTIABLE RULES

1. **NO Shortcuts** - Full proper implementation only
2. **NO MVP** - "Let me stub this out..." = REJECTED
3. **NO Bullshit** - "This should work..." without test proof = REJECTED
4. **NO Claiming Success** - Until you see: `✅ Tests X passed (X)` in terminal output
5. **Prototype Pattern ONLY** - NO ES6 classes in implementation files
6. **One Item Per File** - One class/function/interface per file
7. **Test After EVERY Change** - Run tests immediately, don't batch
8. **Framework Research REQUIRED** - Study React/Angular/Vue/Svelte/Solid patterns

---

## 📊 CURRENT STATE ANALYSIS

### ✅ RESOLVED (Previous Agent Success)

- **Type Whitespace Issues (18→11 tests)** - Fixed using framework-based punctuation rules
- **Namespace Import Parsing (3 tests)** - Fixed parsing order (ASTERISK before IDENTIFIER)
- **Export All Parsing (7 tests)** - Confirmed existing logic works
- **JSX Fragment Parsing (13 tests)** - Fixed statement+expression level detection
- **Generic Type Parsing (16 tests)** - Enhanced JSX_TEXT handling in generic skipping

### 🎯 NEW CHALLENGE IDENTIFIED

**Current failing tests from latest run:**

```
❯ src/__tests__/union-types-e2e.test.ts (6)
  × should preserve simple union type through pipeline
  × should preserve nullable union type
  × should preserve multi-way union types
  × should preserve union with generic types
  × should handle union types in component signals
  × should handle complex union with undefined
```

---

## 🎯 YOUR MISSION: 4-STEP UNION TYPE INVESTIGATION

Follow the **EXACT SAME SYSTEMATIC APPROACH** that solved the original 28 failures:

### STEP 1: List All Remaining Failures

- Run full test suite: `npm test`
- Document EVERY failing test with:
  - Test name and file
  - Expected vs actual behavior
  - Error messages
  - Code samples that fail
- Create: `UNION-TYPES-FAILURES-ANALYSIS.md`

### STEP 2: Framework Research - Union Types

Go online and research how major frameworks handle union types:

- **React/Babel:** Union type parsing and transformation
- **TypeScript Compiler:** Union type emission and preservation
- **SWC:** Fast union type processing
- **Angular:** Union type handling in templates
- **Vue:** Union type compilation
- **Svelte:** Union type preservation
- **Solid:** Union type optimization

**Focus Areas:**

- How do they parse `string | number | undefined`?
- How do they preserve union types through transformation pipelines?
- How do they handle generic unions like `Array<T> | null`?
- How do they emit union types in generated code?

### STEP 3: Document Framework Learnings

Create: `UNION-TYPES-FRAMEWORK-RESEARCH.md` with:

- Framework-by-framework analysis
- Code examples from each framework
- Best practices and patterns
- Implementation strategies for our codebase
- Specific fixes needed in analyzer/emitter stages

### STEP 4: Report Completion

Tell me when you have gathered all intel with:

- Summary of failures found
- Key framework insights discovered
- Proposed fix strategy
- Ready for implementation phase

---

## 🔍 INVESTIGATION AREAS

Based on current failures, focus research on:

### Pipeline Integration Issues

- **Analyzer Stage:** How union types are processed in IR generation
- **Transform Stage:** Union type preservation during optimization
- **Emitter Stage:** Union type code generation

### Specific Union Type Patterns

```typescript
// Simple unions
type Status = 'idle' | 'loading' | 'success';

// Nullable unions
type MaybeUser = User | null;

// Multi-way unions
type Value = string | number | boolean | undefined;

// Generic unions
type Result<T> = T | Error;

// Signal unions
const [status, setStatus] = createSignal<'idle' | 'loading'>();
```

---

## 🧠 FRAMEWORK SUCCESS PATTERNS TO STUDY

### From Previous Success (Reference These!)

1. **Babel Pattern:** Token-first parsing with dedicated AST node types
2. **TypeScript Pattern:** Direct punctuation emission with controlled spacing
3. **SWC Pattern:** Fast parsing with minimal allocations
4. **Acorn Pattern:** Robust error handling and recovery

### Apply Same Methodology To Union Types!

- Identify the exact failure points
- Study how major frameworks solve it
- Apply their proven patterns
- Test incrementally

---

## 📁 WORKSPACE STRUCTURE

```
packages/pulsar-transformer/
├── src/
│   ├── analyzer/     # ← Likely needs union type fixes
│   ├── emitter/      # ← Likely needs union type fixes
│   ├── parser/       # ← FIXED ✅ (your foundation)
│   └── transformer/  # ← May need union type fixes
├── TEST-FAILURES-ANALYSIS.md          # ← Original (RESOLVED)
├── FRAMEWORK-RESEARCH-FINDINGS.md     # ← Original (SUCCESS)
├── UNION-TYPES-FAILURES-ANALYSIS.md   # ← YOU CREATE THIS
└── UNION-TYPES-FRAMEWORK-RESEARCH.md  # ← YOU CREATE THIS
```

---

## 🔬 TESTING COMMANDS

```bash
# Full test suite
npm test

# Union types specifically
npm test union-types-e2e

# Watch mode for development
npm run test:watch

# Verify your fixes don't break existing
npm test parse-import-declaration
npm test parse-export-declaration
npm test parse-jsx-fragment
```

---

## 💡 SUCCESS CRITERIA

You'll know you're successful when:

1. **✅ All union-types-e2e.test.ts tests pass**
2. **✅ Pipeline preserves union types correctly**
3. **✅ Generated code maintains union type information**
4. **✅ No regression in previously fixed tests**

---

## 🎯 FINAL REMINDER

The previous agent's **systematic 4-step approach WORKED PERFECTLY**:

- 28 core parsing failures → **ELIMINATED**
- Framework research → **Applied successfully**
- Proper testing → **Verified fixes**
- Documentation → **Knowledge preserved**

**Use the EXACT same methodology for union types!**

Your job is **intelligence gathering** - let the framework research guide the implementation just like before.

---

## 🔥 GET TO WORK!

1. Read `.github/copilot-instructions.md` NOW
2. Run `npm test` and document failures
3. Research framework union type handling
4. Document your findings
5. Report back with intel

**The systematic approach works. Trust the process. Deliver results.** 💪

---

**Previous Agent Status:** ✅ MISSION ACCOMPLISHED - Parser Core Fixed  
**Your Status:** 🎯 MISSION ASSIGNED - Union Types Intelligence  
**Next Agent:** Will implement based on your research
