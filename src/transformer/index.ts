/**
 * Transformer - Entry point
 * Exports transformer and registers all prototype methods
 */

import { Transformer, TransformerPrototype } from './transformer.js';

// Import prototype methods
import { addError } from './prototypes/add-error.js';
import { addFrameworkImports } from './prototypes/add-framework-imports.js';
import { collectUsedImports } from './prototypes/collect-used-imports.js';
import { transformBlockStatement } from './prototypes/transform-block-statement.js';
import { transformCallExpression } from './prototypes/transform-call-expression.js';
import { transformComponentDeclaration } from './prototypes/transform-component-declaration.js';
import { transformExportNamedDeclaration } from './prototypes/transform-export-named-declaration.js';
import { transformExpression } from './prototypes/transform-expression.js';
import { transformFunctionDeclaration } from './prototypes/transform-function-declaration.js';
import { transformInterfaceDeclaration } from './prototypes/transform-interface-declaration.js';
import { transformJSXElement } from './prototypes/transform-jsx-element.js';
import { transformProgram } from './prototypes/transform-program.js';
import { transformStatement } from './prototypes/transform-statement.js';
import { transformVariableDeclaration } from './prototypes/transform-variable-declaration.js';
import { transform } from './prototypes/transform.js';

// Register prototype methods
TransformerPrototype.transform = transform;
TransformerPrototype.transformProgram = transformProgram;
TransformerPrototype.transformStatement = transformStatement;
TransformerPrototype.transformComponentDeclaration = transformComponentDeclaration;
TransformerPrototype.transformInterfaceDeclaration = transformInterfaceDeclaration;
TransformerPrototype.transformVariableDeclaration = transformVariableDeclaration;
TransformerPrototype.transformFunctionDeclaration = transformFunctionDeclaration;
TransformerPrototype.transformExportNamedDeclaration = transformExportNamedDeclaration;
TransformerPrototype.transformExpression = transformExpression;
TransformerPrototype.transformJSXElement = transformJSXElement;
TransformerPrototype.transformCallExpression = transformCallExpression;
TransformerPrototype.transformBlockStatement = transformBlockStatement;
TransformerPrototype.addFrameworkImports = addFrameworkImports;
TransformerPrototype.collectUsedImports = collectUsedImports;
TransformerPrototype.addError = addError;

// Export transformer
export type { ITransformer } from './transformer.js';
export * from './transformer.types.js';
export { Transformer };

// Export diagnostic system components
export * from './diagnostics.js';
export * from './state-tracker.js';
export * from './edge-cases.js';
export * from './debug-tools.js';
export * from './warning-recovery.js';

/**
 * Create transformer instance (factory function)
 */
export const createTransformer = (ast: any, options?: any): any => {
  return new (Transformer as any)(ast, options);
};

