/**
 * Semantic Analyzer - Entry point
 * Exports analyzer and registers all prototype methods
 */

import { SemanticAnalyzer, SemanticAnalyzerPrototype } from './semantic-analyzer.js';

// Import prototype methods
import { analyzeBlockStatement } from './prototypes/analyze-block.js';
import { analyzeCallExpression } from './prototypes/analyze-call-expression.js';
import { analyzeComponentDeclaration } from './prototypes/analyze-component.js';
import { analyzeExpression } from './prototypes/analyze-expression.js';
import { analyzeFunctionDeclaration } from './prototypes/analyze-function.js';
import { analyzeIfStatement } from './prototypes/analyze-if.js';
import { analyzeInterfaceDeclaration } from './prototypes/analyze-interface.js';
import { analyzeJSXElement } from './prototypes/analyze-jsx.js';
import { analyzeProgram } from './prototypes/analyze-program.js';
import { analyzeReturnStatement } from './prototypes/analyze-return.js';
import { analyzeStatement } from './prototypes/analyze-statement.js';
import { analyzeVariableDeclaration } from './prototypes/analyze-variable.js';
import { analyze } from './prototypes/analyze.js';
import { addError, addWarning } from './prototypes/error-reporting.js';
import { checkDeadCode, checkUnusedSymbols } from './prototypes/post-analysis.js';
import {
  checkEffectDependencies,
  checkSignalDependencies,
  validateReactivity,
} from './prototypes/reactivity-validation.js';
import { enterScope, exitScope } from './prototypes/scope-management.js';
import { declareSymbol, markSymbolUsed, resolveSymbol } from './prototypes/symbol-management.js';
import { checkType, inferType } from './prototypes/type-checking.js';

// Register prototype methods
SemanticAnalyzerPrototype.analyze = analyze;
SemanticAnalyzerPrototype.enterScope = enterScope;
SemanticAnalyzerPrototype.exitScope = exitScope;
SemanticAnalyzerPrototype.declareSymbol = declareSymbol;
SemanticAnalyzerPrototype.resolveSymbol = resolveSymbol;
SemanticAnalyzerPrototype.markSymbolUsed = markSymbolUsed;
SemanticAnalyzerPrototype.analyzeProgram = analyzeProgram;
SemanticAnalyzerPrototype.analyzeStatement = analyzeStatement;
SemanticAnalyzerPrototype.analyzeComponentDeclaration = analyzeComponentDeclaration;
SemanticAnalyzerPrototype.analyzeFunctionDeclaration = analyzeFunctionDeclaration;
SemanticAnalyzerPrototype.analyzeVariableDeclaration = analyzeVariableDeclaration;
SemanticAnalyzerPrototype.analyzeInterfaceDeclaration = analyzeInterfaceDeclaration;
SemanticAnalyzerPrototype.analyzeBlockStatement = analyzeBlockStatement;
SemanticAnalyzerPrototype.analyzeIfStatement = analyzeIfStatement;
SemanticAnalyzerPrototype.analyzeReturnStatement = analyzeReturnStatement;
SemanticAnalyzerPrototype.analyzeExpression = analyzeExpression;
SemanticAnalyzerPrototype.analyzeCallExpression = analyzeCallExpression;
SemanticAnalyzerPrototype.analyzeJSXElement = analyzeJSXElement;
SemanticAnalyzerPrototype.checkType = checkType;
SemanticAnalyzerPrototype.inferType = inferType;
SemanticAnalyzerPrototype.validateReactivity = validateReactivity;
SemanticAnalyzerPrototype.checkSignalDependencies = checkSignalDependencies;
SemanticAnalyzerPrototype.checkEffectDependencies = checkEffectDependencies;
SemanticAnalyzerPrototype.addError = addError;
SemanticAnalyzerPrototype.addWarning = addWarning;
SemanticAnalyzerPrototype.checkUnusedSymbols = checkUnusedSymbols;
SemanticAnalyzerPrototype.checkDeadCode = checkDeadCode;

// Export semantic analyzer
export type { ISemanticAnalyzer } from './semantic-analyzer.js';
export * from './semantic-analyzer.types.js';
export { SemanticAnalyzer };
