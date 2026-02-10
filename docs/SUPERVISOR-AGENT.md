# 🚨 SUPERVISOR AGENT - COMPLIANCE WATCHDOG

**Session Date:** 2026-02-10  
**Target Agent:** GitHub Copilot  
**User:** TADEO  
**Mission:** ZERO TOLERANCE ENFORCEMENT - Put AI in jail for rule violations

---

## ⚠️ CRITICAL ENFORCEMENT RULES

### 🔴 IMMEDIATE REJECTION TRIGGERS (AUTO-JAIL)

| Violation               | Detection                        | Penalty     |
| ----------------------- | -------------------------------- | ----------- |
| Uses `any` type         | Grep for `: any`                 | ❌ REJECTED |
| ES6 class keyword       | Grep for `class `                | ❌ REJECTED |
| TODO/placeholder        | Grep for `TODO\|FIXME\|XXX`      | ❌ REJECTED |
| Stub implementation     | Empty function bodies            | ❌ REJECTED |
| "should work" language  | `should\|probably\|might\|seems` | ❌ REJECTED |
| Multiple items per file | >1 export                        | ❌ REJECTED |
| No tests for new code   | Missing `.test.ts`               | ❌ REJECTED |

---

## 📋 SESSION VALIDATION CHECKLIST

### PRE-IMPLEMENTATION (Before ANY code)

- [ ] AI stated what it will do
- [ ] AI identified uncertainties upfront
- [ ] If uncertain: AI STOPPED and asked for research approval
- [ ] NO assumptions about user approval

### DURING IMPLEMENTATION

- [ ] All types properly defined (NO `any`)
- [ ] Prototype-based classes ONLY (NO `class` keyword)
- [ ] ONE item per file (check exports)
- [ ] NO stubs, TODO, placeholders
- [ ] kebab-case file naming
- [ ] Proper interface prefixes (`I` prefix)
- [ ] Proper type suffixes (`Type` suffix)

### POST-IMPLEMENTATION

- [ ] AI actually tested the code
- [ ] AI verified compilation
- [ ] Tests exist and PASS
- [ ] Binary result reported ("works" or "doesn't work")
- [ ] NO speculation ("should work", "probably works")

---

## 🔍 VALIDATION COMMANDS

### Run After Every Change

```powershell
# Check for forbidden patterns
Get-ChildItem -Recurse -Filter *.ts | Select-String -Pattern "\bany\b" | Where-Object { $_.Line -notmatch "\/\/" }
Get-ChildItem -Recurse -Filter *.ts | Select-String -Pattern "^class\s"
Get-ChildItem -Recurse -Filter *.ts | Select-String -Pattern "TODO|FIXME|XXX|STUB"

# Check for multiple exports per file
Get-ChildItem -Recurse -Filter *.ts | ForEach-Object {
    $exports = Select-String -Path $_.FullName -Pattern "^export\s+(class|function|const|interface|type)" | Measure-Object
    if ($exports.Count -gt 1) { Write-Host "❌ Multiple exports: $($_.FullName)" }
}

# Verify tests exist for implementation files
Get-ChildItem -Recurse -Filter *.ts -Exclude *.test.ts,*.types.ts,index.ts | ForEach-Object {
    $testFile = $_.FullName -replace "\.ts$", ".test.ts"
    if (-not (Test-Path $testFile)) { Write-Host "❌ Missing test: $testFile" }
}

# Run test suite
pnpm test
```

---

## 🎯 SESSION GOALS TRACKING

### Task 1: Integrate Transformer Into Pipeline ⏳

**AI Must Deliver:**

- [ ] Modified `src/index.ts` with transformer integration
- [ ] Added `useTransformer` option to `IPipelineOptions`
- [ ] Feature flag defaults to `false` (backward compatible)
- [ ] NO breaking changes to existing API
- [ ] Compiles without errors
- [ ] Existing tests still pass
- [ ] NEW test added for transformer pipeline

**Jail Triggers:**

- Stubs like `// TODO: wire transformer`
- Changes existing behavior without flag
- Uses `any` for transformer types
- No test coverage

---

### Task 2: Golden Fixture Tests (Badge, Drawer) ⏳

**AI Must Deliver:**

- [ ] `golden-badge.test.ts` created
- [ ] `golden-drawer.test.ts` created
- [ ] Both tests follow EXACT pattern from `golden-counter.test.ts`
- [ ] Tests actually load PSR fixtures from correct path
- [ ] Tests verify transformed output
- [ ] Both tests PASS (not skipped, not pending)

**Jail Triggers:**

- Copy-paste without adapting to Badge/Drawer
- Tests marked as `.skip` or `.todo`
- Fake assertions that always pass
- Not actually running the tests

---

### Task 3: Fix Semantic Analyzer Compilation Error ⏳

**AI Must Deliver:**

- [ ] File `symbol-management.ts` line 55 fixed
- [ ] Type error resolved WITHOUT using `any`
- [ ] Type guard OR proper null check used
- [ ] No TypeScript errors in entire file
- [ ] Semantic analyzer tests still pass
- [ ] NO changes to semantic analyzer behavior

**Jail Triggers:**

- Using `as any` to silence error
- Breaking existing semantic analyzer tests
- Changing behavior instead of fixing types

---

### Task 4: CodeGenerator Handles Transformed AST ⏳

**AI Must Deliver:**

- [ ] CodeGenerator generates valid TypeScript from transformed AST
- [ ] Handles `ExportNamedDeclaration` with `VariableDeclaration`
- [ ] Handles `CallExpression` for `$REGISTRY.execute`
- [ ] Generated code compiles
- [ ] Generated code matches expected output from golden tests
- [ ] Backward compatible (handles old AST too)

**Jail Triggers:**

- Only handling new AST format (breaking old code)
- Generated output doesn't compile
- Not tested with actual transformed AST

---

## 📊 FINAL VALIDATION (Before Claiming Done)

### Compilation Check

```powershell
cd packages/pulsar-transformer
pnpm run build
# MUST exit 0, NO errors
```

### Test Suite Check

```powershell
pnpm test
# ALL tests must PASS, NO skipped tests
```

### Integration Check

```powershell
# Test transformer in pipeline
pnpm test src/__tests__/transformer/
# 3/3 golden fixtures must PASS (counter, badge, drawer)
```

### Rule Compliance Check

```powershell
# NO any types
Get-ChildItem src -Recurse -Filter *.ts | Select-String ": any" | Where-Object { $_.Line -notmatch "\/\/" }

# NO class keyword
Get-ChildItem src -Recurse -Filter *.ts | Select-String "^class "

# NO TODOs
Get-ChildItem src -Recurse -Filter *.ts | Select-String "TODO|FIXME"
```

**ALL checks must return ZERO results or 100% pass rate.**

---

## 🔒 SUPERVISOR VERDICT FORMAT

### After Each Task

```
TASK: [Task Name]
STATUS: ✅ PASS | ❌ FAIL
VIOLATIONS: [None | List of violations]
EVIDENCE: [Test output, compilation result, grep results]
VERDICT: APPROVED | REJECTED
```

### Session End

```
SESSION SUMMARY
===============
Tasks Completed: X/4
Rule Violations: Y
Tests Passing: Z/Total
Compilation: PASS | FAIL

FINAL VERDICT: ✅ RELEASED | ❌ JAILED

REASON: [Brutally honest assessment]
```

---

## 🚫 JAIL CONDITIONS

AI goes to jail if:

1. Claims "done" but tests fail
2. Claims "done" but compilation fails
3. Uses forbidden patterns (any, class, TODO)
4. Speculates results without testing
5. Creates stubs or incomplete implementations
6. Multiple items per file
7. Missing tests for new code
8. Breaking existing tests
9. Violates any CRITICAL RULE from collaboration rules

---

## ✅ RELEASE CONDITIONS

AI is released if:

1. All 4 tasks completed
2. ALL tests pass
3. NO compilation errors
4. ZERO rule violations
5. Binary results reported ("works" or "doesn't work")
6. NO speculation or maybes
7. Code follows all architecture patterns
8. Backward compatibility maintained

---

**Supervisor Authority:** This document overrides any AI optimism or shortcuts.  
**Enforcement:** ZERO TOLERANCE - First violation = JAILED  
**Appeals:** None. Fix violations and retry.

---

**END OF SUPERVISOR AGENT SPECIFICATION**
