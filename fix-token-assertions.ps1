# Fix "possibly undefined" token variables
# Correct pattern: tokenVar!.property (not tokenVar.property!)

$ErrorActionPreference = "Stop"

$targetPath = "c:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\src\parser\prototype"
$excludeFiles = @("parse-decorator.ts", "parse-yield-expression.ts", "parse-await-expression.ts")

Write-Host "Finding files to fix..."
$files = Get-ChildItem -Path $targetPath -Filter "parse-*.ts" | Where-Object { 
    $_.Name -notlike "*test*" -and $excludeFiles -notcontains $_.Name 
}

foreach ($file in $files) {
    Write-Host "`nProcessing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # First, remove incorrectly placed ! after properties
    $content = $content -replace '\.line!', '.line'
    $content = $content -replace '\.column!', '.column'
    $content = $content -replace '\.start!', '.start'
    $content = $content -replace '\.end!', '.end'
    $content = $content -replace '\.type!', '.type'
    $content = $content -replace '\.value!', '.value'
    
    # Now add ! correctly: before the dot
    # Match: tokenVariable.property (where tokenVariable ends with Token and no ! before it)
    $content = $content -replace '(?<!\!)(\w+Token)\.(line|column|start|end|type|value)', '$1!.$2'
    
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  - Fixed ! placement for token variables"
}

Write-Host "`n✅ Done! Tokens should now be: tokenVar!.property"
