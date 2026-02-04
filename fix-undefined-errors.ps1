# Fix "possibly undefined" errors by adding ! assertions
# Targets variables ending with "Token" when accessing properties

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
    
    # Add ! before . for token variables
    # Pattern: variableName.property where variableName ends with Token
    # Replace: variableName!.property
    # But don't replace if ! is already there
    
    $patterns = @(
        'Token\.line'
        'Token\.column'
        'Token\.start'
        'Token\.end'
        'Token\.type'
        'Token\.value'
    )
    
    foreach ($pattern in $patterns) {
        # Match: someToken.property (not preceded by !)
        # Replace: someToken!.property
        $content = $content -replace "(?<!!)(\w+$pattern)", '$1!'
        $content = $content -replace "(\w+Token)!\!\.($($pattern.Split('\.')[1]))", '$1!.$2'  # Fix double !!
    }
    
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  - Added ! assertions"
}

Write-Host "`n✅ Done!"
