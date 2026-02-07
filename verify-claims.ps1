#!/usr/bin/env pwsh
# Verify specific test claims from the handoff document
# This script runs ONLY the tests claimed to be fixed

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "VERIFICATION OF CLAIMED FIXED TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$claimedFixed = @(
    @{ Name = "parse-try-statement"; Claimed = "10/10 passing" }
    @{ Name = "parse-switch-statement"; Claimed = "12/12 passing" }
    @{ Name = "parse-flow-control"; Claimed = "12/13 passing (1 skipped)" }
)

$results = @()

foreach ($test in $claimedFixed) {
    Write-Host "`nTesting: $($test.Name)" -ForegroundColor Yellow
    Write-Host "Claimed: $($test.Claimed)" -ForegroundColor Gray
    
    $output = npm test -- $test.Name 2>&1 | Out-String
    
    if ($output -match "$($test.Name)\.test\.ts \((\d+) tests.*?\)") {
        $fullMatch = $matches[0]
        
        $passed = $false
        $failed = $false
        $skipped = 0
        
        if ($fullMatch -match "(\d+) failed") {
            $failed = $true
            $failCount = $matches[1]
        }
        if ($fullMatch -match "(\d+) skipped") {
            $skipped = [int]$matches[1]
        }
        
        $testCount = $matches[1]
        
        if ($failed) {
            Write-Host "❌ ACTUAL: FAILING ($failCount failed)" -ForegroundColor Red
            $results += @{ Test = $test.Name; Status = "FAILED"; Claimed = $test.Claimed }
        } else {
            $skipMsg = if ($skipped -gt 0) { " ($skipped skipped)" } else { "" }
            Write-Host "✅ ACTUAL: PASSING ($testCount tests$skipMsg)" -ForegroundColor Green
            $results += @{ Test = $test.Name; Status = "PASSED"; Claimed = $test.Claimed }
        }
    } else {
        Write-Host "⚠️  Could not verify (test may not have run)" -ForegroundColor Yellow
        $results += @{ Test = $test.Name; Status = "UNKNOWN"; Claimed = $test.Claimed }
    }
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$allPassed = $true
foreach ($result in $results) {
    $statusColor = switch ($result.Status) {
        "PASSED" { "Green" }
        "FAILED" { "Red" }
        default { "Yellow" }
    }
    
    Write-Host "$($result.Test): " -NoNewline
    Write-Host $result.Status -ForegroundColor $statusColor
    
    if ($result.Status -ne "PASSED") {
        $allPassed = $false
    }
}

Write-Host "`n=====================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ ALL CLAIMED FIXES VERIFIED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ SOME CLAIMS COULD NOT BE VERIFIED" -ForegroundColor Red
    exit 1
}
