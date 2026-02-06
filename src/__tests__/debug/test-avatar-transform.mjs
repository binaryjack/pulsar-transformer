import { readFileSync } from 'fs';
import { resolve } from 'path';
import { transformPsrFile } from './packages/pulsar-transformer/dist/index.js';

const avatarPath = resolve('./packages/pulsar-ui.dev/src/components/atoms/avatar/avatar.psr');
const code = readFileSync(avatarPath, 'utf-8');

console.log('🧪 Testing Avatar.psr transformation\n');
console.log('Input file:', avatarPath);
console.log('Input length:', code.length, 'characters\n');

try {
  const result = transformPsrFile(code, avatarPath);

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('❌ Parse ERRORS:');
    result.diagnostics.forEach((diag, i) => {
      console.log(`\n${i + 1}. ${diag.message}`);
      if (diag.position) {
        console.log(`   Position: ${diag.position.start} - ${diag.position.end}`);
        console.log(
          `   Context: "${code.substring(diag.position.start - 20, diag.position.end + 20)}"`
        );
      }
    });
  }

  if (result.code) {
    console.log('\n✅ Transformation SUCCESS');
    console.log('Output length:', result.code.length, 'characters');
  } else {
    console.log('\n❌ No code generated');
  }
} catch (error) {
  console.error('\n💥 EXCEPTION:', error.message);
  console.error(error.stack);
}
