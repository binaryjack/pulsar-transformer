import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generator from '@babel/generator';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

const traverse = _traverse.default || _traverse;
const generator = _generator.default || _generator;

const filePath = path.resolve('../pulsar-ui.dev/src/showcase/pages/about.psr');
console.log('Reading file:', filePath);
const code = fs.readFileSync(filePath, 'utf-8');

console.log('--- Original Code ---');
console.log(code.substring(0, 200) + '...');

// 1. Pre-process: Handle 'component' keyword
// Strategy: Replace 'component' with 'function' (or similar) to make it valid JS/TS.
// We'll rely on AST traversal to find and transform it back to `component(...)`.
let preprocessed = code
  // export component Name -> export function Name
  .replace(/export\s+component\s+([A-Z]\w*)/g, 'export function $1')
  // component Name -> function Name
  .replace(/component\s+([A-Z]\w*)/g, 'function $1');

console.log('\n--- Preprocessed Code (Snippet) ---');
console.log(preprocessed.substring(0, 200) + '...');

try {
  // 2. Parse
  const ast = parser.parse(preprocessed, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  // 3. Transform Visitor
  const outputCode = transform(ast);

  console.log('\n--- Transformed Code ---');
  console.log(outputCode);
} catch (err) {
  console.error('Babel Error:', err);
}

function transform(ast) {
  const jsxVisitor = {
    JSXElement: {
      exit(path) {
        const { openingElement, children } = path.node;

        // Tag Name
        let tagExpr;
        if (t.isJSXIdentifier(openingElement.name)) {
          const name = openingElement.name.name;
          if (/^[A-Z]/.test(name)) {
            tagExpr = t.identifier(name); // Component
          } else {
            tagExpr = t.stringLiteral(name); // HTML tag
          }
        } else if (t.isJSXMemberExpression(openingElement.name)) {
          tagExpr = convertJSXMemberExpression(openingElement.name);
        } else {
          // Fallback for expression container etc
          tagExpr = t.identifier('UnknownTag');
        }

        // Props
        const propsProps = [];
        openingElement.attributes.forEach((attr) => {
          if (t.isJSXAttribute(attr)) {
            const name = attr.name.name; // Simple Identifier
            let value = t.booleanLiteral(true);
            if (attr.value) {
              if (t.isStringLiteral(attr.value)) value = attr.value;
              else if (t.isJSXExpressionContainer(attr.value)) value = attr.value.expression;
              else if (t.isJSXElement(attr.value)) value = attr.value;
            }
            // key as identifier if valid, else string literal
            const keyStr = typeof name === 'string' ? name : name.name; // handle namespace if needed
            const key = t.isValidIdentifier(keyStr)
              ? t.identifier(keyStr)
              : t.stringLiteral(keyStr);
            propsProps.push(t.objectProperty(key, value));
          } else if (t.isJSXSpreadAttribute(attr)) {
            propsProps.push(t.spreadElement(attr.argument));
          }
        });
        const propsObj = t.objectExpression(propsProps);

        // Children
        const args = [tagExpr, propsObj];

        const transformedChildren = children
          .map((c) => {
            if (t.isJSXText(c)) {
              const txt = c.value;
              // Only keep if non-empty (after trim) or meaningful whitespace
              // For now, keep as is but check if empty
              if (!txt.trim()) return null;
              return t.stringLiteral(Number(txt) ? txt.trim() : txt); // Rough trimming logic
            }
            if (t.isJSXExpressionContainer(c)) {
              if (t.isJSXEmptyExpression(c.expression)) return null;
              return c.expression;
            }
            return c;
          })
          .filter(Boolean);

        // Component Children vs HTML Children
        // HTML: t_element('div', props, [children])
        // Component: Comp({ ...props, children: [children] })

        if (t.isStringLiteral(tagExpr)) {
          if (transformedChildren.length > 0) {
            args.push(t.arrayExpression(transformedChildren));
          }
          path.replaceWith(t.callExpression(t.identifier('t_element'), args));
        } else {
          if (transformedChildren.length > 0) {
            propsProps.push(
              t.objectProperty(t.identifier('children'), t.arrayExpression(transformedChildren))
            );
          }
          path.replaceWith(t.callExpression(tagExpr, [propsObj]));
        }
      },
    },
    JSXFragment: {
      exit(path) {
        const children = path.node.children
          .map((c) => {
            if (t.isJSXText(c)) {
              if (!c.value.trim()) return null;
              return t.stringLiteral(c.value);
            }
            if (t.isJSXExpressionContainer(c)) return c.expression;
            return c;
          })
          .filter(Boolean);
        path.replaceWith(t.arrayExpression(children));
      },
    },

    // Transform: export function Foo() -> export const Foo = component(() => { ... })
    FunctionDeclaration(path) {
      const { id, params, body, async } = path.node;
      // Heuristic: PascalCase function implies Component in this context (after replacement)
      if (id && /^[A-Z]/.test(id.name)) {
        // Generate arrow function for body
        const arrow = t.arrowFunctionExpression(params, body, async);
        // Wrap in component()
        const compCall = t.callExpression(t.identifier('component'), [arrow]);
        // const Foo = ...
        const varDecl = t.variableDeclaration('const', [t.variableDeclarator(id, compCall)]);

        // Check parent export
        if (t.isExportNamedDeclaration(path.parent)) {
          path.parentPath.replaceWith(t.exportNamedDeclaration(varDecl));
        } else {
          path.replaceWith(varDecl);
        }
        path.skip(); // Don't visit the new nodes recursively immediately
      }
    },

    // Fix missing t_element import
    Program: {
      exit(path) {
        // Check if t_element imported? Add if missing.
        // Simplified: Just log that we transformed.
      },
    },
  };

  function convertJSXMemberExpression(node) {
    if (t.isJSXIdentifier(node)) return t.identifier(node.name);
    if (t.isJSXMemberExpression(node)) {
      return t.memberExpression(
        convertJSXMemberExpression(node.object),
        t.identifier(node.property.name)
      );
    }
    return node;
  }

  traverse(ast, jsxVisitor);
  return generator(ast, {}, preprocessed).code;
}
