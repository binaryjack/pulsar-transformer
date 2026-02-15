/**
 * Code Generator module exports
 * Aggregates all prototype methods
 */

// Import all prototype methods
import './prototypes/add-import.js';
import './prototypes/generate-expression.js';
import './prototypes/generate-imports.js';
import './prototypes/generate-jsx-element.js';
import './prototypes/generate-program.js';
import './prototypes/generate-statement.js';
import './prototypes/generate-type-annotation.js';
import './prototypes/generate.js';
import './prototypes/indent.js';
import './prototypes/is-reactive-expression.js';

// Export constructor and types
export { CodeGenerator, createCodeGenerator } from './code-generator.js';
export type { ICodeGenerator, ICodeGeneratorOptions, IGeneratedCode } from './code-generator.js';

// Export diagnostic system types for future use
export type {
  DiagnosticCode,
  DiagnosticSeverity,
  CodeGeneratorDiagnostic,
  ICodeGeneratorDiagnosticCollection,
} from './diagnostics.js';
export type { ICodeGenerationState } from './state-tracker.js';
export type { IEdgeCaseResult } from './edge-cases.js';
