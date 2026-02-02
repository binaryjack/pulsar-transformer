/**
 * Signal detector - Tracks imports and identifies signal getters
 * Complete implementation with full symbol resolution
 */

import * as ts from 'typescript';

import { ImportInfo, ITransformContext } from '../types.js';

const factory = ts.factory;

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

  // Phase 3: Detect reactive variables (new!)
  detectReactiveVariables(sourceFile, context);
}

/**
 * Build scope map for signal getters (Tier 2: Scope-based detection)
 * Walks AST and tracks const [getter, setter] = signalCreator() patterns per scope
 * Works WITHOUT TypeChecker by using AST pattern matching
 */
export function buildScopeMap(sourceFile: ts.SourceFile, context: ITransformContext): void {
  // Track current function scope stack
  const scopeStack: string[] = ['__global__'];

  // Initialize global scope
  if (!context.scopeMap.has('__global__')) {
    context.scopeMap.set('__global__', new Set());
  }

  function getCurrentScope(): string {
    return scopeStack[scopeStack.length - 1];
  }

  function getScopeSet(): Set<string> {
    const scopeName = getCurrentScope();
    let scopeSet = context.scopeMap.get(scopeName);
    if (!scopeSet) {
      scopeSet = new Set();
      context.scopeMap.set(scopeName, scopeSet);
    }
    return scopeSet;
  }

  function visit(node: ts.Node): void {
    // Track function scopes
    const isFunctionLike =
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node);

    if (isFunctionLike) {
      // Generate unique scope name
      let scopeName = '__anonymous__';

      if (ts.isFunctionDeclaration(node) && node.name) {
        scopeName = node.name.text;
      } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        scopeName = node.name.text;
      } else if (node.parent && ts.isVariableDeclaration(node.parent)) {
        const varDecl = node.parent;
        if (ts.isIdentifier(varDecl.name)) {
          scopeName = varDecl.name.text;
        }
      }

      // Make scope name unique by adding position
      scopeName = `${scopeName}@${node.pos}`;

      scopeStack.push(scopeName);
      context.scopeMap.set(scopeName, new Set());
    }

    // Detect signal getter declarations
    if (ts.isVariableDeclaration(node)) {
      // Pattern: const [getter, setter] = signalCreator()
      if (
        ts.isArrayBindingPattern(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)
      ) {
        const callExpr = node.initializer;
        const calleeName = getCalleeName(callExpr);

        // Check if this is a signal creator
        if (calleeName && isSignalCreatorByName(calleeName, context)) {
          const bindings = node.name.elements;
          if (bindings.length >= 1) {
            const firstBinding = bindings[0];
            if (ts.isBindingElement(firstBinding) && ts.isIdentifier(firstBinding.name)) {
              const getterName = firstBinding.name.text;

              // Add getter to current scope
              const scopeSet = getScopeSet();
              scopeSet.add(getterName);

              if (context.debugTracker) {
                const tracker = context.debugTracker as any;
                if (tracker.options?.enabled && tracker.options?.channels?.detector) {
                  console.log(
                    `[SCOPE-DETECTOR] Found signal getter: ${getterName} in scope ${getCurrentScope()} from ${calleeName}()`
                  );
                }
              }
            }
          }
        }
      }
    }

    // Recurse into children
    ts.forEachChild(node, visit);

    // Pop function scope
    if (isFunctionLike && scopeStack.length > 1) {
      scopeStack.pop();
    }
  }

  visit(sourceFile);
}

/**
 * Check if function name is a signal creator (name-based, no TypeChecker)
 */
function isSignalCreatorByName(name: string, context: ITransformContext): boolean {
  // Check if it's a known signal creator
  if (context.signalCreators.has(name)) return true;

  // Check if it was imported from Pulsar
  return context.signalImports.has(name);
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
 * Check if identifier refers to a signal getter (Three-tier detection)
 * Tier 1: Symbol-based (TypeChecker) - most accurate when available
 * Tier 2: Scope-based (AST pattern) - works without TypeChecker
 * Tier 3: Heuristic-based - conservative fallback
 */
export function isSignalGetter(identifier: ts.Identifier, context: ITransformContext): boolean {
  const name = identifier.text;

  // Tier 1: Symbol-based detection (most accurate)
  if (context.typeChecker) {
    const symbol = context.typeChecker.getSymbolAtLocation(identifier);
    if (symbol && context.signalGetters.has(symbol)) {
      if (context.debugTracker) {
        const tracker = context.debugTracker as any;
        if (tracker.options?.enabled && tracker.options?.channels?.detector) {
          console.log(`[TIER-1] Signal detected via symbol: ${name}`);
        }
      }
      return true;
    }
  }

  // Tier 2: Scope-based detection (AST pattern matching)
  // Check if identifier is in any tracked scope
  for (const [scopeName, getters] of context.scopeMap.entries()) {
    if (getters.has(name)) {
      if (context.debugTracker) {
        const tracker = context.debugTracker as any;
        if (tracker.options?.enabled && tracker.options?.channels?.detector) {
          console.log(`[TIER-2] Signal detected via scope: ${name} in ${scopeName}`);
        }
      }
      return true;
    }
  }

  // Tier 3: Function prop detection
  // Check if this identifier is a known signal prop in current scope
  if (context.signalPropsInScope && context.signalPropsInScope.has(name)) {
    if (context.debugTracker) {
      const tracker = context.debugTracker as any;
      if (tracker.options?.enabled && tracker.options?.channels?.detector) {
        console.log(`[TIER-3] Signal detected via prop: ${name}`);
      }
    }
    return true;
  }

  // Tier 4: Heuristic-based detection (conservative fallback)
  // Only apply if we have signal imports (avoid false positives)
  if (context.hasSignalImports) {
    // Conservative heuristics: common signal getter patterns
    const isCommonPattern =
      /^(count|value|state|data|items|selected|active|visible|open|loading|error)$/.test(name) ||
      /^(is|has|show|enable|disable)[A-Z]/.test(name) || // isActive, hasError, showModal
      (/^(get|set)[A-Z]/.test(name) && !name.startsWith('set')); // getCount, but not setCount

    if (isCommonPattern) {
      if (context.debugTracker) {
        const tracker = context.debugTracker as any;
        if (tracker.options?.enabled && tracker.options?.channels?.detector) {
          console.log(`[TIER-3] Signal detected via heuristic: ${name}`);
        }
      }
      return true;
    }
  }

  return false;
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
        // Primary: symbol-based detection
        if (isSignalGetter(node.expression, context)) {
          hasSignal = true;
          return;
        }

        // Fallback: pattern-based detection for function props that look like signals
        const name = node.expression.text;
        if (name && node.arguments.length === 0) {
          // Check if this is a known signal prop from component parameters
          if (context.signalPropsInScope.has(name)) {
            console.log(`[PATTERN-DETECT] 📡 Signal prop call detected: ${name}()`);
            hasSignal = true;
            return;
          }

          // Conservative pattern matching for likely signals
          if (
            /^(active|current|selected|is|has|show|get)[A-Z]/.test(name) ||
            /^[a-z]+[A-Z].*$/.test(name)
          ) {
            console.log(`[PATTERN-DETECT] 📡 Potential signal call detected: ${name}()`);
            hasSignal = true;
            return;
          }
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

/**
 * Detect and track reactive variable declarations
 * Identifies variables that contain signal calls and marks them as reactive functions
 */
export function detectReactiveVariables(
  sourceFile: ts.SourceFile,
  context: ITransformContext
): void {
  function visit(node: ts.Node): void {
    // Look for variable declarations
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      const varName = node.name.text;

      // Check if initializer contains signal calls
      if (hasSignalCalls(node.initializer, context)) {
        // Mark this variable as reactive (needs to be wrapped in arrow function)
        context.reactiveFunctions.add(varName);

        if (context.debugTracker) {
          const tracker = context.debugTracker as any;
          if (tracker.options?.enabled && tracker.options?.channels?.detector) {
            console.log(`[DETECTOR] Reactive variable detected: ${varName}`);
          }
        }
      }
    }

    // Recurse into child nodes
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

/**
 * Check if an identifier is a reactive function that needs () call in JSX
 */
export function isReactiveFunction(identifier: ts.Identifier, context: ITransformContext): boolean {
  return context.reactiveFunctions.has(identifier.text);
}

/**
 * Transform expressions to auto-call reactive functions
 * Converts: filtered.map(...) → filtered().map(...)
 */
export function transformReactiveExpression(
  expression: ts.Expression,
  context: ITransformContext
): ts.Expression {
  const visitor = (node: ts.Node): ts.Node => {
    // Look for property access on reactive functions: filtered.map(...)
    if (ts.isPropertyAccessExpression(node)) {
      if (ts.isIdentifier(node.expression) && isReactiveFunction(node.expression, context)) {
        if (context.options.debug) {
          console.log(`[TRANSFORMER] 🔄 Auto-calling reactive function: ${node.expression.text}`);
        }
        // Transform: filtered.map → filtered().map
        return factory.updatePropertyAccessExpression(
          node,
          factory.createCallExpression(
            node.expression, // filtered
            undefined, // type arguments
            [] // arguments
          ),
          node.name // map
        );
      }
    }

    // Look for direct reactive function usage: filtered (without property access)
    if (ts.isIdentifier(node) && isReactiveFunction(node, context)) {
      // Only transform if it's not already being called and not in a property access
      // We need to check the parent to avoid double transformation
      const parent = (node as any).parent;
      if (parent && !ts.isCallExpression(parent) && !ts.isPropertyAccessExpression(parent)) {
        if (context.options.debug) {
          console.log(`[TRANSFORMER] 🔄 Auto-calling reactive function: ${node.text}`);
        }
        // Transform: filtered → filtered()
        return factory.createCallExpression(
          node, // filtered
          undefined, // type arguments
          [] // arguments
        );
      }
    }

    // Recurse into children
    return ts.visitEachChild(node, visitor, undefined);
  };

  return ts.visitNode(expression, visitor) as ts.Expression;
}
