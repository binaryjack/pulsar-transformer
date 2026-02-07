# 🚀 Quick Start for Next AI Agent

**⏱️ 2-Minute Briefing - Read This First**

---

## 📍 Where We Are

**Status:** 75% of original issues remain (~150 tests failing)

**What's Fixed:** ✅

- TypeScript compilation (8 errors → 0)
- JSX fragments (13/13 tests ✅)
- Increment/decrement operators (++, --)
- For loops (10/16 tests ✅)

**What's Broken:** ❌

- Loop statements: 6 tests (break/continue, while, do-while)
- Type system: 22 tests (whitespace, generics)
- Pipeline: 12 tests (E2E integration)
- Minor issues: 21 tests

---

## 🔥 MANDATORY - Do This First

```bash
# 1. Read the rules (10 minutes)
.github/copilot-instructions.md
  → 00-CRITICAL-RULES.md
  → 01-ARCHITECTURE-PATTERNS.md
  → 03-QUICK-REFERENCE.md

# 2. Read the full handoff
SESSION-HANDOFF-2026-02-07-PART4-PROGRESS.md

# 3. Verify baseline
cd packages/pulsar-transformer
npm run build  # Should succeed
npm test 2>&1 | Select-String -Pattern "(Test Files|Tests:)" | Select-Object -First 3
```

---

## 🎯 Your First Task

**Fix remaining 6 loop statement failures:**

```powershell
npm test -- parse-loop-statements
# Currently: 10 passed | 6 failed
# Goal: 16 passed | 0 failed
```

**Issues:**

1. Break statement parser: `Expected 'break', got break` (line 70)
2. While loops: `Expected ')' after while test, got <`
3. Do-while loops: Same condition parsing issue

**Files:**

- `src/parser/prototype/parse-flow-control.ts`
- `src/parser/prototype/parse-loop-statements.ts`

**Estimated Time:** 1-2 hours

---

## 🚨 The Rules (Burned In)

1. ❌ **NO SHORTCUTS** - Full implementation only
2. ❌ **NO MVP** - Complete or nothing
3. ❌ **NO CLAIMS WITHOUT PROOF** - Show test output
4. ✅ **VERIFY EVERYTHING** - Run tests, show results

---

## 📊 Test Commands

```powershell
# Build
npm run build

# Run specific test
npm test -- parse-loop-statements

# Get summary
npm test -- parse-loop-statements 2>&1 | Select-String -Pattern "(Test Files|Tests:)"

# Full suite (be patient)
npm test
```

---

## 📂 Key Files

**Parsers:**

- `src/parser/prototype/parse-loop-statements.ts` - for, while, do-while
- `src/parser/prototype/parse-flow-control.ts` - break, continue
- `src/parser/prototype/parse-type-alias.ts` - Type aliases
- `src/parser/prototype/parse-expression.ts` - Expressions

**Tests:**

- `src/parser/prototype/__tests__/parse-loop-statements.test.ts`
- `src/parser/prototype/__tests__/parse-type-alias.test.ts`
- `src/pipeline/__tests__/pipeline.test.ts`

---

## ✅ Success Criteria

**Phase 1 Complete When:**

- Loop tests: 16/16 ✅
- Proof: Screenshot or output showing all pass
- Build: Still works

**Overall Complete When:**

- 95%+ tests passing
- No compilation errors
- Pipeline integration works

---

## 💬 Report Format

```
✅ Fixed [Feature]
   - [Specific change 1]
   - [Specific change 2]
   - Tests: X/Y passing (was A/B)
   - Verification: [command + output]

Next: [What you're doing next]
```

---

## 🆘 If Stuck

1. Read full handoff: `SESSION-HANDOFF-2026-02-07-PART4-PROGRESS.md`
2. Check debugging tips section
3. Create debug script to inspect tokens
4. Add console.log to parser
5. Ask for clarification (with context!)

---

**Start Time:** [When you begin]  
**Goal:** Fix loops → type system → pipeline  
**End Goal:** 95%+ test pass rate

**LET'S GO! 🚀**

---

## 🚨 CRITICAL RULES

❌ NO SHORTCUTS  
❌ NO MVP  
❌ NO CLAIMING IT WORKS UNTIL IT DOES  
✅ TEST EVERYTHING  
✅ READ COPILOT INSTRUCTIONS FIRST

---

**Full Details:** See `SESSION-HANDOFF-2026-02-07-PART2.md`
