# Quick test script
Set-Location "E:\Sources\visual-schema-builder\packages\pulsar-transformer"
Write-Host "Building..."
npm run build 2>&1 | Out-Null
Write-Host "Running type-alias tests..."
npm test -- parse-type-alias 2>&1 | Tee-Object -Variable output | Out-Null
$output | Select-String -Pattern "(Test Files|Tests|PASS|FAIL)" | Select-Object -First 10
