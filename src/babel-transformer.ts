import * as _generator from '@babel/generator';
import parser from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import { preprocessComponentKeywordSafe } from './preprocessor/component-keyword-transform.js';
import { IDiagnostic, IPipelineOptions, IPipelineResult } from './types.js';

// ESM Interop
// @ts-ignore
const traverse = _traverse.default?.default || _traverse.default || _traverse;
// @ts-ignore
const generator = _generator.default?.default || _generator.default || _generator;

export async function transformWithBabel(
  source: string,
  options: IPipelineOptions
): Promise<IPipelineResult> {
  const startTime = performance.now();
  const diagnostics: IDiagnostic[] = [];

  try {
    // 1. Pre-process: Transform 'component' keyword to 'function'
    // Uses AST-aware preprocessor to avoid transforming inside strings/comments
    const preprocessed = preprocessComponentKeywordSafe(source);

    // 2. Parse
    // @ts-ignore
    const ast = parser.parse(preprocessed, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    // 3. Transform Visitor
    const jsxVisitor = {
      Program: {
        exit(path: any) {
          // Ensure @pulsar-framework/pulsar.dev imports exist
          let hasPulsarDevImport = false;
          path.node.body.forEach((node: any) => {
            if (
              t.isImportDeclaration(node) &&
              node.source.value === '@pulsar-framework/pulsar.dev'
            ) {
              hasPulsarDevImport = true;
              // Ensure component import
              const hasComponent = node.specifiers.some(
                (s: any) => t.isImportSpecifier(s) && (s.imported as any).name === 'component'
              );
              if (!hasComponent) {
                node.specifiers.push(
                  t.importSpecifier(t.identifier('component'), t.identifier('component'))
                );
              }
              // Ensure t_element import
              const hasTElement = node.specifiers.some(
                (s: any) => t.isImportSpecifier(s) && (s.imported as any).name === 't_element'
              );
              if (!hasTElement) {
                node.specifiers.push(
                  t.importSpecifier(t.identifier('t_element'), t.identifier('t_element'))
                );
              }
            }
          });

          if (!hasPulsarDevImport) {
            const importDecl = t.importDeclaration(
              [
                t.importSpecifier(t.identifier('component'), t.identifier('component')),
                t.importSpecifier(t.identifier('t_element'), t.identifier('t_element')),
              ],
              t.stringLiteral('@pulsar-framework/pulsar.dev')
            );
            path.node.body.unshift(importDecl);
          }
        },
      },
      JSXElement: {
        exit(path: any) {
          const { openingElement, children } = path.node;
          // ...

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
          const propsProps: any[] = [];
          openingElement.attributes.forEach((attr: any) => {
            if (t.isJSXAttribute(attr)) {
              const name = attr.name.name; // Simple Identifier
              let value: any = t.booleanLiteral(true);
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
            .map((c: any) => {
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
        exit(path: any) {
          const children = path.node.children
            .map((c: any) => {
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
      FunctionDeclaration(path: any) {
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
          // path.skip(); // Don't skip! We need to visit the JSX inside the new structure
        }
      },
    };

    function convertJSXMemberExpression(node: any): any {
      if (t.isJSXIdentifier(node)) return t.identifier(node.name);
      if (t.isJSXMemberExpression(node)) {
        return t.memberExpression(
          convertJSXMemberExpression(node.object),
          t.identifier(node.property.name)
        );
      }
      return node;
    }

    // @ts-ignore
    traverse(ast, jsxVisitor);

    // 4. Generate
    // @ts-ignore
    const result = generator(ast, {}, preprocessed);

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      code: result.code,
      diagnostics,
      metrics: {
        lexerTime: 0,
        parserTime: 0,
        transformTime: duration,
        totalTime: duration,
        tokenCount: 0,
        statementCount: ast.program.body.length,
        outputSize: result.code.length,
      },
    };
  } catch (err: any) {
    if (err.loc) {
      diagnostics.push({
        type: 'error',
        phase: 'babel-parser',
        message: err.message, // + ' (' + err.code + ')',
        line: err.loc.line,
        // @ts-ignore
        column: err.loc.column,
        // @ts-ignore
        source: source,
      });
    } else {
      diagnostics.push({
        type: 'error',
        phase: 'babel-transformer',
        message: err.message,
        // @ts-ignore
        source: source,
      });
    }

    return {
      code: '', // return empty code on error
      diagnostics,
      // @ts-ignore
      metrics: {
        lexerTime: 0,
        parserTime: 0,
        transformTime: 0,
        totalTime: 0,
      },
    };
  }
}
