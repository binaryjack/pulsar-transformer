import { readFileSync } from 'fs';
import { join } from 'path';
import { createLexer } from './src/lexer/index.js';
import { createParser } from './src/parser/index.js';
import { createTransformer } from './src/transformer/index.js';

const fixturePath = join(process.cwd(), 'tests/fixtures/real-psr/02-badge.psr');
const source = readFileSync(fixturePath, 'utf-8');

const lexer = createLexer(source, 'badge.psr');
const tokens = lexer.scanTokens();

const parser = createParser(tokens, 'badge.psr');
const ast = parser.parse();

console.log('\n=== Original AST ===');
ast.body.forEach((node, i) => {
  console.log(`${i}: ${node.type}`, node.type === 'ExportNamedDeclaration' ? 
    `-> ${node.declaration?.type}` : '');
});

const transformer = createTransformer(ast, { sourceFile: 'badge.psr' });
const result = transformer.transform();

console.log('\n=== Transformed AST ===');
result.ast.body.forEach((node, i) => {
  console.log(`${i}: ${node.type}`, node.type === 'ExportNamedDeclaration' ? 
    `-> ${node.declaration?.type}` : '');
  if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
    const varDecl = node.declaration;
    const init = varDecl.declarations[0].init;
    console.log('  Init type:', init.type);
    if (init.type === 'ArrowFunctionExpression') {
      console.log('  Body type:', init.body.type);
      if (init.body.type === 'BlockStatement') {
        init.body.body.forEach((stmt, j) => {
          console.log(`    ${j}: ${stmt.type}`);
        });
      }
    }
  }
});
