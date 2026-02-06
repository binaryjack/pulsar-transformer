import { createParser } from './packages/pulsar-transformer/dist/index.js';

// Test simplified avatar component
const code = `
component Avatar({
  size = 'md',
  src
}) {
  return <div className="avatar">{src}</div>;
}
`;

console.log('🧪 Testing simplified Avatar component\n');
console.log('Input code:');
console.log(code);
console.log('\n' + '='.repeat(60) + '\n');

try {
  const parser = createParser(code, 'test.psr');
  const ast = parser.parse();

  if (parser.diagnostics.length > 0) {
    console.log('❌ PARSE ERRORS:');
    parser.diagnostics.forEach((diag, i) => {
      console.log(`\n${i + 1}. ${diag.message}`);
      if (diag.position) {
        const start = diag.position.start;
        const end = diag.position.end;
        console.log(`   Position: ${start} - ${end}`);
        console.log(
          `   Context: "${code.substring(Math.max(0, start - 20), Math.min(code.length, end + 20))}"`
        );
      }
    });
  } else {
    console.log('✅ Parse SUCCESS');
    console.log('AST:', JSON.stringify(ast, null, 2).substring(0, 500) + '...');
  }
} catch (error) {
  console.error('\n💥 EXCEPTION:', error.message);
  console.error(error.stack);
}
