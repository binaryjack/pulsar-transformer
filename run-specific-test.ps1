#!/usr/bin/env pwsh
# Run a specific test file and show ONLY pass/fail count
# Usage: .\run-specific-test.ps1 parse-try-statement

param(
    [Parameter(Mandatory=$true)]
    [string]$TestName
)

Write-Host "Running test: $TestName" -ForegroundColor Cyan

# Run test and capture output
$output = npm test -- $TestName 2>&1 | Out-String

# Extract just the summary line
if ($output -match "($TestName\.test\.ts.*)") {
    $summary = $matches[1]
    Write-Host "`nResult: $summary" -ForegroundColor Yellow
    
    # Determine pass/fail
    if ($summary -match "(\d+) failed") {
        $failCount = $matches[1]
        Write-Host "`n❌ FAILED: $failCount test(s) failing" -ForegroundColor Red
        exit 1
    } elseif ($summary -match "(\d+) tests\)") {
        $testCount = $matches[1]
        Write-Host "`n✅ PASSED: All $testCount tests passing" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "`n⚠️  Could not parse test output" -ForegroundColor Yellow
    Write-Host "Full output:" -ForegroundColor Gray
    Write-Host $output
    exit 2
}
