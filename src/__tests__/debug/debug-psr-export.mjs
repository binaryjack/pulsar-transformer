/**
 * Debug script to test PSR transformation for index.psr
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createPipeline } from '../../../dist/index.js'

console.log('🔍 DEBUG: PSR Export Transformation Test\n');

// Read the index.psr file (relative to workspace root)
const psrFilePath = resolve(process.cwd(), 'packages/pulsar-ui.dev/src/debug-tests/index.psr');
const source = readFileSync(psrFilePath, 'utf-8');

console.log('📄 Source file:', psrFilePath);
console.log('📏 Source length:', source.length, 'chars\n');

// Create pipeline with debug enabled
const pipeline = createPipeline({ debug: true });

console.log('⚙️ Transforming...\n');
const result = pipeline.transform(source);

console.log('\n📊 Transformation Result:');
console.log('  - Success:', !!result.code);
console.log('  - Diagnostics:', result.diagnostics?.length || 0);
console.log('  - Output length:', result.code.length, 'chars\n');

if (result.diagnostics && result.diagnostics.length > 0) {
  console.log('📋 Diagnostics:');
  result.diagnostics.forEach((diag) => {
    console.log(`  [${diag.phase}] ${diag.type}: ${diag.message}`);
  });
  console.log();
}

console.log('🔍 Checking for export statement...');
const hasExport = result.code.includes('export');
const hasDebugTestSuitePSR = result.code.includes('DebugTestSuitePSR');
const hasExportDebugTestSuitePSR =
  result.code.includes('export') && result.code.includes('DebugTestSuitePSR');

console.log('  - Contains "export":', hasExport);
console.log('  - Contains "DebugTestSuitePSR":', hasDebugTestSuitePSR);
console.log('  - Contains export with name:', hasExportDebugTestSuitePSR);
console.log();

// Find all exports in the code
console.log('🔎 All export statements in output:');
const exportLines = result.code.split('\n').filter((line) => line.trim().startsWith('export'));
if (exportLines.length > 0) {
  exportLines.forEach((line, idx) => {
    console.log(`  ${idx + 1}. ${line.trim()}`);
  });
} else {
  console.log('  ❌ NO EXPORT STATEMENTS FOUND!');
}
console.log();

// Show the last 50 lines of the output
console.log('📝 Last 50 lines of output:');
console.log('─'.repeat(80));
const lines = result.code.split('\n');
const lastLines = lines.slice(Math.max(0, lines.length - 50));
lastLines.forEach((line, idx) => {
  const lineNum = lines.length - 50 + idx + 1;
  console.log(`${String(lineNum).padStart(4, ' ')} | ${line}`);
});
console.log('─'.repeat(80));
