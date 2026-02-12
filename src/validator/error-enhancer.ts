/**
 * Enhanced Parser Error Messages
 * Provides actionable suggestions when parser encounters errors
 */

export interface IEnhancedError {
  original: string;
  enhanced: string;
  suggestion?: string;
  documentationLink?: string;
}

/**
 * Enhance parser error with helpful context and suggestions
 */
export function enhanceParserError(
  errorMessage: string,
  currentToken: string,
  expectedToken?: string,
  line?: number,
  column?: number
): IEnhancedError {
  const enhanced: IEnhancedError = {
    original: errorMessage,
    enhanced: errorMessage,
  };

  // Pattern: "Unexpected token 'X'"
  if (/Unexpected token/.test(errorMessage)) {
    // Case 1: Unexpected 'EQUALS' after comparison operator
    if (currentToken === 'EQUALS' && errorMessage.includes('EQUALS')) {
      enhanced.enhanced = `${errorMessage}\n\n🔍 Possible cause: Missing comparison operator token (>= or <=)\n`;
      enhanced.suggestion =
        `The lexer may be tokenizing '>=' as two tokens: 'GT' + 'EQUALS'.\n` +
        `This usually means the comparison operator (>= or <=) is not properly recognized.\n` +
        `Check if TokenTypeEnum.GT_EQUALS and TokenTypeEnum.LT_EQUALS are defined.`;
    }

    // Case 2: Unexpected token in general
    else {
      enhanced.enhanced = `${errorMessage}\n\n🔍 Check the syntax around line ${line || '?'}, column ${column || '?'}`;
      enhanced.suggestion = `If you're using a special operator, verify it's supported by the lexer.`;
    }
  }

  // Pattern: "Expected 'X' but got 'Y'"
  if (/Expected.*but got/.test(errorMessage)) {
    enhanced.enhanced = `${errorMessage}\n\n🔍 Syntax mismatch detected`;

    if (expectedToken) {
      enhanced.suggestion = `The parser expected a '${expectedToken}' token but found '${currentToken}' instead.`;
    }
  }

  // Pattern: Parse errors with no diagnostics
  if (/Parse error/.test(errorMessage) && !enhanced.suggestion) {
    enhanced.suggestion =
      `Common causes:\n` +
      `  1. Unsupported operator (>>, <<, **, etc.)\n` +
      `  2. Missing token definition in lexer\n` +
      `  3. Incorrect JSX syntax\n` +
      `  4. Unclosed brackets or parentheses`;
  }

  return enhanced;
}

/**
 * Suggest fixes based on token sequence
 */
export function suggestFixForTokenSequence(
  tokens: Array<{ type: string; value: string }>,
  errorIndex: number
): string | null {
  if (errorIndex < 0 || errorIndex >= tokens.length) return null;

  const prev = errorIndex > 0 ? tokens[errorIndex - 1] : null;
  const current = tokens[errorIndex];
  const next = errorIndex < tokens.length - 1 ? tokens[errorIndex + 1] : null;

  // GT + EQUALS = should be GT_EQUALS
  if (prev?.type === 'GT' && current.type === 'EQUALS') {
    return `Found 'GT' + 'EQUALS' sequence. This should be a single 'GT_EQUALS' (>=) token.\nThe lexer needs to recognize >= as an atomic operator.`;
  }

  // LT + EQUALS = should be LT_EQUALS
  if (prev?.type === 'LT' && current.type === 'EQUALS') {
    return `Found 'LT' + 'EQUALS' sequence. This should be a single 'LT_EQUALS' (<=) token.\nThe lexer needs to recognize <= as an atomic operator.`;
  }

  // EQUALS + EQUALS = should be EQUALS_EQUALS
  if (prev?.type === 'EQUALS' && current.type === 'EQUALS') {
    const hasThird = next?.type === 'EQUALS';
    return `Found multiple EQUALS tokens. This should be a single '${hasThird ? 'EQUALS_EQUALS_EQUALS' : 'EQUALS_EQUALS'}' (${hasThird ? '===' : '=='}) token.`;
  }

  // STAR + STAR = exponentiation (not supported)
  if (prev?.type === 'STAR' && current.type === 'STAR') {
    return `Found '**' operator (exponentiation). This operator is not yet supported by the parser.\nConsider using Math.pow() instead.`;
  }

  // LT + LT = left shift (not supported)
  if (prev?.type === 'LT' && current.type === 'LT') {
    return `Found '<<' operator (left shift). Bitwise shift operators are not yet supported.`;
  }

  // GT + GT = right shift (not supported)
  if (prev?.type === 'GT' && current.type === 'GT') {
    return `Found '>>' operator (right shift). Bitwise shift operators are not yet supported.`;
  }

  return null;
}

/**
 * Create diagnostic message for transformation failure
 */
export function createTransformationFailureDiagnostic(
  fileName: string,
  inputLength: number,
  outputLength: number,
  error?: Error
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('❌ TRANSFORMATION FAILURE DETECTED');
  lines.push('═══════════════════════════════════');
  lines.push(`📁 File: ${fileName}`);
  lines.push(`📊 Input size: ${inputLength} bytes`);
  lines.push(`📊 Output size: ${outputLength} bytes`);
  lines.push('');

  if (outputLength < 500 && outputLength < inputLength * 0.1) {
    lines.push('🔍 Issue: Output suspiciously small (< 10% of input)');
    lines.push('   Likely causes:');
    lines.push('   • Parser encountered unexpected token and returned empty AST');
    lines.push('   • Lexer failed to tokenize correctly');
    lines.push('   • Unsupported syntax caused silent failure');
    lines.push('');
  }

  if (error) {
    lines.push(`💥 Error: ${error.message}`);
    lines.push('');
  }

  lines.push('🔧 Debugging steps:');
  lines.push('   1. Check console for "Unexpected token" errors');
  lines.push('   2. Look for parser diagnostics with line numbers');
  lines.push('   3. Verify all operators in source are supported');
  lines.push('   4. Enable PULSAR_DEBUG=1 for detailed logs');
  lines.push('');
  lines.push('📖 Common operator issues:');
  lines.push('   • >= and <= : Should be single tokens (GT_EQUALS, LT_EQUALS)');
  lines.push('   • ** : Exponentiation not yet supported (use Math.pow)');
  lines.push('   • >> and << : Bitwise shifts not yet supported');
  lines.push('');

  return lines.join('\n');
}
