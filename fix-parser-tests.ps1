# Fix parser usage pattern in all test files
$files = @(
    "src/parser/__tests__/integration/real-world-advanced.test.ts",
    "src/parser/prototype/__tests__/parse-switch-statement.test.ts"
)

foreach ($file in $files) {
    Write-Host "Fixing $file..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw
    
    # Pattern 1: createParser(source) followed by parse()
    $content = $content -replace 'const parser = createParser\(source\);(\s+)const ast = parser\.parse\(\);', 'const parser = createParser();$1const ast = parser.parse(source);'
    
    # Pattern 2: createParser(source) followed by parse() for program
    $content = $content -replace 'const parser = createParser\(source\);(\s+)const program = parser\.parse\(\);', 'const parser = createParser();$1const program = parser.parse(source);'
    
    Set-Content $file $content -NoNewline
    
    Write-Host "Fixed $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "All test files fixed!" -ForegroundColor Green
