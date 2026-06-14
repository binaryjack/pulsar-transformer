# Claims Verification Checklist

**Purpose:** Prevent fabricated claims in documentation  
**Rule:** NEVER update README without running these checks  
**Last Updated:** February 10, 2026

---

## 🚨 THE GOLDEN RULE

**NEVER CLAIM WITHOUT MEASUREMENT**

- ❌ "Should work" → Don't claim it
- ❌ "Probably ~90%" → Measure it
- ❌ "Around 500 tests" → Count exactly
- ✅ "58 tests, 49 passing (84.5%)" → Verified

---

## ✅ BEFORE UPDATING README.md

### 1. Test Count Verification

**Run:**

```powershell
cd packages/synetics-transformer
pnpm test --verbose 2>&1 | Select-String "Tests:"
```

**Extract:**

- Total tests: **\_\_\_**
- Tests passed: **\_\_\_**
- Tests failed: **\_\_\_**
- Pass rate: **\_\_\_** % (passed / total \* 100)

**Update README line:**

```markdown
- ✅ **XX/YY Tests Passing (ZZ%)** - Core features verified
```

**Example:**

```markdown
- ✅ **49/58 Tests Passing (84.5%)** - Core features verified
```

---

### 2. Phase Count Verification

**Run:**

```powershell
Get-Content src/index.ts | Select-String "Phase"
```

**Count the phases:**

- Phase 1: ********\_********
- Phase 2: ********\_********
- Phase 3: ********\_********
- Phase 4: ********\_******** (if exists)
- Phase 5: ********\_******** (if exists)

**Actual phase count:** **\_\_\_**

**Update README to match:**

```markdown
The Synetics Transformer converts PSR source code through a **X-phase compilation pipeline**:
```

---

### 3. Architecture Diagram Verification

**Check directory structure:**

```powershell
Get-ChildItem src -Directory | Select-Object Name
```

**Existing directories:**

- [ ] lexer
- [ ] parser
- [ ] semantic-analyzer
- [ ] code-generator
- [ ] transformer (❌ doesn't exist yet)
- [ ] emitter (❌ doesn't exist yet)

**Update pipeline diagram to match reality:**

```
Current (if 3 phases):
PSR → Lexer → Parser → CodeGenerator → TypeScript

Future (if planning 5 phases):
PSR → Lexer → Parser → Transformer → Emitter → TypeScript
```

---

### 4. Individual Phase Test Count

**Run each phase test:**

```powershell
pnpm test lexer
pnpm test parser
pnpm test semantic-analyzer
pnpm test code-generator
```

**Record actual results:**

| Phase    | Tests Run | Tests Passed | Pass Rate |
| -------- | --------- | ------------ | --------- |
| Lexer    | **\_\_**  | **\_\_**     | **\_\_**% |
| Parser   | **\_\_**  | **\_\_**     | **\_\_**% |
| Semantic | **\_\_**  | **\_\_**     | **\_\_**% |
| CodeGen  | **\_\_**  | **\_\_**     | **\_\_**% |

**Update README test section with EXACT numbers.**

---

### 5. Performance Claims

**If claiming performance metrics, run benchmarks:**

```powershell
pnpm run benchmark
```

**Record:**

- Tokens/sec: ******\_******
- AST nodes/sec: ******\_******
- Memory per component: ******\_******

**Only claim measured values.**

**If no benchmarks exist:**

- ❌ Don't claim performance numbers
- ✅ Mark as "TODO: Add benchmarks"

---

### 6. Feature Status Verification

**For each claimed feature, verify:**

**Claimed:** "✅ JSX Transform works"  
**Verify:**

```powershell
pnpm test jsx
```

**Result:** **\_\_\_** tests passing  
**Verdict:**

- ✅ Claim if 100% passing
- ⚠️ Mark "partial" if 50-99% passing
- ❌ Don't claim if <50% passing

---

### 7. Link Verification

**Check all links in README:**

```powershell
# Check if verification report exists at claimed location
Test-Path ./VERIFICATION-REPORT-2026-02-07.md

# Check docs links
Test-Path ./docs/architecture.md
Test-Path ./docs/api-reference.md
```

**Fix broken links:**

- Use relative paths
- Verify files exist
- Test links work

---

### 8. Build Status Verification

**Run:**

```powershell
pnpm build
```

**Check TypeScript errors:**

```powershell
pnpm tsc --noEmit
```

**Count errors:** **\_\_\_**

**Update README:**

- ✅ "0 errors" only if literally 0
- ❌ Don't claim "passing" if errors exist

---

## 🔍 VERIFICATION TEMPLATE

**Before committing README changes, fill this out:**

```
Date: ______________
Verified by: ______________

✅ Test count: _____ tests, _____ passing (____%)
✅ Phase count: _____ phases (list: _______________)
✅ Architecture diagram matches src/ structure: YES / NO
✅ All links work: YES / NO
✅ Build has 0 TypeScript errors: YES / NO
✅ Performance claims measured: YES / NO / N/A
✅ Feature claims tested: YES / NO

If any NO: Fix before committing.
```

---

## 📊 CURRENT VERIFIED STATE (Feb 10, 2026)

**Last full verification:** February 10, 2026 (Phase 2 complete)

✅ **Test count:** 58 tests, 51 passing (87.9%)  
✅ **Phase count:** 3 phases (Lexer, Parser, CodeGenerator)  
✅ **Architecture:** Matches src/ directory structure  
✅ **Build:** 0 TypeScript errors  
✅ **Integration tests:** Fixed (3/3 passing with improved normalization)  
⚠️ **Performance:** Claims present but not recently measured  
✅ **Links:** Fixed (VERIFICATION-REPORT path corrected)

---

## 🚨 RED FLAGS TO AVOID

### ❌ NEVER DO THIS:

1. **"~500 tests"** → Vague numbers hide uncertainty
2. **"Should be 90%+"** → Wishful thinking, not measurement
3. **"5-phase pipeline"** when only 3 exist → Aspirational architecture
4. **"Works perfectly"** → Test it first
5. **"Ready for production"** → Define what that means, verify it

### ✅ ALWAYS DO THIS:

1. **"58 tests, 49 passing (84.5%)"** → Exact, verifiable
2. **"3-phase pipeline (current)"** → Matches reality
3. **"Lexer: 13/13 tests passing"** → Specific, measurable
4. **"Integration tests: 1/3 passing (whitespace issues)"** → Honest about problems
5. **"Future work: Separate transformer phase"** → Clear about what's planned vs. done

---

## 📝 HOW TO USE THIS CHECKLIST

### For README Updates:

1. Open this file
2. Run each verification command
3. Record results
4. Update README with EXACT numbers
5. Double-check links
6. Commit both README and this file (with updated verification date)

### For New Features:

1. Write tests FIRST
2. Implement feature
3. Verify tests pass
4. Update README only after verification
5. Use this checklist

### For AI Agents:

1. **READ THIS FILE** before claiming anything works
2. Run verification commands
3. Record actual results
4. Update docs with verified numbers only
5. Never use "approximately" - measure exactly

---

## 🎯 EMERGENCY DE-BULLSHIT PROTOCOL

**If you discover fabricated claims:**

1. **STOP** - Don't commit anything
2. **IDENTIFY** - List all false claims
3. **MEASURE** - Run verification commands
4. **FIX** - Update with real numbers
5. **VERIFY** - Run this checklist
6. **COMMIT** - With message: "docs: fix fabricated claims (VERIFIED)"

**Template commit message:**

```
docs: fix fabricated test count

- Was: "490+ tests passing"
- Now: "49/58 tests passing (84.5%)"
- Verification: pnpm test output from [date]
- Verified by: [your name]
```

---

## ✅ FINAL RULE

**If you can't verify it, don't claim it.**

**Period.**

---

**Maintained by:** Tadeo  
**Enforced by:** Pre-commit hooks (TODO)  
**Verified:** Every README update
