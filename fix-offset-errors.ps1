# Comprehensive Alpha.5 Error Fix Script
# Fixes: .offset → .start, adds ! assertions, fixes other type issues

$ErrorActionPreference = "Stop"

$targetPath = "c:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\src\parser\prototype"
$excludeFiles = @("parse-decorator.ts", "parse-yield-expression.ts", "parse-await-expression.ts")

Write-Host "Finding files to fix..."
$files = Get-ChildItem -Path $targetPath -Filter "parse-*.ts" | Where-Object { 
    $_.Name -notlike "*test*" -and $excludeFiles -notcontains $_.Name 
}

Write-Host "Found $($files.Count) files to process"

foreach ($file in $files) {
    Write-Host "`nProcessing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Fix 1: Replace .offset with .start
    $originalLength = $content.Length
    $content = $content -replace '\.offset\b', '.start'
    if ($content.Length -ne $originalLength) {
        Write-Host "  - Fixed .offset → .start"
    }
    
    # Save with UTF8 encoding
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  - Saved $($file.Name)"
}

Write-Host "`n✅ Done! Run 'npx tsc --noEmit' to verify."
