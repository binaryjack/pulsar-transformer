$rootPath = ".\src"
Write-Host "Fixing ESM imports in $rootPath..." -ForegroundColor Cyan

$fileCount = 0
Get-ChildItem -Path $rootPath -Filter *.ts -Recurse -Exclude "*.d.ts" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    if (-not $content) { return }
    
    $originalContent = $content
    
    # Fix: from './path' -> from './path.js'
    # Fix: from '../path' -> from '../path.js'
    $content = $content -replace "from\s+['""](\.[^'""]*?)(?<!\.js)['""]", "from '`$1.js'"
    
    # Fix double .js.js
    $content = $content -replace "\.js\.js'", ".js'"
    $content = $content -replace '\.js\.js"', '.js"'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  $($_.Name)" -ForegroundColor Green
        $fileCount++
    }
}

Write-Host "`nFixed $fileCount files. Now run: pnpm build" -ForegroundColor Cyan
