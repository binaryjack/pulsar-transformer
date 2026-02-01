/**
 * Signal detector - Tracks imports and identifies signal getters
 * Complete implementation with full symbol resolution
 */

import * as ts from 'typescript';
import { ITransformContext, ImportInfo } from '../types.js';

/**
 * Known signal-creating functions from Pulsar framework
 */
const SIGNAL_CREATORS = new Set([
  'useState',
  'createSignal',
  'createMemo',
  'createComputed',
  'createResource',
  'createEffect',
]);

/**
 * Known Pulsar framework modules
 */
const PULSAR_MODULES = new Set([
  'pulsar.dev',
  '@pulsar-framework/ui',
  '@pulsar-framework/core',
  '@pulsar-framework/reactivity',
  '@pulsar/core', // Shorthand
  '@pulsar/ui',
  '@pulsar/reactivity',
]);

/**
 * Detect all signals in source file
 * Scans imports and variable declarations
 */
export function detectSignals(sourceFile: ts.SourceFile, context: ITransformContext): void {
  // Phase 1: Scan imports
  sourceFile.statements.forEach((statement) => {
    if (ts.isImportDeclaration(statement)) {
      processImportDeclaration(statement, context);
    }
  });

  // Phase 2: Scan variable declarations for signal usage
  sourceFile.statements.forEach((statement) => {
    scanForSignalDeclarations(statement, context);
  });
}

/**
 * Process import declaration to find signal creators
 */
function processImportDeclaration(node: ts.ImportDeclaration, context: ITransformContext): void {
  // Get module specifier
  const moduleSpecifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(moduleSpecifier)) return;

  const moduleName = moduleSpecifier.text;

  // Check if this is a Pulsar module
  if (!isPulsarModule(moduleName)) return;

  // Process import clause
  const importClause = node.importClause;
  if (!importClause) return;

  // Named imports: import { useState } from 'pulsar.dev'
  if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    importClause.namedBindings.elements.forEach((element) => {
      const importName = element.name.text;
      const propertyName = element.propertyName?.text || importName;

      if (SIGNAL_CREATORS.has(propertyName)) {
        const importInfo: ImportInfo = {
          moduleName,
          symbolName: importName,
          importType: 'named',
          node,
        };

        context.signalImports.set(importName, importInfo);

        if (context.debugTracker) {
          const tracker = context.debugTracker as any;
          if (tracker.options?.enabled && tracker.options?.channels?.detector) {
            console.log(`[DETECTOR] Tracked import: ${importName} from ${moduleName}`);
          }
        }
      }
    });
  }

  // Default import: import React from 'pulsar.dev'
  if (importClause.name) {
    const importName = importClause.name.text;
    const importInfo: ImportInfo = {
      moduleName,
      symbolName: importName,
      importType: 'default',
      node,
    };

    context.signalImports.set(importName, importInfo);
  }

  // Namespace import: import * as Pulsar from 'pulsar.dev'
  if (importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
    const importName = importClause.namedBindings.name.text;
    const importInfo: ImportInfo = {
      moduleName,
      symbolName: importName,
      importType: 'namespace',
      node,
    };

    context.signalImports.set(importName, importInfo);
  }
}

/**
 * Check if module is a Pulsar framework module
 */
function isPulsarModule(moduleName: string): boolean {
  return PULSAR_MODULES.has(moduleName) || moduleName.startsWith('@pulsar-framework/');
}

/**
 * Scan statements for signal declarations
 */
function scanForSignalDeclarations(statement: ts.Statement, context: ITransformContext): void {
  if (ts.isVariableStatement(statement)) {
    statement.declarationList.declarations.forEach((declaration) => {
      processVariableDeclaration(declaration, context);
    });
  }

  // Recurse into nested statements (if, for, while, etc.)
  ts.forEachChild(statement, (node) => {
    if (ts.isStatement(node)) {
      scanForSignalDeclarations(node, context);
    }
  });
}

/**
 * Process variable declaration to find signal getters
 */
function processVariableDeclaration(
  declaration: ts.VariableDeclaration,
  context: ITransformContext
): void {
  // Pattern: const [getter, setter] = useState(0)
  if (!ts.isArrayBindingPattern(declaration.name)) return;
  if (!declaration.initializer) return;
  if (!ts.isCallExpression(declaration.initializer)) return;

  const callExpr = declaration.initializer;
  const callee = getCalleeName(callExpr);

  // Check if this is a signal creator call
  if (!callee || !isSignalCreator(callee, context)) return;

  // First element in destructuring is the getter
  const bindings = declaration.name.elements;
  if (bindings.length < 1) return;

  const firstBinding = bindings[0];
  if (!ts.isBindingElement(firstBinding)) return;

  const getterName = firstBinding.name;
  if (!ts.isIdentifier(getterName)) return;

  // Get symbol for the getter (requires typeChecker)
  if (!context.typeChecker) return;
  const symbol = context.typeChecker.getSymbolAtLocation(getterName);
  if (!symbol) return;

  // Track this symbol as a signal getter
  context.signalGetters.add(symbol);

  if (context.debugTracker) {
    const tracker = context.debugTracker as any;
    if (tracker.options?.enabled && tracker.options?.channels?.detector) {
      console.log(`[DETECTOR] Found signal getter: ${getterName.text} from ${callee}`);
    }
  }
}

/**
 * Get callee name from call expression
 */
function getCalleeName(callExpr: ts.CallExpression): string | null {
  const expr = callExpr.expression;

  // Simple identifier: useState()
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }

  // Property access: React.useState()
  if (ts.isPropertyAccessExpression(expr)) {
    return expr.name.text;
  }

  return null;
}

/**
 * Check if function name is a signal creator
 */
function isSignalCreator(name: string, context: ITransformContext): boolean {
  // Direct match with known creators
  if (SIGNAL_CREATORS.has(name)) return true;

  // Check if it's from a tracked import
  return context.signalImports.has(name);
}

/**
 * Check if identifier refers to a signal getter
 */
export function isSignalGetter(identifier: ts.Identifier, context: ITransformContext): boolean {
  if (!context.typeChecker) return false;
  const symbol = context.typeChecker.getSymbolAtLocation(identifier);
  return symbol ? context.signalGetters.has(symbol) : false;
}

/**
 * Check if expression contains signal calls
 */
export function hasSignalCalls(expression: ts.Expression, context: ITransformContext): boolean {
  let hasSignal = false;

  function visit(node: ts.Node): void {
    if (hasSignal) return;

    // Check for signal call: identifier()
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        // First try symbol-based detection
        if (isSignalGetter(node.expression, context)) {
          hasSignal = true;
          return;
        }

        // Fallback: heuristic pattern matching for signal-like calls
        // Signal getters typically: camelCase, no args, ends with ()
        const name = node.expression.text;
        if (
          node.arguments.length === 0 &&
          name.length > 0 &&
          name[0] === name[0].toLowerCase() &&
          !name.startsWith('get') &&
          !name.startsWith('is') &&
          !name.startsWith('has')
        ) {
          // Could be a signal getter - treat as dynamic
          hasSignal = true;
          return;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(expression);
  return hasSignal;
}

/**
 * Get all signal dependencies in expression
 */
export function getSignalDependencies(
  expression: ts.Expression,
  context: ITransformContext
): ts.Symbol[] {
  const dependencies: ts.Symbol[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && context.typeChecker) {
        const symbol = context.typeChecker.getSymbolAtLocation(node.expression);
        if (symbol && context.signalGetters.has(symbol)) {
          dependencies.push(symbol);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(expression);
  return dependencies;
}

/**
 * Create a signal detector for the given context
 */
export function createSignalDetector(context: ITransformContext) {
  return {
    processImportDeclaration: (node: ts.ImportDeclaration) =>
      processImportDeclaration(node, context),
    scanForSignalDeclarations: (sourceFile: ts.SourceFile) => {
      // Scan each statement in the source file
      sourceFile.statements.forEach((stmt) => scanForSignalDeclarations(stmt, context));
    },
    isSignalGetter: (symbol: ts.Symbol) => context.signalGetters.has(symbol),
    getSignalDependencies: (expr: ts.Expression) => getSignalDependencies(expr, context),
    extractSignalDependencies: (expr: ts.Expression) => {
      // Return array of dependency objects with name property
      const symbols = getSignalDependencies(expr, context);
      return symbols.map((sym) => ({ name: sym.getName() }));
    },
    isSignalImported: (name: string) => {
      // Check if this signal creator was imported
      if (context.signalImports.has(name)) {
        const info = context.signalImports.get(name)!;
        // Verify it's actually a signal creator
        return SIGNAL_CREATORS.has(info.symbolName);
      }
      return false;
    },
    isSignalCall: (expr: ts.Expression) => {
      if (!ts.isCallExpression(expr)) return false;
      if (!ts.isIdentifier(expr.expression)) return false;
      if (!context.typeChecker) return false;

      const symbol = context.typeChecker.getSymbolAtLocation(expr.expression);
      return symbol ? context.signalGetters.has(symbol) : false;
    },
    containsSignalCall: (expr: ts.Expression) => {
      return getSignalDependencies(expr, context).length > 0;
    },
    getSignalInfo: (name: string) => {
      const info = context.signalImports.get(name);
      if (!info) return null;

      // Determine signal type from the creator function
      let type: 'signal' | 'memo' | 'effect' | 'computed' = 'signal';
      if (info.symbolName.includes('Memo') || info.symbolName.includes('memo')) {
        type = 'memo';
      } else if (info.symbolName.includes('Effect') || info.symbolName.includes('effect')) {
        type = 'effect';
      } else if (info.symbolName.includes('Computed') || info.symbolName.includes('computed')) {
        type = 'computed';
      }

      return {
        name,
        type,
        isReactive: type === 'signal' || type === 'memo' || type === 'computed',
        isMemoized: type === 'memo' || type === 'computed',
        sourceNode: info.node,
        module: info.moduleName,
      };
    },
  };
}
