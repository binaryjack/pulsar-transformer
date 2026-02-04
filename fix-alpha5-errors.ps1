# Fix Alpha.5 TypeScript Errors
# Adds non-null assertions to token property accesses

$files = Get-ChildItem -Path "src\parser\prototype" -Filter "parse-*.ts" -Exclude "*test*","parse-decorator.ts","parse-yield-expression.ts","parse-await-expression.ts"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $content = Get-Content $file.FullName -Raw
    
    # Add ! to token property accesses that aren't already asserted
    # Match: tokenVariable.property where tokenVariable ends with Token
    # Don't match if already has ! before the .
    $content = $content -replace '(?<!\!)((?:start|end|name|type|current|saved|label|param|member|body|catch|finally|constructor|semi)Token)\.', '$1!.'
    
    Set-Content $file.FullName -Value $content -NoNewline
}

Write-Host "Done! Run 'npx tsc --noEmit' to check errors."
