/**
 * Transformation Validator
 * Early detection of transformation issues before they reach the browser
 */

import * as acorn from 'acorn';
import type { IToken } from '../lexer/lexer.types.js';

export interface IValidationResult {
  valid: boolean;
  warnings: IValidationWarning[];
  errors: IValidationError[];
}

export interface IValidationWarning {
  type: 'missing-operator' | 'small-output' | 'no-exports' | 'no-registry';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface IValidationError {
  type: 'parse-error' | 'lexer-error' | 'empty-output' | 'typescript-syntax';
  message: string;
  line?: number;
  column?: number;
  fatal: boolean;
}

/**
 * Pre-transformation validation - detects common PSR syntax errors
 * These are DEVELOPER ERRORS in the PSR file, not transformer bugs
 */
export function validateInputSyntax(source: string, fileName: string): IValidationError[] {
  const errors: IValidationError[] = [];

  // ERROR 1: Missing space after JSX text before expression
  // Bad:  <span>Price:{price}</span>
  // Good: <span>Price: {price}</span>
  const noSpacePattern = />[a-zA-Z]+:\{/g;
  const noSpaceMatches = [...source.matchAll(noSpacePattern)];
  if (noSpaceMatches.length > 0) {
    const firstMatch = noSpaceMatches[0];
    const lines = source.substring(0, firstMatch.index).split('\n');
    errors.push({
      type: 'parse-error',
      message: `Syntax warning: Missing space before JSX expression. Found "${firstMatch[0]}"`,
      line: lines.length,
      fatal: false,
    });
  }

  // ERROR 2: JSX comments using HTML syntax
  // Bad:  <!-- comment -->
  // Good: {/* comment */}
  if (source.includes('<!--')) {
    const commentIndex = source.indexOf('<!--');
    const lines = source.substring(0, commentIndex).split('\n');
    errors.push({
      type: 'parse-error',
      message: `Syntax error: HTML comments <!-- --> not supported in JSX. Use {/* comment */} instead.`,
      line: lines.length,
      fatal: true,
    });
  }

  // ERROR 4: String concatenation in attributes
  // Bad:  <div class="button " + variant>
  // Good: <div class={`button ${variant}`}>
  const attrConcatPattern = /\s+\w+="[^"]*"\s*\+\s*/g;
  const attrConcatMatches = [...source.matchAll(attrConcatPattern)];
  if (attrConcatMatches.length > 0) {
    const firstMatch = attrConcatMatches[0];
    const lines = source.substring(0, firstMatch.index).split('\n');
    errors.push({
      type: 'parse-error',
      message: `Syntax error: String concatenation in JSX attributes. Use expression syntax: attr={\`...\`}`,
      line: lines.length,
      fatal: true,
    });
  }

  // ERROR 5 & ERROR 6: TypeScript validation disabled
  // PSR files now support TypeScript syntax - no longer rejecting type annotations
  // (TypeScript parameter and return type annotations are allowed in PSR)

  return errors;
}

/**
 * Validate JavaScript syntax using acorn parser
 * Catches syntax errors in generated code before browser sees them
 */
export function validateJavaScriptSyntax(code: string, fileName: string): IValidationError[] {
  const errors: IValidationError[] = [];

  try {
    // Parse as ESM module with latest ECMAScript features
    acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    });
  } catch (error: any) {
    // Acorn SyntaxError has loc property with line/column
    const line = error.loc?.line;
    const column = error.loc?.column;

    // DEBUG: Show context around the error
    if (error.loc && code) {
      const lines = code.split('\n');
      const errorLine = lines[error.loc.line - 1];
      console.log('[ACORN-ERROR-DEBUG] Error in file:', fileName);
      console.log('[ACORN-ERROR-DEBUG] Error message:', error.message);
      console.log('[ACORN-ERROR-DEBUG] Error at line', line + ', column', column);
      console.log('[ACORN-ERROR-DEBUG] Line content:', JSON.stringify(errorLine));
      if (errorLine && column >= 0) {
        console.log(
          '[ACORN-ERROR-DEBUG] Character at position:',
          JSON.stringify(errorLine[column])
        );
        console.log('[ACORN-ERROR-DEBUG] Surrounding context:');
        console.log(
          '[ACORN-ERROR-DEBUG]',
          JSON.stringify(errorLine.substring(Math.max(0, column - 20), column + 20))
        );
      }
    }

    errors.push({
      type: 'parse-error',
      message: `JavaScript syntax error: ${error.message}`,
      line,
      column,
      fatal: true,
    });
  }

  return errors;
}

/**
 * Validate transformation output quality
 */
export function validateTransformationOutput(
  input: string,
  output: string,
  fileName: string
): IValidationResult {
  const warnings: IValidationWarning[] = [];
  const errors: IValidationError[] = [];

  // CRITICAL: Run input validation first
  const inputErrors = validateInputSyntax(input, fileName);
  errors.push(...inputErrors);

  // If input has fatal errors, stop here - don't check output
  if (inputErrors.some((e) => e.fatal)) {
    return {
      valid: false,
      warnings,
      errors,
    };
  }

  // CRITICAL: Validate JavaScript syntax using acorn parser
  // NOTE: Disabled - output is TypeScript, not JavaScript
  // Acorn parser cannot handle TypeScript syntax (interfaces, type annotations)
  // const jsSyntaxErrors = validateJavaScriptSyntax(output, fileName);  
  // errors.push(...jsSyntaxErrors);

  // Rule 1: Check for suspiciously small output (header-only responses)
  const MIN_OUTPUT_SIZE = 500;
  const hasHeader = output.includes('/* Pulsar v') && output.includes(' PSR */');

  if (hasHeader && output.length < MIN_OUTPUT_SIZE) {
    errors.push({
      type: 'empty-output',
      message: `Transformation produced only ${output.length} bytes (expected > ${MIN_OUTPUT_SIZE}). Likely incomplete transformation.`,
      fatal: true,
    });
  }

  // Rule 2: Verify exports exist (if input had export component/function)
  // Note: Interfaces are type-only and have no runtime exports
  const inputHasExport = /export\s+(component|function|const)/.test(input);
  const outputHasExport = /export\s+(const|function)/.test(output);

  if (inputHasExport && !outputHasExport) {
    errors.push({
      type: 'parse-error',
      message: `Input has exports but output doesn't. Transformation failed.`,
      fatal: true,
    });
  }

  // Rule 3: Verify registry execution exists (for components)
  const inputHasComponent = /export\s+component/.test(input);
  const outputHasRegistry = /\$REGISTRY\.execute/.test(output);

  if (inputHasComponent && !outputHasRegistry) {
    warnings.push({
      type: 'no-registry',
      message: `Component declaration found but $REGISTRY.execute missing in output.`,
      suggestion: 'Component may not have been transformed correctly.',
    });
  }

  // Rule 4: Check output/input size ratio
  const sizeRatio = output.length / input.length;
  if (sizeRatio < 0.5 && input.length > 1000) {
    warnings.push({
      type: 'small-output',
      message: `Output (${output.length} bytes) is ${Math.round((1 - sizeRatio) * 100)}% smaller than input (${input.length} bytes).`,
      suggestion: 'Possible incomplete transformation or parsing failure.',
    });
  }

  // Rule 5: TypeScript syntax validation disabled
  // Output is intentionally TypeScript - no validation needed
  // (All TypeScript syntax patterns are allowed)

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Detect unsupported operators in source code
 * Catches missing token types before parsing fails
 */
export function detectUnsupportedOperators(source: string, fileName: string): IValidationWarning[] {
  const warnings: IValidationWarning[] = [];

  // Known problematic patterns (operators we had to add)
  const operatorPatterns = [
    { pattern: />=/, name: '>=', token: 'GT_EQUALS' },
    { pattern: /<=/, name: '<=', token: 'LT_EQUALS' },
    { pattern: /\?\?/, name: '??', token: 'QUESTION_QUESTION' },
    { pattern: /\?\./, name: '?.', token: 'QUESTION_DOT' },
    { pattern: /===/, name: '===', token: 'EQUALS_EQUALS_EQUALS' },
    { pattern: /!==/, name: '!==', token: 'NOT_EQUALS_EQUALS' },
    { pattern: /&&/, name: '&&', token: 'AMPERSAND_AMPERSAND' },
    { pattern: /\|\|/, name: '||', token: 'PIPE_PIPE' },
  ];

  operatorPatterns.forEach(({ pattern, name, token }) => {
    const matches = [...source.matchAll(new RegExp(pattern, 'g'))];
    if (matches.length > 0) {
      // Just log for awareness - these are now supported
      console.log(`[validator] Found ${matches.length} uses of '${name}' operator in ${fileName}`);
    }
  });

  // Check for potential future issues: bitwise shift operators
  const unsupportedPatterns = [
    { pattern: /<<(?!=)/, name: '<<', suggestion: 'Left shift operator not yet supported' },
    { pattern: />>(?!=)/, name: '>>', suggestion: 'Right shift operator not yet supported' },
    { pattern: />>>/, name: '>>>', suggestion: 'Unsigned right shift operator not yet supported' },
    // Note: Exponentiation operator (**) IS supported - removed from this list
  ];

  unsupportedPatterns.forEach(({ pattern, name, suggestion }) => {
    const matches = [...source.matchAll(new RegExp(pattern, 'g'))];
    if (matches.length > 0) {
      warnings.push({
        type: 'missing-operator',
        message: `Found ${matches.length} uses of '${name}' which may not be supported`,
        suggestion,
      });
    }
  });

  return warnings;
}

/**
 * Validate lexer tokens for completeness
 * Detects if lexer is splitting operators incorrectly
 */
export function validateTokenSequence(tokens: IToken[]): IValidationWarning[] {
  const warnings: IValidationWarning[] = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];

    // Detect GT + EQUALS sequence (should be GT_EQUALS)
    if (current.type === 'GT' && next.type === 'EQUALS') {
      warnings.push({
        type: 'missing-operator',
        message: `Found 'GT' + 'EQUALS' sequence at line ${current.line}. Should be 'GT_EQUALS' token.`,
        line: current.line,
        column: current.column,
        suggestion: 'Lexer may not be recognizing >= operator correctly.',
      });
    }

    // Detect LT + EQUALS sequence (should be LT_EQUALS)
    if (current.type === 'LT' && next.type === 'EQUALS') {
      warnings.push({
        type: 'missing-operator',
        message: `Found 'LT' + 'EQUALS' sequence at line ${current.line}. Should be 'LT_EQUALS' token.`,
        line: current.line,
        column: current.column,
        suggestion: 'Lexer may not be recognizing <= operator correctly.',
      });
    }

    // Detect EQUALS + EQUALS sequence (should be EQUALS_EQUALS)
    if (current.type === 'EQUALS' && next.type === 'EQUALS') {
      const hasThird = i < tokens.length - 2 && tokens[i + 2].type === 'EQUALS';
      warnings.push({
        type: 'missing-operator',
        message: `Found multiple EQUALS at line ${current.line}. Should be '${hasThird ? '===' : '=='}' token.`,
        line: current.line,
        column: current.column,
        suggestion: 'Lexer may not be recognizing equality operators correctly.',
      });
    }
  }

  return warnings;
}

/**
 * Log validation results with color coding
 */
export function logValidationResults(fileName: string, result: IValidationResult): void {
  if (result.errors.length > 0) {
    console.error(`\n❌ [validator] ${fileName}: ${result.errors.length} error(s)`);
    result.errors.forEach((error) => {
      const location = error.line
        ? ` (line ${error.line}${error.column ? `:${error.column}` : ''})`
        : '';
      console.error(`   ${error.type}${location}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  [validator] ${fileName}: ${result.warnings.length} warning(s)`);
    result.warnings.forEach((warning) => {
      const location = warning.line
        ? ` (line ${warning.line}${warning.column ? `:${warning.column}` : ''})`
        : '';
      console.warn(`   ${warning.type}${location}: ${warning.message}`);
      if (warning.suggestion) {
        console.warn(`   💡 ${warning.suggestion}`);
      }
    });
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(`✅ [validator] ${fileName}: validation passed`);
  }
}
