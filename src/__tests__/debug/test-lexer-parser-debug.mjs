#!/usr/bin/env node
import { createLexer, createParser } from './packages/pulsar-transformer/dist/index.js';

const code = `component MyComponent() {
  return <div style={\`padding: 1rem;\`}>Test</div>;
}`;

console.log('Testing lexer and parser for template literal in attribute\n');
console.log('Code:', code);
console.log('\n--- LEXER ---\n');

try {
  const lexer = createLexer();
  const tokens = lexer.tokenize(code);
  console.log(`Generated ${tokens.length} tokens:`);
  tokens.forEach((t, i) => {
    console.log(`  ${i}: ${t.type.padEnd(20)} | "${t.value}" at ${t.line}:${t.column}`);
  });
} catch (err) {
  console.log('Lexer error:', err.message);
}

console.log('\n--- PARSER ---\n');

try {
  const parser = createParser();
  const ast = parser.parse(code);
  console.log('AST generated:');
  console.log(JSON.stringify(ast, null, 2));
} catch (err) {
  console.log('Parser error:', err.message);
  console.log(err.stack);
}
