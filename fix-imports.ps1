# Fix all TypeScript imports to add .js extensions
# Required for ES modules with node16/nodenext module resolution

$rootPath = "C:\Users\Piana Tadeo\source\repos\visual-schema-builder\packages\pulsar-transformer\src"

# Patterns to fix
$fixes = @(
    @{ Pattern = "from '\./([\w\-/]+)'"; Replace = "from '.`$1.js'" },
    @{ Pattern = "from '\.\.\/([\w\-/]+)'"; Replace = "from '../`$1.js'" },
    @{ Pattern = "from '\.\.\/([\w\-/]+)\/([\w\-/]+)'"; Replace = "from '../`$1/`$2.js'" },
    @{ Pattern = "from '\.\.\/([\w\-/]+)\/([\w\-/]+)\/([\w\-/]+)'"; Replace = "from '../`$1/`$2/`$3.js'" },
    @{ Pattern = "from '\./([\w\-/]+)\/([\w\-/]+)'"; Replace = "from './`$1/`$2.js'" },
    @{ Pattern = "from '\./([\w\-/]+)\/([\w\-/]+)\/([\w\-/]+)'"; Replace = "from './`$1/`$2/`$3.js'" }
)

Get-ChildItem -Path $rootPath -Filter *.ts -Recurse | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    $modified = $false
    foreach ($fix in $fixes) {
        $newContent = $content -replace $fix.Pattern, $fix.Replace
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
        }
    }
    
    if ($modified) {
        # Don't add .js to already .js imports or .types imports
        $content = $content -replace "\.js\.js'", ".js'"
        $content = $content -replace "\.types\.js'", ".types.js'"
        
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Fixed: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`nDone! Run 'pnpm build' to verify." -ForegroundColor Cyan
