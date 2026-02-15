import fs from 'fs';
import path from 'path';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generator from '@babel/generator';
import * as t from '@babel/types';

// ESM Interop
const traverse = _traverse.default || _traverse;
const generator = _generator.default || _generator;

const filePath = path.resolve('../pulsar-ui.dev/src/main.psr');
const source = fs.readFileSync(filePath, 'utf-8');

console.log('Processing:', filePath);

// 1. Pre-process
let preprocessed = source
  .replace(/export\s+component\s+([A-Z]\w*)/g, 'export function $1')
  .replace(/component\s+([A-Z]\w*)/g, 'function $1');

// 2. Parse
const ast = parser.parse(preprocessed, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
});

// 3. Transform Visitor
const jsxVisitor = {
  JSXElement: {
    exit(path) {
      const { openingElement, children } = path.node;
      console.log('Visiting JSXElement:', openingElement.name.name || 'member');
      // Tag Name
      let tagExpr;
      if (t.isJSXIdentifier(openingElement.name)) {
        const name = openingElement.name.name;
        if (/^[A-Z]/.test(name)) {
          tagExpr = t.identifier(name);
        } else {
          tagExpr = t.stringLiteral(name);
        }
      } else if (t.isJSXMemberExpression(openingElement.name)) {
        // Simplified for debug
        tagExpr = t.identifier('MemberExpr');
      } else {
        tagExpr = t.identifier('UnknownTag');
      }

      const args = [tagExpr, t.objectExpression([])]; // Mock props

      if (t.isStringLiteral(tagExpr)) {
        path.replaceWith(t.callExpression(t.identifier('t_element'), args));
      } else {
        path.replaceWith(t.callExpression(tagExpr, [t.objectExpression([])]));
      }
    },
  },
};

// @ts-ignore
traverse(ast, jsxVisitor);

// 4. Generate
// @ts-ignore
const result = generator(ast, {}, preprocessed);

console.log('--- Result Code Snippet ---');
console.log(
  result.code.substring(result.code.indexOf('return'), result.code.indexOf('return') + 500)
);
