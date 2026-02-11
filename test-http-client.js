/**
 * Test HTTP target with transformer
 * Requires test-http-server.js running
 */

// MUST import main index to trigger init-tracing
import './dist/index.js';
import { createLexer } from './dist/lexer/index.js';
import { createParser } from './dist/parser/index.js';

console.log('🧪 Testing HTTP Target Integration\n');
console.log('Environment:');
console.log('  PULSAR_TRACE:', process.env.PULSAR_TRACE);
console.log('  PULSAR_TRACE_HTTP:', process.env.PULSAR_TRACE_HTTP);
console.log('  PULSAR_TRACE_CHANNELS:', process.env.PULSAR_TRACE_CHANNELS);
console.log('');

// Give server a moment to receive events
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTransformation() {
  console.log('📝 Running transformation...');

  const source = `export const Test = () => { return <div>Hello</div>; };`;

  const lexer = createLexer(source);
  const tokens = lexer.scanTokens();

  const parser = createParser(tokens);
  const ast = parser.parse();

  console.log(`✅ Transformation complete: ${tokens.length} tokens, ${ast.body.length} statements`);
  console.log('');
  console.log('Check the server terminal for received events!');

  // Wait for server to receive
  await wait(2000);

  console.log('\n🎉 Test complete!');
  console.log('If you see events in the server terminal, HTTP target is working!');
  process.exit(0);
}

testTransformation().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
