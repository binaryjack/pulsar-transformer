/**
 * Reactivity validation
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

/**
 * Validate reactivity patterns in component
 */
export function validateReactivity(this: ISemanticAnalyzer, node: any): void {
  // Future: Build reactivity graph
  // - Track signals created
  // - Track signal accesses
  // - Track effect dependencies
  // - Warn about missing dependencies
}

/**
 * Check signal dependencies
 */
export function checkSignalDependencies(this: ISemanticAnalyzer, node: any): void {
  // Future: Analyze signal usage
  // - Detect signal() calls without proper tracking
  // - Warn about stale closures
}

/**
 * Check effect dependencies
 */
export function checkEffectDependencies(this: ISemanticAnalyzer, node: any): void {
  // useEffect should have dependency array as second argument
  if (node.arguments.length < 2) {
    this.addWarning('missing-dependency', 'useEffect is missing dependency array', node);
    return;
  }

  const callback = node.arguments[0];
  const depsArray = node.arguments[1];

  // Extract captured variables from callback
  const capturedVars = this.extractCapturedVariables(callback);

  // Extract declared dependencies from array
  const declaredDeps = this.extractDependencies(depsArray);

  // Find missing dependencies
  const missingDeps = capturedVars.filter((varName) => !declaredDeps.includes(varName));

  // Warn about missing dependencies
  if (missingDeps.length > 0) {
    this.addWarning(
      'missing-dependency',
      `useEffect is missing dependencies: ${missingDeps.join(', ')}`,
      node
    );
  }

  // Find unnecessary dependencies (declared but not used)
  const unnecessaryDeps = declaredDeps.filter((depName) => !capturedVars.includes(depName));

  if (unnecessaryDeps.length > 0) {
    this.addWarning(
      'missing-dependency',
      `useEffect has unnecessary dependencies: ${unnecessaryDeps.join(', ')}`,
      node
    );
  }
}

/**
 * Extract captured variables from a function/arrow function
 */
export function extractCapturedVariables(this: ISemanticAnalyzer, node: any): string[] {
  const captured: Set<string> = new Set();
  const declared: Set<string> = new Set();

  // Get function parameters (these are NOT captured, they're local)
  if (node.params) {
    for (const param of node.params) {
      if (param.type === 'Identifier') {
        declared.add(param.name);
      } else if (param.type === 'ArrayPattern') {
        // Destructured params: [a, b]
        for (const element of param.elements) {
          if (element && element.type === 'Identifier') {
            declared.add(element.name);
          }
        }
      } else if (param.type === 'ObjectPattern') {
        // Destructured params: {a, b}
        for (const property of param.properties) {
          if (property.type === 'Property' && property.value.type === 'Identifier') {
            declared.add(property.value.name);
          }
        }
      }
    }
  }

  // Walk the function body to find variable references
  this.walkNode(node.body, (childNode: any) => {
    if (childNode.type === 'Identifier') {
      const varName = childNode.name;

      // Skip if it's a local declaration
      if (declared.has(varName)) return;

      // Check if this identifier is actually a reference (not a declaration)
      // Skip built-in functions and global objects
      const builtins = ['console', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean'];
      if (builtins.includes(varName)) return;

      // Check if variable exists in outer scope
      const symbol = this.resolveSymbol(varName);
      if (symbol && symbol.scopeId !== 'function-scope') {
        captured.add(varName);
      }
    } else if (
      childNode.type === 'VariableDeclaration' ||
      childNode.type === 'FunctionDeclaration'
    ) {
      // Track local declarations inside the effect
      if (childNode.type === 'VariableDeclaration') {
        for (const declarator of childNode.declarations) {
          if (declarator.id.type === 'Identifier') {
            declared.add(declarator.id.name);
          }
        }
      } else if (childNode.type === 'FunctionDeclaration' && childNode.id) {
        declared.add(childNode.id.name);
      }
    }
  });

  return Array.from(captured);
}

/**
 * Extract dependencies from dependency array
 */
export function extractDependencies(this: ISemanticAnalyzer, node: any): string[] {
  const deps: string[] = [];

  if (node.type === 'ArrayExpression') {
    for (const element of node.elements) {
      if (element.type === 'Identifier') {
        deps.push(element.name);
      } else if (element.type === 'MemberExpression') {
        // Handle deps like [count, obj.property]
        // Just use the root object name
        if (element.object.type === 'Identifier') {
          deps.push(element.object.name);
        }
      }
    }
  }

  return deps;
}

/**
 * Walk AST node recursively
 */
export function walkNode(this: ISemanticAnalyzer, node: any, callback: (node: any) => void): void {
  if (!node || typeof node !== 'object') return;

  callback(node);

  // Recursively walk all node properties
  for (const key in node) {
    const value = node[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          this.walkNode(item, callback);
        }
      }
    } else if (value && typeof value === 'object' && key !== 'parent') {
      this.walkNode(value, callback);
    }
  }
}
