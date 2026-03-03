/**
 * Babel-to-PSR AST Adapter
 *
 * Converts a Babel-parsed AST into the minimal IProgramNode shape that
 * the SemanticAnalyzer expects.  Only the nodes the SemanticAnalyzer
 * actually visits need to be mapped; everything else falls back to a
 * passthrough node so the analyser walks safely without crashing.
 *
 * Lifecycle in the pipeline:
 *   Babel.parse()  →  adaptBabelAst()  →  SemanticAnalyzer.analyze()
 *                                        → diagnostics merged into pipeline
 */

import type * as BabelTypes from '@babel/types';
import type {
  IASTNode,
  IBlockStatement,
  ICallExpression,
  IComponentDeclaration,
  IExpression,
  IFunctionDeclaration,
  IIdentifier,
  IJSXAttribute,
  IJSXElement,
  ILiteral,
  IProgramNode,
  IStatementNode,
  IVariableDeclaration,
} from './ast.types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const loc = (node: BabelTypes.Node) =>
  node.loc
    ? {
        start: { line: node.loc.start.line, column: node.loc.start.column, offset: 0 },
        end: { line: node.loc.end.line, column: node.loc.end.column, offset: 0 },
      }
    : undefined;

const passthrough = (node: BabelTypes.Node): IASTNode => ({
  type: node.type as unknown as IASTNode['type'],
  loc: loc(node),
});

// ---------------------------------------------------------------------------
// Expression adapters
// ---------------------------------------------------------------------------

function adaptExpression(node: BabelTypes.Expression | null | undefined): IExpression {
  if (!node) return { type: 'Identifier', name: '__null__', loc: undefined } as IIdentifier;

  switch (node.type) {
    case 'Identifier':
      return { type: 'Identifier', name: node.name, loc: loc(node) } as IIdentifier;

    case 'CallExpression': {
      const callee = node.callee as BabelTypes.Expression;
      return {
        type: 'CallExpression',
        callee: adaptExpression(callee),
        arguments: node.arguments.map((a) => adaptExpression(a as BabelTypes.Expression)),
        loc: loc(node),
      } as ICallExpression;
    }

    case 'JSXElement': {
      const opening = node.openingElement;
      const attrs: IJSXAttribute[] = opening.attributes
        .filter((a): a is BabelTypes.JSXAttribute => a.type === 'JSXAttribute')
        .map((a) => ({
          type: 'JSXAttribute' as const,
          name: {
            type: 'JSXIdentifier' as const,
            name: typeof a.name === 'string' ? a.name : (a.name as any).name,
            loc: loc(a),
          },
          value: a.value
            ? (adaptExpression(
                a.value.type === 'JSXExpressionContainer'
                  ? (a.value.expression as BabelTypes.Expression)
                  : null
              ) as unknown as ILiteral)
            : undefined,
          loc: loc(a),
        }));

      return {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: {
            type: 'JSXIdentifier',
            name:
              opening.name.type === 'JSXIdentifier'
                ? opening.name.name
                : (opening.name as any).name,
            loc: loc(opening),
          },
          attributes: attrs,
          selfClosing: opening.selfClosing,
          loc: loc(opening),
        },
        closingElement: node.closingElement
          ? {
              type: 'JSXClosingElement',
              name: {
                type: 'JSXIdentifier',
                name:
                  node.closingElement.name.type === 'JSXIdentifier'
                    ? node.closingElement.name.name
                    : (node.closingElement.name as any).name,
                loc: loc(node.closingElement),
              },
              loc: loc(node.closingElement),
            }
          : null,
        children: node.children
          .filter((c): c is BabelTypes.JSXElement => c.type === 'JSXElement')
          .map((c) => adaptExpression(c) as IJSXElement),
        loc: loc(node),
      } as IJSXElement;
    }

    default:
      return passthrough(node) as unknown as IExpression;
  }
}

// ---------------------------------------------------------------------------
// Block statement adapter
// ---------------------------------------------------------------------------

function adaptBlock(node: BabelTypes.BlockStatement): IBlockStatement {
  return {
    type: 'BlockStatement',
    body: node.body.map(adaptStatement),
    loc: loc(node),
  };
}

// ---------------------------------------------------------------------------
// Statement adapters
// ---------------------------------------------------------------------------

function adaptStatement(node: BabelTypes.Statement): IStatementNode {
  switch (node.type) {
    case 'FunctionDeclaration': {
      // After PSR preprocessing, `component Foo()` becomes `function Foo()`
      // We expose it as both FunctionDeclaration and ComponentDeclaration so
      // the analyser's component-specific rules fire on PascalCase functions.
      const id: IIdentifier = {
        type: 'Identifier',
        name: node.id?.name ?? '__anonymous__',
        loc: node.id ? loc(node.id) : undefined,
      };
      const params: IIdentifier[] = node.params
        .filter((p): p is BabelTypes.Identifier => p.type === 'Identifier')
        .map((p) => ({ type: 'Identifier', name: p.name, loc: loc(p) }));

      const isPascalCase = /^[A-Z]/.test(id.name);

      if (isPascalCase) {
        return {
          type: 'ComponentDeclaration',
          id,
          params,
          body: adaptBlock(node.body),
          exported: false,
          loc: loc(node),
        } as IComponentDeclaration;
      }

      return {
        type: 'FunctionDeclaration',
        id,
        params,
        body: adaptBlock(node.body),
        exported: false,
        loc: loc(node),
      } as IFunctionDeclaration;
    }

    case 'ExportNamedDeclaration': {
      if (!node.declaration) return passthrough(node) as unknown as IStatementNode;

      const inner = adaptStatement(node.declaration);
      // Mark the inner declaration as exported
      (inner as any).exported = true;
      return inner;
    }

    case 'ExportDefaultDeclaration': {
      if (node.declaration.type === 'FunctionDeclaration') {
        const inner = adaptStatement(node.declaration as BabelTypes.Statement);
        (inner as any).exported = true;
        return inner;
      }
      return passthrough(node) as unknown as IStatementNode;
    }

    case 'VariableDeclaration': {
      return {
        type: 'VariableDeclaration',
        kind: node.kind as 'const' | 'let' | 'var',
        declarations: node.declarations.map((d) => ({
          type: 'VariableDeclarator',
          id:
            d.id.type === 'Identifier'
              ? ({ type: 'Identifier', name: d.id.name, loc: loc(d.id) } as IIdentifier)
              : passthrough(d.id as BabelTypes.Node),
          init: d.init ? adaptExpression(d.init) : null,
          loc: loc(d),
        })),
        loc: loc(node),
      } as IVariableDeclaration;
    }

    default:
      return passthrough(node) as unknown as IStatementNode;
  }
}

// ---------------------------------------------------------------------------
// Public adapter
// ---------------------------------------------------------------------------

/**
 * Convert a Babel-parsed `File` (or `Program`) node into the minimal
 * `IProgramNode` shape consumed by Pulsar's SemanticAnalyzer.
 */
export function adaptBabelAst(babelFile: BabelTypes.File): IProgramNode {
  return {
    type: 'Program',
    sourceType: babelFile.program.sourceType as 'module' | 'script',
    body: babelFile.program.body.map(adaptStatement),
    loc: loc(babelFile.program),
  };
}
