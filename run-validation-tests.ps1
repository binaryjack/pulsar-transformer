#!/usr/bin/env pwsh
# Test all key PSR files to validate parser

Write-Host "`n=== Parser Validation Test Suite ===" -ForegroundColor Cyan
Write-Host "Testing parser after debug log removal`n" -ForegroundColor Yellow

$testFiles = @(
    "..\..\debug-simple.psr",
    "..\..\debug-arrow-simple.psr",
    "..\..\debug-if-statement.psr",
    "..\..\debug-object-args.psr",
    "..\pulsar-ui.dev\src\debug-tests\edge-case-1-array-map.psr",
    "..\pulsar-ui.dev\src\debug-tests\edge-case-2-nested-components.psr",
    "..\pulsar-ui.dev\src\debug-tests\edge-case-3-conditionals.psr"
)

$passed = 0
$failed = 0
$failedFiles = @()

foreach ($file in $testFiles) {
    $fileName = Split-Path $file -Leaf
    Write-Host "Testing: $fileName" -ForegroundColor White -NoNewline
    
    $output = node test-parser.js $file 2>&1 | Out-String
    
    if ($output -match "diagnostics: 0" -and $output -match "errors: 0") {
        Write-Host " ✅ PASS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $failed++
        $failedFiles += $fileName
        Write-Host "  Output: $($output -replace '(?s).*📊 Result:', '📊 Result:')" -ForegroundColor DarkGray
    }
}

Write-Host "`n=== Test Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -gt 0) {
    Write-Host "`nFailed files:" -ForegroundColor Red
    $failedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
    exit 0
}
