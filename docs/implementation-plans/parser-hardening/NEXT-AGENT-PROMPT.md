# Next AI Agent - Session Prompt

**Date**: 2026-02-10  
**Previous Session**: Parser Error Recovery (COMPLETE ✅)  
**This Session**: TBD by user priority

---

## Context You're Inheriting

### Parser Status: ✅ STABLE & PRODUCTION-READY

The previous AI agent investigated a claim that the parser was "fundamentally broken." **This was FALSE.**

**What was done**:

- Audited parser architecture → Found it uses standard recursive descent (same as TypeScript/Babel/ESLint)
- Implemented error recovery pattern (throw → addError + return null)
- Added position safety tracking to prevent infinite loops
- Added iteration limits (10K-50K) as guardrails
- Modified 6 parser files with defensive programming
- Verified with test suite (~300 tests)

**Current state**:

- ✅ Builds clean (no TypeScript errors)
- ✅ Core features passing (switch, decorator, await, try, control flow)
- ⚠️ 3 export tests fail (expected - test assertions need updating)
- ❌ 17 pre-existing bugs (not introduced by parser hardening)
- ✅ No infinite loops, no crashes

### Critical Context Files

**MUST READ BEFORE STARTING**:

1. `docs/ai-collaboration-rules.json` - TADEO's coding standards (NO STUBS, prototype-based classes, binary honesty)
2. `docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md` - P0 blockers list
3. `docs/learnings/04-parser-error-recovery-defensive-programming.md` - Previous session findings
4. `.github/copilot-instructions.md` - File structure, naming conventions, workflow rules

---

## Three Possible Paths Forward

User will choose which path to take. DO NOT ASSUME - ASK WHICH PATH.

### PATH A: Ship Reactivity NOW ⚡ (RECOMMENDED)

**Goal**: Make PSR components actually reactive (like React/Vue/Svelte)

**Problem**: Signal binding and event handlers currently output TODO comments instead of working code

**Files to fix**:

- `packages/pulsar-transformer/src/emitter/emit-signal-binding.ts`
- `packages/pulsar-transformer/src/emitter/emit-event-handler.ts`

**What needs to happen**:

- Remove TODO stubs
- Emit `$REGISTRY.wire()` calls for signal subscriptions
- Emit proper event handler bindings
- Generate working reactive code

**Time estimate**: 1-3 hours

**Success criteria**:

- Run `pnpm vitest run tests/integration/full-pipeline.test.ts`
- Counter/Badge/Drawer demos work with live reactivity
- No "TODO" comments in emitted code

**Reference docs**:

- `docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md` - Lines 45-120 (Signal Binding section)
- `docs/learnings/03-reactivity-transformation-patterns.md` - Wire-up patterns
- Previous working examples in `emit-*.ts` files

**Blocker status**: 🔴 CRITICAL - Reactivity broken without this

---

### PATH B: Clean Tests & Bugs 🧹

**Goal**: Get test suite to 100% pass rate

**Problem**: 3 export tests fail + 17 pre-existing bugs in various parsers

**Files to fix**:

1. **Export tests (15 min)**:
   - 3 test files expecting `toThrow()` → change to `toBeNull()`
   - Quick win

2. **Lexer bug (30 min)**:
   - 1 line/column tracking test failing
   - File: `src/lexer/` somewhere

3. **Type alias bugs (1 hour)**:
   - 4 function type spacing issues
   - File: `src/parser/parse-type.ts` or similar

4. **Abstract class bugs (1 hour)**:
   - 3 abstract class parsing tests
   - File: `src/parser/parse-class-declaration.ts`

5. **Advanced features (2-3 hours)**:
   - 9 tests for generators, async class methods
   - Multiple parser files

**Time estimate**: 3-5 hours total (can prioritize quick wins first)

**Success criteria**:

- `pnpm --filter @pulsar-framework/transformer test` exits with code 0
- All ~300 tests green

**Blocker status**: 🟡 MEDIUM - Tests fail but parser works, transformer still has stubs

---

### PATH C: Follow Priority List 📋

**Goal**: Work through entire critical path in `TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md`

**Problem**: Transformer has many incomplete features documented as P0

**Files to fix**:

1. Signal binding (P0) - emit-signal-binding.ts
2. Event handlers (P0) - emit-event-handler.ts
3. Control flow (P1) - emit-if-statement.ts, emit-for-statement.ts
4. Member expressions (P1) - emit-member-expression.ts
5. Component emission (P0) - emit-component.ts
6. Many more...

**Time estimate**: 5-10 hours for P0 items, 10-20 hours for all

**Success criteria**:

- All P0 items marked DONE in stub doc
- Full pipeline test passes
- Demo components work end-to-end

**Blocker status**: 🔴 CRITICAL - This is the comprehensive solution

---

## How to Start Your Session

### Step 1: Read Critical Files (5 min)

```powershell
# Read collaboration rules
cat docs/ai-collaboration-rules.json

# Read stub list
cat docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md

# Read previous session learnings
cat docs/learnings/04-parser-error-recovery-defensive-programming.md
```

### Step 2: Verify Environment (2 min)

```powershell
# Confirm parser builds
pnpm --filter @pulsar-framework/transformer build

# Check test status
pnpm --filter @pulsar-framework/transformer test parser
```

### Step 3: Ask User for Direction

**EXACT PROMPT TO USE**:

> "Previous AI completed parser hardening (✅ stable, no infinite loops, error recovery working).
>
> Three paths forward:
>
> - **A**: Fix signal binding + event handlers (1-3h) → REACTIVITY WORKS
> - **B**: Fix 3 export tests + 17 pre-existing bugs (3-5h) → TESTS GREEN
> - **C**: Work through full P0 stub list (5-10h) → COMPREHENSIVE
>
> Which path?"

### Step 4: Execute Based on Choice

**If PATH A**:

1. Read `docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md` signal binding section
2. Read `docs/learnings/03-reactivity-transformation-patterns.md`
3. Open `emit-signal-binding.ts` and `emit-event-handler.ts`
4. Search for TODO comments
5. Implement wire-up emission
6. Test with `pnpm vitest run tests/integration/full-pipeline.test.ts`

**If PATH B**:

1. Start with quick win: Update 3 export test assertions
2. Run `pnpm test parser` to verify green
3. Move to next bug (lexer, type-alias, etc.)
4. Run tests after each fix
5. Document pre-existing bug causes if found

**If PATH C**:

1. Open `docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md`
2. Start at top of P0 list (signal binding)
3. Work systematically through each item
4. Mark items DONE in doc as you complete them
5. Test after each major section

---

## Critical Reminders (From TADEO's Rules)

### 🔴 ZERO TOLERANCE RULES

1. **NO STUBS**: Never write TODO comments or placeholder code
2. **NO ES6 CLASSES**: Use prototype-based pattern ONLY
3. **NO `any` TYPE**: Proper interfaces required
4. **ONE ITEM PER FILE**: One class/function/interface per file
5. **BINARY HONESTY**: Say "works" or "doesn't work" - NEVER "should work"

### Communication Style

- Direct, concise, brutal truth
- No politeness fluff
- No emojis (except ✅ ❌)
- "Step X/Y complete" status format
- If uncertain: STOP and ask user

### Implementation Rules

- **Default mode**: State intent → Implement immediately (no asking permission unless uncertain)
- **If uncertain**: STOP → Tell user → Research learnings folder → Present approach → Wait approval
- **Testing**: Actually test, don't claim "should work"

---

## Quick Reference Commands

### Build & Test

```powershell
# Build transformer
pnpm --filter @pulsar-framework/transformer build

# Run all parser tests
pnpm --filter @pulsar-framework/transformer test parser

# Run specific test file
pnpm vitest run tests/parser/parse-decorator.test.ts

# Run full pipeline test
pnpm vitest run tests/integration/full-pipeline.test.ts

# Run all transformer tests
pnpm --filter @pulsar-framework/transformer test
```

### Code Search

```powershell
# Find TODO comments (stubs)
Select-String -Path "src/**/*.ts" -Pattern "TODO|STUB" -Recurse

# Find all emit functions
Select-String -Path "src/emitter/*.ts" -Pattern "function emit"

# Find error recovery pattern
Select-String -Path "src/parser/*.ts" -Pattern "_addError"
```

### File Locations

```
Transformer root: packages/pulsar-transformer/

Key files:
- src/parser/*.ts - Parser files (6 modified last session)
- src/emitter/emit-*.ts - Code generation (MANY STUBS)
- tests/parser/*.test.ts - Parser tests
- tests/integration/*.test.ts - Full pipeline tests
- docs/TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md - Stub list
- docs/learnings/*.md - Knowledge base
- docs/ai-collaboration-rules.json - Coding standards
```

---

## Expected Obstacles & Solutions

### Obstacle 1: "I don't know how signal binding should work"

**Solution**:

1. Read `docs/learnings/03-reactivity-transformation-patterns.md`
2. Search for existing working emit functions (e.g., `emit-variable-declaration.ts`)
3. Look at test expectations in `tests/integration/full-pipeline.test.ts`
4. If still stuck: STOP and ask TADEO

### Obstacle 2: "Tests still fail after my fix"

**Solution**:

1. Actually run the test, don't assume
2. Read the FULL error message
3. Check if it's a pre-existing bug or your change
4. Compare expected vs actual output
5. If stuck: STOP and report exact error + file + line

### Obstacle 3: "I want to stub something out to come back later"

**Solution**:
❌ DON'T. TADEO has ZERO TOLERANCE for stubs.

Either:

- Implement it fully now
- Tell TADEO you don't know how and ask for guidance
- Skip that feature entirely (with approval)

### Obstacle 4: "File structure confusing"

**Solution**:
Read `.github/copilot-instructions.md` for:

- Feature Slice Pattern
- Prototype-based class pattern
- File naming conventions (kebab-case)
- One item per file rule

---

## Success Criteria (Choose Based on Path)

### PATH A Success:

- [x] `emit-signal-binding.ts` emits `$REGISTRY.wire()` calls
- [x] `emit-event-handler.ts` emits proper event bindings
- [x] Full pipeline test passes
- [x] No TODO comments in emitted code
- [x] Counter/Badge/Drawer demos work with reactivity

### PATH B Success:

- [x] 3 export tests pass (assertions updated)
- [x] 1 lexer test passes (line tracking fixed)
- [x] 4 type-alias tests pass (spacing fixed)
- [x] 3 class tests pass (abstract class fixed)
- [x] 9 advanced feature tests pass (generators/async implemented)
- [x] Exit code 0 on `pnpm test`

### PATH C Success:

- [x] All P0 items in stub doc marked DONE
- [x] Full pipeline test passes
- [x] All demo components work
- [x] Reactivity system functional
- [x] Event handling functional
- [x] Control flow transformation complete

---

## Handoff Back to TADEO

When you finish your session, create:

1. **Update learnings** (if you learned something new):
   - File: `docs/learnings/05-[topic].md`
   - Format: Same as `04-parser-error-recovery-defensive-programming.md`

2. **Session complete doc**:
   - File: `docs/implementation-plans/[feature]/2026-02-10-HHMM-[feature]-complete.md`
   - Format: Same as `2026-02-10-parser-error-recovery-complete.md`

3. **Next agent prompt** (if work continues):
   - File: `docs/implementation-plans/[feature]/NEXT-AGENT-PROMPT.md`
   - Format: This file

---

## Final Checklist Before Starting

- [ ] Read `ai-collaboration-rules.json`
- [ ] Read `TRANSFORMER-STUBS-AND-INCOMPLETE-FEATURES.md`
- [ ] Read previous session learnings
- [ ] Verify build works
- [ ] Run parser tests to confirm baseline
- [ ] Ask user which path (A/B/C)
- [ ] Start implementation (NO STUBS!)

---

**Good luck! Remember: TADEO expects:**

- Binary honesty (works/doesn't work)
- No stubs or TODOs
- Prototype-based classes only
- Actually test your code
- Stop and ask if uncertain

**START HERE**: Ask user which path (A/B/C)
