/**
 * ACORN Parser Adapter
 * Converts ACORN tokens to PSR token format
 *
 * PURPOSE: Replace buggy custom lexer with battle-tested ACORN parser
 * - Instant fix for Unicode handling (emojis, international characters)
 * - Instant fix for template literal edge cases
 * - Support for latest ECMAScript features
 *
 * STRATEGY: Use ACORN+JSX and convert JSX tokens to basic tokens (LT, GT, IDENTIFIER, etc.)
 * that the existing PSR parser understands. Parser constructs JSX from these primitives.
 */

import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import { TokenTypeEnum, type IToken } from './lexer.types.js';

// Extend ACORN with JSX support
const AcornJSX = acorn.Parser.extend(jsx());

/**
 * Map ACORN token types to PSR TokenTypeEnum
 */
function mapAcornTokenType(
  acornToken: acorn.Token,
  source: string,
  isInImport = false
): TokenTypeEnum {
  const type = acornToken.type;

  // Keywords
  if (type === acorn.tokTypes._import) return TokenTypeEnum.IMPORT;
  if (type === acorn.tokTypes._export) return TokenTypeEnum.EXPORT;
  if (type === acorn.tokTypes._default) return TokenTypeEnum.DEFAULT;
  if (type === acorn.tokTypes._const) return TokenTypeEnum.CONST;
  if (
    type.keyword === 'let' ||
    (type === acorn.tokTypes.name && source.slice(acornToken.start, acornToken.end) === 'let')
  )
    return TokenTypeEnum.LET;
  if (type === acorn.tokTypes._var) return TokenTypeEnum.VAR;
  if (type === acorn.tokTypes._function) return TokenTypeEnum.FUNCTION;
  if (type === acorn.tokTypes._return) return TokenTypeEnum.RETURN;
  if (type === acorn.tokTypes._if) return TokenTypeEnum.IF;
  if (type === acorn.tokTypes._else) return TokenTypeEnum.ELSE;
  if (type === acorn.tokTypes._for) return TokenTypeEnum.FOR;
  if (type === acorn.tokTypes._while) return TokenTypeEnum.WHILE;
  if (type === acorn.tokTypes._true) return TokenTypeEnum.TRUE;
  if (type === acorn.tokTypes._false) return TokenTypeEnum.FALSE;
  if (type === acorn.tokTypes._null) return TokenTypeEnum.NULL;
  if (type === acorn.tokTypes._new) return TokenTypeEnum.NEW;
  if (type === acorn.tokTypes._throw) return TokenTypeEnum.THROW;
  if (type === acorn.tokTypes._instanceof) return TokenTypeEnum.INSTANCEOF;
  if (type === acorn.tokTypes._typeof) return TokenTypeEnum.TYPEOF;
  if (type === acorn.tokTypes._delete) return TokenTypeEnum.DELETE;

  // Check for PSR-specific keywords (component, interface)
  if (type === acorn.tokTypes.name) {
    const value = source.slice(acornToken.start, acornToken.end);

    // In import statements, treat "component" as an identifier, not a keyword
    if (value === 'component' && !isInImport) return TokenTypeEnum.COMPONENT;
    if (value === 'interface') return TokenTypeEnum.INTERFACE;
    if (value === 'from') return TokenTypeEnum.FROM;
    if (value === 'undefined') return TokenTypeEnum.UNDEFINED;
    return TokenTypeEnum.IDENTIFIER;
  }

  // Literals
  if (type === acorn.tokTypes.string) return TokenTypeEnum.STRING;
  if (type === acorn.tokTypes.num) return TokenTypeEnum.NUMBER;
  if (type === acorn.tokTypes.regexp) return TokenTypeEnum.REGEX;

  // Template literals - ACORN tokenizes these as sequences
  if (type === acorn.tokTypes.template) {
    // ACORN 'template' tokens are the text content between interpolations
    // Don't try to merge them - let the parser handle the sequence
    return TokenTypeEnum.TEMPLATE_LITERAL;
  }
  if (type.label === '${') return TokenTypeEnum.LBRACE; // Template expression start
  if (type.label === '`') {
    // Backticks mark template boundaries
    // For PSR parser compatibility, we need to signal template boundaries
    return TokenTypeEnum.TEMPLATE_LITERAL; // Let parser recognize template boundaries
  }
  if (type === acorn.tokTypes.dollarBraceL) return TokenTypeEnum.LBRACE; // ${

  // Handle standalone backticks (JSX+ACORN emits these as separate tokens)
  if (type.label === '`') {
    // This is the opening backtick of a template literal
    // The next token will be the template content
    // We'll treat the backtick itself as part of the upcoming TEMPLATE token
    // For now, consume it but don't emit a token - let the template token handle it
    // Actually, the parser might need to see this. Let's skip it and handle in parser
    // NO - return STRING for simple case, parser will handle template construction
    return TokenTypeEnum.STRING; // Treat as string delimiter for simple templates
  }

  // Operators
  if (type === acorn.tokTypes.eq) return TokenTypeEnum.EQUALS;
  if (type === acorn.tokTypes.arrow) return TokenTypeEnum.ARROW;
  if (type === acorn.tokTypes.colon) return TokenTypeEnum.COLON;
  if (type === acorn.tokTypes.question) return TokenTypeEnum.QUESTION;
  if (type.keyword === '??') return TokenTypeEnum.QUESTION_QUESTION;
  if (type === acorn.tokTypes.questionDot) return TokenTypeEnum.QUESTION_DOT;
  if (type === acorn.tokTypes.plusMin) {
    const value = source.slice(acornToken.start, acornToken.end);
    return value === '+' ? TokenTypeEnum.PLUS : TokenTypeEnum.MINUS;
  }
  if (type === acorn.tokTypes.incDec) {
    const value = source.slice(acornToken.start, acornToken.end);
    return value === '++' ? TokenTypeEnum.PLUS_PLUS : TokenTypeEnum.MINUS_MINUS;
  }
  if (type === acorn.tokTypes.star) return TokenTypeEnum.STAR;
  if (type === acorn.tokTypes.slash) return TokenTypeEnum.SLASH;
  if (type === acorn.tokTypes.modulo) return TokenTypeEnum.PERCENT;
  if (type === acorn.tokTypes.starstar) return TokenTypeEnum.EXPONENTIATION;
  if (type === acorn.tokTypes.bitwiseAND) return TokenTypeEnum.AMPERSAND;
  if (type === acorn.tokTypes.bitwiseOR) return TokenTypeEnum.PIPE;
  if (type === acorn.tokTypes.prefix && source[acornToken.start] === '!')
    return TokenTypeEnum.EXCLAMATION;

  // Equality
  if (type === acorn.tokTypes.equality) {
    const value = source.slice(acornToken.start, acornToken.end);
    if (value === '==') return TokenTypeEnum.EQUALS_EQUALS;
    if (value === '===') return TokenTypeEnum.EQUALS_EQUALS_EQUALS;
    if (value === '!=') return TokenTypeEnum.NOT_EQUALS;
    if (value === '!==') return TokenTypeEnum.NOT_EQUALS_EQUALS;
  }

  // Logical
  if (type === acorn.tokTypes.logicalAND) return TokenTypeEnum.AMPERSAND_AMPERSAND;
  if (type === acorn.tokTypes.logicalOR) return TokenTypeEnum.PIPE_PIPE;

  // Relational
  if (type === acorn.tokTypes.relational) {
    const value = source.slice(acornToken.start, acornToken.end);
    if (value === '<') return TokenTypeEnum.LT;
    if (value === '>') return TokenTypeEnum.GT;
    if (value === '<=') return TokenTypeEnum.LT_EQUALS;
    if (value === '>=') return TokenTypeEnum.GT_EQUALS;
  }

  // Shift operators
  if (type === acorn.tokTypes.bitShift) {
    const value = source.slice(acornToken.start, acornToken.end);
    if (value === '<<') return TokenTypeEnum.LT_LT;
    if (value === '>>') return TokenTypeEnum.GT_GT;
    if (value === '>>>') return TokenTypeEnum.GT_GT_GT;
  }

  // Delimiters
  if (type === acorn.tokTypes.semi) return TokenTypeEnum.SEMICOLON;
  if (type === acorn.tokTypes.comma) return TokenTypeEnum.COMMA;
  if (type === acorn.tokTypes.dot) return TokenTypeEnum.DOT;
  if (type === acorn.tokTypes.parenL) return TokenTypeEnum.LPAREN;
  if (type === acorn.tokTypes.parenR) return TokenTypeEnum.RPAREN;
  if (type === acorn.tokTypes.braceL) return TokenTypeEnum.LBRACE;
  if (type === acorn.tokTypes.braceR) return TokenTypeEnum.RBRACE;
  if (type === acorn.tokTypes.bracketL) return TokenTypeEnum.LBRACKET;
  if (type === acorn.tokTypes.bracketR) return TokenTypeEnum.RBRACKET;

  // JSX Tokens - convert to basic tokens that parser understands
  // Parser constructs JSX from LT + IDENTIFIER + GT patterns
  if (type.label === 'jsxTagStart') return TokenTypeEnum.LT; // <div becomes LT token
  if (type.label === 'jsxTagEnd') return TokenTypeEnum.GT; // > becomes GT token
  if (type.label === 'jsxName') return TokenTypeEnum.IDENTIFIER; // tag/attr names are identifiers
  if (type.label === 'jsxText') return TokenTypeEnum.JSX_TEXT; // text content between tags
  if (type.label === 'jsxTagSelfClosing') return TokenTypeEnum.SLASH; // /> self-closing

  // Assignment operators
  if (type === acorn.tokTypes.assign) {
    const value = source.slice(acornToken.start, acornToken.end);
    if (value === '=') return TokenTypeEnum.EQUALS;
    // For compound assignments, map to the base operator for now
    // The parser can handle these if needed
    return TokenTypeEnum.EQUALS;
  }

  // EOF
  if (type === acorn.tokTypes.eof) return TokenTypeEnum.EOF;

  // Spread/Rest (three dots)
  if (type === acorn.tokTypes.ellipsis) return TokenTypeEnum.SPREAD;

  // Default fallback
  console.warn(
    `⚠️ Unmapped ACORN token type: ${type.label} at ${acornToken.start}-${acornToken.end}`
  );
  return TokenTypeEnum.IDENTIFIER;
}

/**
 * Calculate line and column from position in source
 */
function getLineColumn(source: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let i = 0; i < position && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Convert ACORN token to PSR token
 */
function convertAcornToken(acornToken: acorn.Token, source: string, isInImport = false): IToken {
  const { line, column } = getLineColumn(source, acornToken.start);
  const tokenType = mapAcornTokenType(acornToken, source, isInImport);

  // CRITICAL: For STRING tokens, use acornToken's parsed value (without quotes)
  // NOT source.slice() which includes the quotes
  // ACORN stores the parsed string value but TypeScript types don't expose it
  const acornTokenAny = acornToken as any;
  const value =
    tokenType === TokenTypeEnum.STRING && acornTokenAny.value !== undefined
      ? String(acornTokenAny.value) // ACORN provides value without quotes
      : source.slice(acornToken.start, acornToken.end); // For other tokens, use slice

  return {
    type: tokenType,
    value,
    start: acornToken.start,
    end: acornToken.end,
    line,
    column,
  };
}

/**
 * Tokenize PSR source using ACORN+JSX
 * Returns array of tokens compatible with existing PSR parser
 *
 * JSX tokens are converted to basic primitives (LT, GT, IDENTIFIER) that
 * the parser knows how to assemble into JSX AST nodes.
 */
export function tokenizeWithAcorn(source: string, filePath?: string): IToken[] {
  const commentTokens: IToken[] = [];

  try {
    // Tokenize with ACORN+JSX
    const tokenizer = AcornJSX.tokenizer(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      onComment: (isBlock, text, start, end) => {
        // Preserve comments as tokens
        if (isBlock) {
          const { line, column } = getLineColumn(source, start);
          commentTokens.push({
            type: TokenTypeEnum.COMMENT,
            value: `/*${text}*/`,
            start,
            end,
            line,
            column,
          });
        }
      },
    });

    // Convert all tokens
    const rawTokens: IToken[] = [];
    let isInImport = false; // Track import context

    for (const acornToken of tokenizer) {
      const token = convertAcornToken(acornToken, source, isInImport);
      rawTokens.push(token);

      // Track import context
      if (token.type === TokenTypeEnum.IMPORT) {
        isInImport = true;
      } else if (token.type === TokenTypeEnum.SEMICOLON) {
        isInImport = false;
      }
    }

    // Merge comment tokens with regular tokens and sort by position
    const allTokens = [...rawTokens, ...commentTokens].sort((a, b) => a.start - b.start);

    // Reconstruct complete template literals from ACORN's tokenization
    // ACORN splits: `hello ${name}` into: ` + template + ${ + name + } + template + `
    // PSR parser expects: single TEMPLATE_LITERAL token with full content
    const tokens: IToken[] = [];
    let i = 0;

    while (i < allTokens.length) {
      const token = allTokens[i];

      // Check for template literal start: backtick
      if (token.type === TokenTypeEnum.TEMPLATE_LITERAL && token.value === '`') {
        // Reconstruct the complete template literal
        let templateContent = '`';
        let templateStart = token.start;
        let templateEnd = token.end;
        i++; // Move past opening backtick

        // Track open templates using a stack of brace depths
        // Each entry represents a template opened at that brace depth
        // We start with one template at current depth (which is effectively 0 for this localized tracking)
        let currentBraceDepth = 0;
        let templateStack: number[] = [0];

        // Collect tokens until the outer template is closed
        while (i < allTokens.length) {
          const currentToken = allTokens[i];

          // Check for template boundaries (backticks)
          if (currentToken.type === TokenTypeEnum.TEMPLATE_LITERAL && currentToken.value === '`') {
            const expectedDepth = templateStack[templateStack.length - 1];

            if (currentBraceDepth === expectedDepth) {
              // Closing backtick for the current innermost template
              templateStack.pop();

              // If stack is empty, we closed the outermost template
              if (templateStack.length === 0) {
                templateContent += '`'; // Add closing backtick
                templateEnd = currentToken.end;
                i++; // Consume the token
                break; // Done with this template literal
              }
            } else {
              // Opening backtick for a nested template
              templateStack.push(currentBraceDepth);
            }
          } else if (currentToken.type === TokenTypeEnum.LBRACE) {
            currentBraceDepth++;
          } else if (currentToken.type === TokenTypeEnum.RBRACE) {
            if (currentBraceDepth > 0) currentBraceDepth--;
          }

          // Reconstruct token content from source
          const tokenContent = source.slice(currentToken.start, currentToken.end);
          templateContent += tokenContent;
          templateEnd = currentToken.end;
          i++;
        }

        // Create merged template literal token
        const templateToken: IToken = {
          type: TokenTypeEnum.TEMPLATE_LITERAL,
          value: templateContent,
          start: templateStart,
          end: templateEnd,
          line: token.line,
          column: token.column,
        };
        tokens.push(templateToken);
      } else {
        // Pass through non-template tokens
        tokens.push(token);
        i++;
      }
    }

    // Ensure EOF token
    if (tokens.length === 0 || tokens[tokens.length - 1].type !== TokenTypeEnum.EOF) {
      const { line, column } = getLineColumn(source, source.length);
      tokens.push({
        type: TokenTypeEnum.EOF,
        value: '',
        start: source.length,
        end: source.length,
        line,
        column,
      });
    }

    console.log(
      `✅ ACORN tokenized: ${tokens.length} tokens (including Unicode, templates, ESNext)`
    );
    return tokens;
  } catch (error: any) {
    console.error('❌ ACORN tokenization failed:', error.message);
    console.error(`   File: ${filePath}`);
    console.error(`   Position: ${error.pos}`);

    // Return EOF token on error
    return [
      {
        type: TokenTypeEnum.EOF,
        value: '',
        start: 0,
        end: 0,
        line: 1,
        column: 1,
      },
    ];
  }
}
