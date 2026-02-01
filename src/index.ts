/**
 * Main transformer entry point
 * Complete implementation with full AST visitor pattern
 */

import * as ts from 'typescript';
import { factory } from 'typescript';
import { initializeContext } from './factory.js';
import { createElementGenerator } from './generator/element-generator.js';
import { IComponentDeclaration, ITransformContext, TransformerError } from './types.js';
import { getASTPath, getNodePosition, getNodeSnippet, getNodeTypeName } from './utils/ast-utils.js';
import { createComponentWrapper } from './wrapper/component-wrapper.js';

/**
 * Main TypeScript transformer function
 */
export default function pulsarTransformer(program?: ts.Program) {
  return (transformContext: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      // Skip non-TSX/JSX files
      if (!sourceFile.fileName.endsWith('.tsx') && !sourceFile.fileName.endsWith('.jsx')) {
        return sourceFile;
      }

      try {
        // Initialize transform context
        const context = initializeContext(
          sourceFile,
          sourceFile.fileName,
          program?.getTypeChecker(),
          program
        );

        // Create visitor
        const visitor = createVisitor(context);

        // Transform source file
        let result = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

        // Add $REGISTRY import if used
        if (context.requiresRegistry) {
          result = addRegistryImport(result);
        }

        // End debug session
        if (context.debugTracker) {
          const session = context.debugTracker.endSession();

          // Export session if file output requested
          if (context.options.debug && context.debugTracker.options.output.file) {
            const fs = require('fs');
            const format =
              context.debugTracker.options.output.format === 'markdown'
                ? 'text'
                : context.debugTracker.options.output.format;
            const report = context.debugTracker.exportSession(
              session.sessionId,
              format as 'text' | 'json' | 'html'
            );
            fs.writeFileSync(context.debugTracker.options.output.file, report);
          }
        }

        return result;
      } catch (error) {
        // Handle transformer errors
        if (error instanceof TransformerError) {
          console.error(`\n❌ PULSAR TRANSFORMER ERROR`);
          console.error(`File: ${sourceFile.fileName}`);
          console.error(`Code: ${error.code}`);
          console.error(`Message: ${error.message}`);
          console.error(`\nContext:`);
          console.error(JSON.stringify(error.context, null, 2));

          if (error.context.sourceSnippet) {
            console.error(`\nSource:\n${error.context.sourceSnippet}`);
          }
        } else {
          console.error(`\n❌ UNEXPECTED TRANSFORMER ERROR`);
          console.error(`File: ${sourceFile.fileName}`);
          console.error(error);
        }

        // Return original file on error (fail gracefully)
        return sourceFile;
      }
    };
  };
}

/**
 * Create AST visitor for transformation
 */
function createVisitor(context: ITransformContext) {
  const elementGenerator = createElementGenerator(context);
  const componentWrapper = createComponentWrapper(context);

  return function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
    try {
      // Transform JSX elements
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        return transformJsxElement(node, context, elementGenerator);
      }

      // Transform JSX fragments
      if (ts.isJsxFragment(node)) {
        return transformJsxFragment(node, context, elementGenerator);
      }

      // Transform function components
      if (isFunctionComponent(node)) {
        return transformFunctionComponent(node, context, componentWrapper, visitor);
      }

      // Transform arrow function components in variable statements
      if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0];
        if (decl && ts.isIdentifier(decl.name)) {
          const isComponent = isArrowFunctionComponent(decl);
          console.log(
            `[TRANSFORMER] Checking VariableStatement: ${decl.name.text}, isComponent: ${isComponent}`
          );
          if (isComponent) {
            console.log(`[TRANSFORMER] ✅ Transforming component: ${decl.name.text}`);
            return transformArrowFunctionComponentStatement(
              node,
              context,
              componentWrapper,
              visitor
            );
          }
        }
      }

      // Recurse into children
      return ts.visitEachChild(node, visitor, undefined);
    } catch (error) {
      // Create detailed error context
      if (error instanceof TransformerError) {
        throw error;
      }

      const position = getNodePosition(node, context.sourceFile);
      const snippet = getNodeSnippet(node, context.sourceFile);
      const astPath = getASTPath(node);

      throw new TransformerError(
        `Transformation failed: ${error instanceof Error ? error.message : String(error)}`,
        'TRANSFORM_ERROR',
        {
          sourceFile: context.fileName,
          line: position.line,
          column: position.column,
          offset: position.offset,
          sourceSnippet: snippet,
          phase: 'visit',
          nodeType: getNodeTypeName(node),
          nodeKind: node.kind,
          astPath,
          originalCode: node.getText(context.sourceFile),
          sessionId: context.debugTracker?.currentSession || undefined,
        }
      );
    }
  };
}

/**
 * Transform JSX element to Registry Pattern
 */
function transformJsxElement(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  context: ITransformContext,
  generator: ReturnType<typeof createElementGenerator>
): ts.Expression {
  context.jsxDepth++;

  try {
    // Check if this is a component (starts with uppercase) or intrinsic element
    const tagName = ts.isJsxSelfClosingElement(node)
      ? node.tagName.getText()
      : node.openingElement.tagName.getText();

    const isComponent = /^[A-Z]/.test(tagName);

    const generated = isComponent
      ? generator.generateComponent(node)
      : generator.generateElement(node);

    // Mark $REGISTRY as required if we have wires
    if (generated.wires.length > 0) {
      context.requiresRegistry = true;
    }

    // Create IIFE that returns the element
    const statements = [
      ...generated.statements,
      ...generated.wires.map((wire) => createWireStatement(wire)),
      ...generated.events.map((event) => createEventStatement(event)),
      factory.createReturnStatement(factory.createIdentifier(generated.variableName)),
    ];

    return factory.createCallExpression(
      factory.createParenthesizedExpression(
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(statements, true)
        )
      ),
      undefined,
      []
    );
  } finally {
    context.jsxDepth--;
  }
}

/**
 * Transform JSX fragment
 */
function transformJsxFragment(
  node: ts.JsxFragment,
  context: ITransformContext,
  generator: ReturnType<typeof createElementGenerator>
): ts.Expression {
  const generated = generator.generateFragment(node);

  const statements = [
    ...generated.statements,
    factory.createReturnStatement(factory.createIdentifier(generated.variableName)),
  ];

  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(statements, true)
      )
    ),
    undefined,
    []
  );
}

/**
 * Transform function component
 */
function transformFunctionComponent(
  node: ts.FunctionDeclaration,
  context: ITransformContext,
  wrapper: ReturnType<typeof createComponentWrapper>,
  visitor: (node: ts.Node) => ts.VisitResult<ts.Node>
): ts.Statement {
  if (!node.name) return node;

  const componentName = node.name.text;
  context.currentComponent = componentName;

  try {
    // First visit the body to transform any JSX
    const transformedNode = ts.visitEachChild(node, visitor, undefined) as ts.FunctionDeclaration;

    // Extract body statements
    const bodyStatements = transformedNode.body ? Array.from(transformedNode.body.statements) : [];

    // Create component declaration
    const declaration: IComponentDeclaration = {
      name: componentName,
      node: transformedNode,
      parameters: Array.from(transformedNode.parameters),
      returnType: transformedNode.type,
      body: bodyStatements,
    };

    // Wrap in $REGISTRY.execute
    return wrapper.wrapComponent(declaration);
  } finally {
    context.currentComponent = null;
  }
}

/**
 * Transform arrow function component statement (handles export const Foo = ...)
 */
function transformArrowFunctionComponentStatement(
  node: ts.VariableStatement,
  context: ITransformContext,
  wrapper: ReturnType<typeof createComponentWrapper>,
  visitor: (node: ts.Node) => ts.VisitResult<ts.Node>
): ts.Statement {
  const decl = node.declarationList.declarations[0];

  if (!ts.isIdentifier(decl.name)) return node;
  if (!decl.initializer || !ts.isArrowFunction(decl.initializer)) return node;

  const componentName = decl.name.text;
  context.currentComponent = componentName;

  try {
    // Visit arrow function body
    const transformedArrow = ts.visitNode(decl.initializer, visitor) as ts.ArrowFunction;

    // Extract body
    let bodyStatements: ts.Statement[];
    if (ts.isBlock(transformedArrow.body)) {
      bodyStatements = Array.from(transformedArrow.body.statements);
    } else {
      bodyStatements = [factory.createReturnStatement(transformedArrow.body)];
    }

    // Create component declaration
    const declaration: IComponentDeclaration = {
      name: componentName,
      node: decl,
      parameters: Array.from(transformedArrow.parameters),
      returnType: transformedArrow.type,
      body: bodyStatements,
    };

    // Wrap in $REGISTRY.execute and preserve modifiers
    const wrappedDecl = wrapper.wrapComponent(declaration);

    // If the wrapped result is a VariableStatement, add original modifiers
    if (ts.isVariableStatement(wrappedDecl)) {
      return factory.updateVariableStatement(
        wrappedDecl,
        node.modifiers, // Preserve export, etc
        wrappedDecl.declarationList
      );
    }

    return wrappedDecl;
  } finally {
    context.currentComponent = null;
  }
}

/**
 * Transform arrow function component
 */
function transformArrowFunctionComponent(
  node: ts.VariableDeclaration,
  context: ITransformContext,
  wrapper: ReturnType<typeof createComponentWrapper>,
  visitor: (node: ts.Node) => ts.VisitResult<ts.Node>
): ts.Statement {
  if (!ts.isIdentifier(node.name)) return ts.factory.createEmptyStatement();
  if (!node.initializer || !ts.isArrowFunction(node.initializer)) {
    return ts.factory.createEmptyStatement();
  }

  const componentName = node.name.text;
  context.currentComponent = componentName;

  try {
    // Visit arrow function body
    const transformedArrow = ts.visitNode(node.initializer, visitor) as ts.ArrowFunction;

    // Extract body
    let bodyStatements: ts.Statement[];
    if (ts.isBlock(transformedArrow.body)) {
      bodyStatements = Array.from(transformedArrow.body.statements);
    } else {
      bodyStatements = [factory.createReturnStatement(transformedArrow.body)];
    }

    // Create component declaration
    const declaration: IComponentDeclaration = {
      name: componentName,
      node,
      parameters: Array.from(transformedArrow.parameters),
      returnType: transformedArrow.type,
      body: bodyStatements,
    };

    // Wrap in $REGISTRY.execute
    return wrapper.wrapComponent(declaration);
  } finally {
    context.currentComponent = null;
  }
}

/**
 * Check if node is a function component
 */
function isFunctionComponent(node: ts.Node): node is ts.FunctionDeclaration {
  if (!ts.isFunctionDeclaration(node)) return false;
  if (!node.name) return false;
  if (!node.body) return false;

  // Component names must start with uppercase
  if (!/^[A-Z]/.test(node.name.text)) return false;

  // Must return JSX
  return hasJsxReturn(node.body);
}

/**
 * Check if node is an arrow function component
 */
function isArrowFunctionComponent(node: ts.Node): node is ts.VariableDeclaration {
  if (!ts.isVariableDeclaration(node)) return false;
  if (!ts.isIdentifier(node.name)) return false;
  if (!node.initializer) return false;

  const isArrow = ts.isArrowFunction(node.initializer);
  console.log(`[isArrowFunctionComponent] ${node.name.text}: isArrow=${isArrow}`);
  if (!isArrow) return false;

  // Component names must start with uppercase
  const hasUppercase = /^[A-Z]/.test(node.name.text);
  console.log(`[isArrowFunctionComponent] ${node.name.text}: hasUppercase=${hasUppercase}`);
  if (!hasUppercase) return false;

  // Must return JSX
  const body = node.initializer.body;
  let hasJsx = false;
  if (ts.isBlock(body)) {
    hasJsx = hasJsxReturn(body);
  } else {
    hasJsx = isJsxExpression(body);
  }
  console.log(`[isArrowFunctionComponent] ${node.name.text}: hasJsx=${hasJsx}`);
  return hasJsx;
}

/**
 * Check if block has JSX return statement
 */
function hasJsxReturn(block: ts.Block): boolean {
  let hasJsx = false;

  function visit(node: ts.Node): void {
    if (hasJsx) return;

    if (ts.isReturnStatement(node) && node.expression) {
      console.log(
        `[hasJsxReturn] Found return statement, kind: ${node.expression.kind}, text: ${node.expression.getText().substring(0, 100)}`
      );
      if (isJsxExpression(node.expression)) {
        hasJsx = true;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(block);
  return hasJsx;
}

/**
 * Check if expression is JSX (handles parenthesized expressions)
 */
function isJsxExpression(expr: ts.Expression): boolean {
  // Unwrap parenthesized expressions like: return (<div>...</div>)
  let unwrapped = expr;
  while (ts.isParenthesizedExpression(unwrapped)) {
    unwrapped = unwrapped.expression;
  }

  return (
    ts.isJsxElement(unwrapped) ||
    ts.isJsxSelfClosingElement(unwrapped) ||
    ts.isJsxFragment(unwrapped)
  );
}

/**
 * Create wire statement
 */
function createWireStatement(wire: any): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('$REGISTRY'),
        factory.createIdentifier('wire')
      ),
      undefined,
      [
        factory.createIdentifier(wire.element),
        factory.createStringLiteral(wire.property),
        wire.getter,
      ]
    )
  );
}

/**
 * Create event listener statement
 */
function createEventStatement(event: any): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(event.element),
        factory.createIdentifier('addEventListener')
      ),
      undefined,
      [factory.createStringLiteral(event.eventName), event.handler]
    )
  );
}

/**
 * Add $REGISTRY import to source file if not already present
 */
function addRegistryImport(sourceFile: ts.SourceFile): ts.SourceFile {
  // Check if $REGISTRY import already exists
  const hasRegistryImport = sourceFile.statements.some(
    (stmt) =>
      ts.isImportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.moduleSpecifier.text === '@pulsar-framework/pulsar.dev' &&
      stmt.importClause?.namedBindings &&
      ts.isNamedImports(stmt.importClause.namedBindings) &&
      stmt.importClause.namedBindings.elements.some((el) => el.name.text === '$REGISTRY')
  );

  if (hasRegistryImport) {
    return sourceFile;
  }

  // Create import statement: import { $REGISTRY } from '@pulsar-framework/pulsar.dev';
  const registryImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('$REGISTRY')),
      ])
    ),
    factory.createStringLiteral('@pulsar-framework/pulsar.dev'),
    undefined
  );

  // Add import at the beginning
  const statements = [registryImport, ...sourceFile.statements];

  return factory.updateSourceFile(sourceFile, statements);
}

/**
 * Export types and factory
 */
export { initializeContext, transformerFactory } from './factory.js';
export * from './types.js';
