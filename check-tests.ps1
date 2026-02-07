$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== RUNNING FULL TEST SUITE ===" -ForegroundColor Cyan
Write-Host ""

$testOutput = npm test 2>&1 | Out-String

# Extract final summary
if ($testOutput -match "Test Files\s+(\d+)\s+failed.*\((\d+)\)") {
    $failedFiles = $matches[1]
    $totalFiles = $matches[2]
    Write-Host "Test Files: $failedFiles failed ($totalFiles total)" -ForegroundColor Yellow
}

if ($testOutput -match "Tests\s+(\d+)\s+failed.*\((\d+)\)") {
    $failedTests = $matches[1]
    $totalTests = $matches[2]
    Write-Host "Tests: $failedTests failed ($totalTests total)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== FILES WITH FAILURES ===" -ForegroundColor Red
Write-Host ""

# Find all files with failures
$failedFileMatches = $testOutput | Select-String -Pattern "\s*❯.*\(\d+ tests \| \d+ failed\)" -AllMatches

foreach ($match in $failedFileMatches.Matches) {
    Write-Host $match.Value -ForegroundColor Red
}

Write-Host ""
Write-Host "Test summary complete." -ForegroundColor Green
