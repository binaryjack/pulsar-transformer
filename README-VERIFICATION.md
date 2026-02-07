# Verification Guide for Transformer Tests

## Trust, but Verify - Tools for Independent Verification

This guide gives you command-line tools to verify AI claims **without trusting AI interpretation**.

---

## Quick Verification Commands

### 1. Verify Specific Claimed Fixes

```powershell
cd packages/pulsar-transformer
.\verify-claims.ps1
```

**What it does:** Runs ONLY the 3 tests claimed to be fixed (try, switch, flow-control) and shows real pass/fail.

**Output you'll see:**

```
✅ ACTUAL: PASSING (10 tests)  ← means it really works
❌ ACTUAL: FAILING (3 failed)  ← means claim was false
```

---

### 2. Test One Specific File

```powershell
cd packages/pulsar-transformer
.\run-specific-test.ps1 parse-try-statement
```

**What it does:** Runs just that one test file, shows clear pass/fail.

---

### 3. Get Full Test Count (Manual)

```powershell
cd packages/pulsar-transformer
npm test 2>&1 | Select-String "Test Files" | Select-Object -Last 1
```

**What you see:**

```
Test Files  5 failed | 35 passed (40)
```

This is the **ground truth** - not AI interpretation.

---

### 4. List All Failing Tests

```powershell
cd packages/pulsar-transformer
npm test 2>&1 | Select-String "failed\)" | Select-String "\.test\.ts"
```

**What you see:** Every test file with failures.

---

## How to Use This When AI Claims Success

**AI says:** "I fixed parse-try-statement.ts, all 10 tests passing!"

**You do:**

```powershell
.\run-specific-test.ps1 parse-try-statement
```

**You see one of:**

- `✅ PASSED: All 10 tests passing` → AI was correct
- `❌ FAILED: 3 test(s) failing` → AI lied or failed
- `⚠️ Could not parse` → Test didn't run (AI fooled by cache)

---

## Break the AI Trust Cycle

1. **Before AI session:** Run `.\verify-claims.ps1` → Note the current state
2. **AI makes changes:** Let them work
3. **AI claims success:** Don't trust it
4. **You verify:** Run `.\verify-claims.ps1` again
5. **Compare:** Did numbers actually improve?

---

## Files You Can Trust (Raw Data)

These files contain RAW test output - no AI interpretation:

- `test-output.txt` - Full test run output
- `test-verification-output.txt` - Output from verification script

Open them in a text editor, search for test names, see real results.

---

## The Nuclear Option - Full Test Run with Counts

```powershell
cd packages/pulsar-transformer
npm test 2>&1 | Tee-Object -FilePath "my-test-run.txt" | Select-String "Test Files|Tests.*passed|failed"
```

Then open `my-test-run.txt` and see EVERYTHING.

---

## What to Do When AI Hallucinates Success

1. **Stop the session** - Don't let AI keep working on hallucinations
2. **Run verification** - Use the scripts above
3. **Show AI the raw output** - Paste the actual terminal output
4. **Demand specific fixes** - "Fix parse-jsx-fragment.test.ts line 45"
5. **Verify immediately** - Run test after each fix

---

## Example Verification Workflow

```powershell
# 1. Baseline
cd packages/pulsar-transformer
npm test 2>&1 | Out-File baseline.txt
Get-Content baseline.txt | Select-String "Test Files"
# Note: "Test Files  10 failed | 30 passed (40)"

# 2. AI makes changes
# ... AI works ...

# 3. Verify
npm test 2>&1 | Out-File after.txt
Get-Content after.txt | Select-String "Test Files"
# Check: Did failed count decrease?

# 4. Compare specific tests
.\verify-claims.ps1
```

---

## Red Flags That AI Is Hallucinating

- ❌ AI says "all tests passing" but won't show terminal output
- ❌ AI claims "230 passing" but can't explain the failed count
- ❌ AI says "fixed" but test file has `describe.skip` or `it.skip`
- ❌ AI reports numbers that don't match your terminal output

---

## Your Verification Checklist

Before accepting AI's work:

- [ ] Ran `.\verify-claims.ps1` - saw actual pass/fail
- [ ] Compared before/after test counts
- [ ] Checked raw test output file
- [ ] Spot-checked 2-3 test files manually
- [ ] No `skip` calls hiding failures

---

**Bottom Line:** These scripts give YOU control. Don't trust AI - verify yourself.
