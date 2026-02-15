/**
 * Code Generator Edge Cases - Enterprise edge case detection and handling
 * Identifies and handles problematic code generation scenarios
 */

import { DiagnosticCode, DiagnosticSeverity } from './diagnostics.js';

export interface IEdgeCaseResult {
  detected: boolean;
  code: DiagnosticCode;
  message: string;
  severity: DiagnosticSeverity;
  suggestion?: string;
  node?: any;
}

export interface ICodeGeneratorEdgeCases {
  detectInterfaceEdgeCases(node: any): IEdgeCaseResult[];
  detectComponentEdgeCases(node: any): IEdgeCaseResult[];
  detectJSXEdgeCases(node: any): IEdgeCaseResult[];
  detectExpressionEdgeCases(node: any): IEdgeCaseResult[];
  detectStatementEdgeCases(node: any): IEdgeCaseResult[];
  detectImportEdgeCases(importName: string): IEdgeCaseResult[];
  detectIndentationEdgeCases(indentLevel: number): IEdgeCaseResult[];
  detectNamingConflictEdgeCases(name: string, type: 'component' | 'interface'): IEdgeCaseResult[];
  getAllEdgeCases(node: any): IEdgeCaseResult[];
  calculateJSXDepth(node: any, currentDepth?: number): number;
  calculateExpressionDepth(node: any, currentDepth?: number): number;
}

/**
 * Code Generator Edge Cases Implementation
 */
export const CodeGeneratorEdgeCases = function (this: ICodeGeneratorEdgeCases) {
  // Edge case detection implementation
} as unknown as { new (): ICodeGeneratorEdgeCases };

CodeGeneratorEdgeCases.prototype.detectInterfaceEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Interface with no name
  if (!node.name || !node.name.name) {
    results.push({
      detected: true,
      code: DiagnosticCode.InterfaceNameMissing,
      message: 'Interface declaration missing name property',
      severity: DiagnosticSeverity.Error,
      suggestion: 'Add interface name: interface MyInterface { ... }',
      node,
    });
  }

  // Edge Case 2: Interface with no body/properties
  if (!node.body || !node.body.properties || node.body.properties.length === 0) {
    results.push({
      detected: true,
      code: DiagnosticCode.InterfacePropertyMissing,
      message: `Interface '${node.name?.name || 'unnamed'}' has no properties`,
      severity: DiagnosticSeverity.Warning,
      suggestion: 'Add properties to interface or use type alias',
      node,
    });
  }

  // Edge Case 3: Interface properties with invalid type annotations
  if (node.body && node.body.properties) {
    for (const prop of node.body.properties) {
      if (prop.typeAnnotation) {
        const typeNode = prop.typeAnnotation.typeAnnotation || prop.typeAnnotation;

        // Check for missing type
        if (!typeNode || typeNode.type === 'TSAnyKeyword') {
          results.push({
            detected: true,
            code: DiagnosticCode.InterfaceTypeAnnotationInvalid,
            message: `Property '${prop.key?.name || 'unknown'}' has any type or missing type annotation`,
            severity: DiagnosticSeverity.Error,
            suggestion: 'Specify explicit type for property',
            node: prop,
          });
        }
      } else {
        results.push({
          detected: true,
          code: DiagnosticCode.InterfaceTypeAnnotationInvalid,
          message: `Property '${prop.key?.name || 'unknown'}' missing type annotation`,
          severity: DiagnosticSeverity.Error,
          suggestion: 'Add type annotation: property: type',
          node: prop,
        });
      }
    }
  }

  // Edge Case 4: Interface name conflicts with JavaScript keywords
  if (node.name && node.name.name) {
    const jsKeywords = [
      'function',
      'class',
      'var',
      'let',
      'const',
      'if',
      'else',
      'for',
      'while',
      'return',
    ];
    if (jsKeywords.includes(node.name.name.toLowerCase())) {
      results.push({
        detected: true,
        code: DiagnosticCode.InterfaceNameMissing, // Reuse existing code
        message: `Interface name '${node.name.name}' conflicts with JavaScript keyword`,
        severity: DiagnosticSeverity.Error,
        suggestion: "Use different interface name that doesn't conflict with keywords",
        node,
      });
    }
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectComponentEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Component with no name
  if (!node.name || !node.name.name) {
    results.push({
      detected: true,
      code: DiagnosticCode.ComponentGenerationFailed,
      message: 'Component declaration missing name',
      severity: DiagnosticSeverity.Error,
      suggestion: 'Add component name',
      node,
    });
  }

  // Edge Case 2: Component name not PascalCase
  if (node.name && node.name.name) {
    const name = node.name.name;
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      results.push({
        detected: true,
        code: DiagnosticCode.ComponentNameConflict,
        message: `Component name '${name}' should be PascalCase`,
        severity: DiagnosticSeverity.Warning,
        suggestion: 'Use PascalCase for component names: MyComponent',
        node,
      });
    }
  }

  // Edge Case 3: Component with no parameters
  if (!node.params || node.params.length === 0) {
    results.push({
      detected: true,
      code: DiagnosticCode.ComponentParameterInvalid,
      message: `Component '${node.name?.name || 'unnamed'}' has no parameters`,
      severity: DiagnosticSeverity.Warning,
      suggestion: 'Components should typically have props parameter',
      node,
    });
  }

  // Edge Case 4: Component parameters without type annotations
  if (node.params) {
    for (const param of node.params) {
      if (!param.typeAnnotation) {
        results.push({
          detected: true,
          code: DiagnosticCode.ComponentTypeAnnotationMissing,
          message: `Component parameter missing type annotation`,
          severity: DiagnosticSeverity.Error,
          suggestion: 'Add type annotation: (props: PropsType) => ...',
          node: param,
        });
      }
    }
  }

  // Edge Case 5: Component body missing or empty
  if (
    !node.body ||
    (node.body.type === 'BlockStatement' && (!node.body.body || node.body.body.length === 0))
  ) {
    results.push({
      detected: true,
      code: DiagnosticCode.ComponentBodyGenerationFailed,
      message: `Component '${node.name?.name || 'unnamed'}' has empty body`,
      severity: DiagnosticSeverity.Warning,
      suggestion: 'Add component implementation',
      node,
    });
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectJSXEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: JSX element with invalid name
  if (node.type === 'JSXElement' && node.openingElement) {
    const elementName = node.openingElement.name;

    if (!elementName || !elementName.name) {
      results.push({
        detected: true,
        code: DiagnosticCode.JSXElementNameInvalid,
        message: 'JSX element missing or invalid name',
        severity: DiagnosticSeverity.Error,
        suggestion: 'Provide valid JSX element name',
        node,
      });
    }
  }

  // Edge Case 2: JSX attributes with invalid structure
  if (node.type === 'JSXElement' && node.openingElement && node.openingElement.attributes) {
    for (const attr of node.openingElement.attributes) {
      if (attr.type === 'JSXAttribute') {
        // Check for attributes without names
        if (!attr.name || !attr.name.name) {
          results.push({
            detected: true,
            code: DiagnosticCode.JSXAttributeGenerationFailed,
            message: 'JSX attribute missing name',
            severity: DiagnosticSeverity.Error,
            suggestion: 'Add attribute name',
            node: attr,
          });
        }
      }
    }
  }

  // Edge Case 3: JSX fragment without appropriate children
  if (node.type === 'JSXFragment') {
    if (!node.children || node.children.length === 0) {
      results.push({
        detected: true,
        code: DiagnosticCode.JSXFragmentGenerationFailed,
        message: 'Empty JSX fragment',
        severity: DiagnosticSeverity.Info,
        suggestion: 'Remove empty fragment or add children',
        node,
      });
    }
  }

  // Edge Case 4: Deeply nested JSX (performance concern)
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
    const depth = this.calculateJSXDepth(node);
    if (depth > 10) {
      results.push({
        detected: true,
        code: DiagnosticCode.JSXChildrenProcessingFailed, // Reuse existing code
        message: `JSX nesting too deep (${depth} levels, max: 10)`,
        severity: DiagnosticSeverity.Warning,
        suggestion: 'Consider breaking down complex JSX into smaller components',
        node,
      });
    }
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectExpressionEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Complex nested expressions
  if (node.type === 'CallExpression' || node.type === 'MemberExpression') {
    const depth = this.calculateExpressionDepth(node);
    if (depth > 5) {
      results.push({
        detected: true,
        code: DiagnosticCode.ExpressionGenerationFailed,
        message: `Expression nesting too deep (${depth} levels, max: 5)`,
        severity: DiagnosticSeverity.Warning,
        suggestion: 'Break down complex expressions into intermediate variables',
        node,
      });
    }
  }

  // Edge Case 2: Expressions with missing operators
  if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
    if (!node.operator) {
      results.push({
        detected: true,
        code: DiagnosticCode.ExpressionGenerationFailed,
        message: 'Binary/logical expression missing operator',
        severity: DiagnosticSeverity.Error,
        suggestion: 'Add valid operator (+, -, *, /, &&, ||, etc.)',
        node,
      });
    }
  }

  // Edge Case 3: Function expressions without parameters or body
  if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (!node.body) {
      results.push({
        detected: true,
        code: DiagnosticCode.ExpressionGenerationFailed,
        message: 'Function expression missing body',
        severity: DiagnosticSeverity.Error,
        suggestion: 'Add function body',
        node,
      });
    }
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectStatementEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Empty statements
  if (node.type === 'EmptyStatement') {
    results.push({
      detected: true,
      code: DiagnosticCode.StatementGenerationFailed,
      message: 'Empty statement detected',
      severity: DiagnosticSeverity.Info,
      suggestion: 'Remove unnecessary semicolons or empty statements',
      node,
    });
  }

  // Edge Case 2: Variable declarations without initializers
  if (node.type === 'VariableDeclaration') {
    for (const declarator of node.declarations) {
      if (!declarator.init) {
        results.push({
          detected: true,
          code: DiagnosticCode.StatementGenerationFailed,
          message: `Variable '${declarator.id?.name || 'unknown'}' declared without initializer`,
          severity: DiagnosticSeverity.Warning,
          suggestion: 'Initialize variable or use explicit undefined',
          node: declarator,
        });
      }
    }
  }

  // Edge Case 3: Return statements outside functions
  if (node.type === 'ReturnStatement') {
    // This would require context tracking to properly detect
    // For now, just note it as potential issue
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectImportEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  importName: string
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Empty import name
  if (!importName || importName.trim() === '') {
    results.push({
      detected: true,
      code: DiagnosticCode.ImportGenerationFailed,
      message: 'Import name is empty or whitespace',
      severity: DiagnosticSeverity.Error,
      suggestion: 'Provide valid import name',
    });
  }

  // Edge Case 2: Import name conflicts with JavaScript keywords
  const jsKeywords = [
    'function',
    'class',
    'var',
    'let',
    'const',
    'if',
    'else',
    'for',
    'while',
    'return',
  ];
  if (jsKeywords.includes(importName.toLowerCase())) {
    results.push({
      detected: true,
      code: DiagnosticCode.ImportGenerationFailed,
      message: `Import name '${importName}' conflicts with JavaScript keyword`,
      severity: DiagnosticSeverity.Error,
      suggestion: 'Use different import name or alias',
    });
  }

  // Edge Case 3: Potentially malformed import names
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(importName)) {
    results.push({
      detected: true,
      code: DiagnosticCode.ImportGenerationFailed,
      message: `Import name '${importName}' contains invalid characters`,
      severity: DiagnosticSeverity.Warning,
      suggestion: 'Use valid JavaScript identifier for import name',
    });
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectIndentationEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  indentLevel: number
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Excessive indentation
  if (indentLevel > 10) {
    results.push({
      detected: true,
      code: DiagnosticCode.ExcessiveIndentationLevels,
      message: `Indentation level ${indentLevel} exceeds recommended maximum (10)`,
      severity: DiagnosticSeverity.Warning,
      suggestion: 'Consider refactoring to reduce nesting depth',
    });
  }

  // Edge Case 2: Negative indentation (should never happen)
  if (indentLevel < 0) {
    results.push({
      detected: true,
      code: DiagnosticCode.IndentationCorrupted,
      message: `Invalid negative indentation level: ${indentLevel}`,
      severity: DiagnosticSeverity.Error,
      suggestion: 'Reset indentation tracking',
    });
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.detectNamingConflictEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  name: string,
  type: 'component' | 'interface'
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Edge Case 1: Name conflicts with built-in types
  const builtInTypes = [
    'string',
    'number',
    'boolean',
    'object',
    'function',
    'undefined',
    'null',
    'Array',
    'Object',
    'Function',
  ];
  if (builtInTypes.includes(name)) {
    results.push({
      detected: true,
      code:
        type === 'component'
          ? DiagnosticCode.ComponentNameConflict
          : DiagnosticCode.InterfaceNameMissing,
      message: `${type} name '${name}' conflicts with built-in type`,
      severity: DiagnosticSeverity.Error,
      suggestion: "Use different name that doesn't conflict with built-in types",
    });
  }

  // Edge Case 2: Name conflicts with common HTML elements (for components)
  if (type === 'component') {
    const htmlElements = [
      'div',
      'span',
      'button',
      'input',
      'img',
      'a',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ];
    if (htmlElements.includes(name.toLowerCase())) {
      results.push({
        detected: true,
        code: DiagnosticCode.ComponentNameConflict,
        message: `Component name '${name}' conflicts with HTML element`,
        severity: DiagnosticSeverity.Warning,
        suggestion: 'Use more descriptive component name',
      });
    }
  }

  return results;
};

CodeGeneratorEdgeCases.prototype.getAllEdgeCases = function (
  this: ICodeGeneratorEdgeCases,
  node: any
): IEdgeCaseResult[] {
  const results: IEdgeCaseResult[] = [];

  // Run all relevant edge case detections based on node type
  switch (node.type) {
    case 'InterfaceDeclaration':
      results.push(...this.detectInterfaceEdgeCases(node));
      break;
    case 'FunctionDeclaration':
      results.push(...this.detectComponentEdgeCases(node));
      break;
    case 'JSXElement':
    case 'JSXFragment':
      results.push(...this.detectJSXEdgeCases(node));
      break;
    case 'CallExpression':
    case 'MemberExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      results.push(...this.detectExpressionEdgeCases(node));
      break;
    case 'VariableDeclaration':
    case 'ReturnStatement':
    case 'EmptyStatement':
      results.push(...this.detectStatementEdgeCases(node));
      break;
  }

  return results;
};

// Helper methods
CodeGeneratorEdgeCases.prototype.calculateJSXDepth = function (
  this: ICodeGeneratorEdgeCases,
  node: any,
  currentDepth: number = 0
): number {
  let maxDepth = currentDepth;

  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        const childDepth = this.calculateJSXDepth(child, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }
  }

  return maxDepth;
};

CodeGeneratorEdgeCases.prototype.calculateExpressionDepth = function (
  this: ICodeGeneratorEdgeCases,
  node: any,
  currentDepth: number = 0
): number {
  let maxDepth = currentDepth;

  // Traverse nested expressions
  if (node.callee) {
    maxDepth = Math.max(maxDepth, this.calculateExpressionDepth(node.callee, currentDepth + 1));
  }
  if (node.object) {
    maxDepth = Math.max(maxDepth, this.calculateExpressionDepth(node.object, currentDepth + 1));
  }
  if (node.property) {
    maxDepth = Math.max(maxDepth, this.calculateExpressionDepth(node.property, currentDepth + 1));
  }
  if (node.left) {
    maxDepth = Math.max(maxDepth, this.calculateExpressionDepth(node.left, currentDepth + 1));
  }
  if (node.right) {
    maxDepth = Math.max(maxDepth, this.calculateExpressionDepth(node.right, currentDepth + 1));
  }

  return maxDepth;
};

/**
 * Create edge case detector instance
 */
export function createCodeGeneratorEdgeCases(): ICodeGeneratorEdgeCases {
  return new CodeGeneratorEdgeCases();
}

/**
 * Edge case detection utilities
 */
export const EdgeCaseUtils = {
  /**
   * Filter edge cases by severity
   */
  filterBySeverity(edgeCases: IEdgeCaseResult[], severity: DiagnosticSeverity): IEdgeCaseResult[] {
    return edgeCases.filter((ec) => ec.severity === severity);
  },

  /**
   * Get summary of edge cases
   */
  summarizeEdgeCases(edgeCases: IEdgeCaseResult[]): string {
    const errors = edgeCases.filter((ec) => ec.severity === DiagnosticSeverity.Error).length;
    const warnings = edgeCases.filter((ec) => ec.severity === DiagnosticSeverity.Warning).length;
    const info = edgeCases.filter((ec) => ec.severity === DiagnosticSeverity.Info).length;

    return `Edge Cases: ${edgeCases.length} total (${errors} errors, ${warnings} warnings, ${info} info)`;
  },

  /**
   * Check if any critical edge cases detected
   */
  hasCriticalEdgeCases(edgeCases: IEdgeCaseResult[]): boolean {
    return edgeCases.some((ec) => ec.severity === DiagnosticSeverity.Error);
  },
};
