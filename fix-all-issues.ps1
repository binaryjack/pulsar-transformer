Write-Host "=== COMPREHENSIVE FIX SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix all import paths (ast.js, ir.js, lexer.js, parser.js)
Write-Host "1. Fixing import paths..." -ForegroundColor Yellow

Get-ChildItem .\src -Recurse -Filter *.ts -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $original = $content
    
    # Fix ast.js imports
    $content = $content -replace "from ['""]\.\/ast\.js['""]", "from './ast/index.js'"
    $content = $content -replace "from ['""]\.\.\/ast\.js['""]", "from '../ast/index.js'"
    $content = $content -replace "from ['""]\.\.\/parser\/ast\.js['""]", "from '../parser/ast/index.js'"
    $content = $content -replace "from ['""]\.\.\/\.\.\/parser\/ast\.js['""]", "from '../../parser/ast/index.js'"
    
    # Fix ir.js imports
    $content = $content -replace "from ['""]\.\/ir\.js['""]", "from './ir/index.js'"
    $content = $content -replace "from ['""]\.\.\/ir\.js['""]", "from '../ir/index.js'"
    
    # Fix lexer.js imports (should reference lexer/index.js)
    $content = $content -replace "from ['""]\.\.\/lexer\.js['""]", "from '../lexer/index.js'"
    $content = $content -replace "from ['""]\.\/lexer\.js['""]", "from './lexer/index.js'"
    
    # Fix strategies.js and strategy-manager.js
    $content = $content -replace "from ['""]\.\/strategies\.js['""]", "from './strategies/index.js'"
    $content = $content -replace "from ['""]\.\/strategy-manager\.js['""]", "from './strategy-manager/index.js'"
    
    if ($content -ne $original) {
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""

# Step 2: Export IRNode as IIRNode alias
Write-Host "2. Fixing IR exports..." -ForegroundColor Yellow

$irIndexPath = ".\src\analyzer\ir\index.ts"
$irContent = Get-Content $irIndexPath -Raw

if ($irContent -notmatch "export type \{ IIRNode as IRNode \}") {
    # Add export alias
    $irContent = $irContent -replace "(export type \{[^}]+IIRNode)", "`$1`nexport type { IIRNode as IRNode }"
    Set-Content $irIndexPath -Value $irContent -NoNewline
    Write-Host "  ✓ Added IRNode export alias" -ForegroundColor Green
}

Write-Host ""

# Step 3: Remove/comment out test-helpers factory import
Write-Host "3. Fixing test-helpers..." -ForegroundColor Yellow

$testHelpersPath = ".\src\__tests__\test-helpers.ts"
if (Test-Path $testHelpersPath) {
    $content = Get-Content $testHelpersPath -Raw
    if ($content -match "from ['""]\.\.\/factory\.js['""]") {
        $content = $content -replace "import.*from ['""]\.\.\/factory\.js['""];?", "// import removed - factory.js deleted"
        Set-Content $testHelpersPath -Value $content -NoNewline
        Write-Host "  ✓ Removed factory.js import" -ForegroundColor Green
    }
}

Write-Host ""

# Step 4: Fix debug-output default import
Write-Host "4. Fixing debug-output..." -ForegroundColor Yellow

$debugOutputPath = ".\src\__tests__\debug-output.ts"
if (Test-Path $debugOutputPath) {
    $content = Get-Content $debugOutputPath -Raw
    if ($content -match "import\s+\w+\s+from") {
        $content = $content -replace "import\s+(\w+)\s+from\s+['""]\.\.\/index\.js['""]", "import * as `$1 from '../index.js'"
        Set-Content $debugOutputPath -Value $content -NoNewline
        Write-Host "  ✓ Fixed default import" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== FIX COMPLETE ===" -ForegroundColor Cyan
Write-Host "Run 'pnpm build' to verify" -ForegroundColor Yellow
