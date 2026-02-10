import type { IASTNode, ISwitchCaseNode, ISwitchStatementNode } from '../ast/ast-node-types.js'
import { ASTNodeType } from '../ast/ast-node-types.js'
import { TokenType } from '../lexer/token-types.js'
import type { IParserInternal } from '../parser.types.js'

/**
 * Parses switch statements
 * Supports: switch (x) { case 1: break; default: break; }
 */
export function _parseSwitchStatement(this: IParserInternal): ISwitchStatementNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  // Expect 'switch' keyword
  if (!this._check('SWITCH')) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'switch', got ${this._getCurrentToken()?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: this._getCurrentToken(),
    });
    return null;
  }

  this._advance(); // Consume 'switch'

  // Expect opening paren
  const lparen = this._getCurrentToken();
  if (!lparen || lparen.type !== TokenType.LPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '(' after 'switch', got ${lparen?.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: lparen,
    });
    return null;
  }

  this._advance(); // Consume '('

  // Parse discriminant expression
  const discriminant = parseExpression.call(this);

  // Expect closing paren
  const rparen = this._getCurrentToken();
  if (!rparen || rparen.type !== TokenType.RPAREN) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected ')' after switch discriminant, got ${rparen?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: rparen,
    });
    if (rparen) this._advance();
  } else {
    this._advance(); // Consume ')'
  }

  // Expect opening brace
  const lbrace = this._getCurrentToken();
  if (!lbrace || lbrace.type !== TokenType.LBRACE) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '{' after switch header, got ${lbrace?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: lbrace,
    });
    return null;
  }

  this._advance(); // Consume '{'

  // Parse cases
  const cases: ISwitchCaseNode[] = [];
  
  // SAFETY: Add position tracking
  let safetyCounter = 0;
  const maxIterations = 50000;

  while (!this._isAtEnd()) {
    const currentToken = this._getCurrentToken();
    if (!currentToken || currentToken.type === TokenType.RBRACE || currentToken.type === TokenType.EOF) {
      break;
    }
    
    if (++safetyCounter > maxIterations) {
      this._addError({
        code: 'PSR-E010',
        message: `Infinite loop detected while parsing switch cases (${maxIterations} iterations exceeded)`,
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      break;
    }
    
    if (this._check('CASE') || this._check('DEFAULT')) {
      const beforePos = this._current;
      const caseNode = _parseSwitchCase.call(this);
      if (caseNode) {
        cases.push(caseNode);
      }
      
      // SAFETY: Ensure progress
      if (this._current === beforePos) {
        this._addError({
          code: 'PSR-E011',
          message: 'Parser stuck in switch case - forcing advance',
          location: {
            line: currentToken.line,
            column: currentToken.column,
          },
        });
        this._advance();
        break;
      }
    } else {
      // Skip unexpected tokens
      this._advance();
    }
  }

  // Expect closing brace
  const rbrace = this._getCurrentToken();
  if (!rbrace || rbrace.type !== TokenType.RBRACE) {
    this._addError({
      code: 'PSR-E001',
      message: `Expected '}' to close switch, got ${rbrace?.value || 'EOF'}`,
      location: { line: startToken!.line, column: startToken!.column },
      token: rbrace,
    });
    // Return what we have so far
  }

  const endToken = this._getCurrentToken() || startToken;
  if (endToken?.type === TokenType.RBRACE) {
    this._advance(); // Consume '}'
  }

  // Build location
  const start = {
    line: startToken!.line,
    column: startToken!.column,
    offset: startToken!.start,
  };

  const end = {
    line: endToken!.line,
    column: endToken!.column + 1,
    offset: endToken!.end,
  };

  return {
    type: ASTNodeType.SWITCH_STATEMENT,
    discriminant,
    cases,
    location: {
      start,
      end,
    },
  } as any;
}

/**
 * Helper: Parse switch case
 */
function _parseSwitchCase(this: IParserInternal): ISwitchCaseNode | null {
  const startToken = this._getCurrentToken();
  
  if (!startToken) {
    return null;
  }

  let test: IASTNode | null = null;

  // Check if 'case' or 'default'
  if (this._check('CASE')) {
    this._advance(); // Consume 'case'

    // Parse test expression
    test = parseExpression.call(this);

    // Expect colon
    const colon1 = this._getCurrentToken();
    if (!colon1 || colon1.type !== TokenType.COLON) {
      this._addError({
        code: 'PSR-E001',
        message: `Expected ':' after case test, got ${colon1?.value || 'EOF'}`,
        location: { line: startToken.line, column: startToken.column },
        token: colon1,
      });
      if (colon1) this._advance();
    } else {
      this._advance(); // Consume ':'
    }
  } else if (this._check('DEFAULT')) {
    this._advance(); // Consume 'default'

    // Expect colon
    const colon2 = this._getCurrentToken();
    if (!colon2 || colon2.type !== TokenType.COLON) {
      this._addError({
        code: 'PSR-E001',
        message: `Expected ':' after 'default', got ${colon2?.value || 'EOF'}`,
        location: { line: startToken.line, column: startToken.column },
        token: colon2,
      });
      if (colon2) this._advance();
    } else {
      this._advance(); // Consume ':'
    }
  } else {
    this._addError({
      code: 'PSR-E001',
      message: `Expected 'case' or 'default', got ${startToken.value || 'EOF'}`,
      location: { line: startToken.line, column: startToken.column },
      token: startToken,
    });
    return null;
  }

  // Parse consequent statements (until next case/default or closing brace)
  const consequent: IASTNode[] = [];
  
  // SAFETY: Add position tracking
  let safetyCounter = 0;
  const maxIterations = 50000;

  while (!this._isAtEnd()) {
    const currentToken = this._getCurrentToken();
    if (!currentToken ||
        currentToken.type === TokenType.RBRACE ||
        currentToken.type === TokenType.EOF ||
        this._check('CASE') ||
        this._check('DEFAULT')) {
      break;
    }
    
    if (++safetyCounter > maxIterations) {
      this._addError({
        code: 'PSR-E010',
        message: `Infinite loop detected while parsing switch case consequent (${maxIterations} iterations exceeded)`,
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      break;
    }
    
    const beforePos = this._current;
    const statement = this._parseStatement();
    if (statement) {
      consequent.push(statement);
    }
    
    // SAFETY: Ensure progress
    if (this._current === beforePos) {
      this._addError({
        code: 'PSR-E011',
        message: 'Parser stuck in switch case consequent - forcing advance',
        location: {
          line: currentToken.line,
          column: currentToken.column,
        },
      });
      this._advance();
      break;
    }
  }

  const endToken = this._getCurrentToken() || startToken;

  // Build location
  const start = {
    line: startToken!.line,
    column: startToken!.column,
    offset: startToken!.start,
  };

  const end = {
    line: endToken!.line,
    column: endToken!.column,
    offset: endToken!.end,
  };

  return {
    type: ASTNodeType.SWITCH_CASE,
    test,
    consequent,
    location: {
      start,
      end,
    },
  } as any;
}

/**
 * Simple expression parser for switch discriminant
 */
function parseExpression(this: IParserInternal): IASTNode {
  // For now, just grab the identifier or literal
  const token = this._getCurrentToken();

  if (token!.type === TokenType.IDENTIFIER) {
    this._advance();
    return {
      type: ASTNodeType.IDENTIFIER,
      name: token!.value,
      location: {
        start: {
          line: token!.line,
          column: token!.column,
          offset: token!.start,
        },
        end: {
          line: token!.line,
          column: token!.column + token!.value.length,
          offset: token!.end,
        },
      },
    } as any;
  }

  if (token!.type === TokenType.NUMBER || token!.type === TokenType.STRING) {
    this._advance();
    return {
      type: ASTNodeType.LITERAL,
      value: token!.value,
      location: {
        start: {
          line: token!.line,
          column: token!.column,
          offset: token!.start,
        },
        end: {
          line: token!.line,
          column: token!.column + token!.value.length,
          offset: token!.end,
        },
      },
    } as any;
  }

  throw new Error(`Unexpected token in expression: ${token!.value}`);
}
