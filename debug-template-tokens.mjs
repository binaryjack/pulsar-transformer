import { createParser } from './dist/index.js';

async function debugTemplateLiteralTokenization() {
  try {
    // Test just the problematic template literal
    const testSource = 'const result = `${parts[0][0]}${parts[parts.length - 1][0]}`;';

    console.log('=== TESTING TEMPLATE LITERAL TOKENIZATION ===');
    console.log('Source:', testSource);

    const parser = createParser();
    const ast = parser.parse(testSource);

    console.log('\n=== AST RESULT ===');
    console.log(JSON.stringify(ast, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Position:', err.position);
    console.error('Stack:', err.stack);
  }
}

debugTemplateLiteralTokenization();
