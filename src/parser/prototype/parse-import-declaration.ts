/**
 * Parse Import Declaration
 *
 * Parses import statements in PSR files.
 *
 * @example
 * import { createSignal } from '@pulsar/runtime';
 * import { Button } from './components';
 * import './styles.css';
 */

import type { IIdentifierNode, IImportDeclarationNode, ILiteralNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse import declaration
 *
 * Grammar:
 *   import { specifier1, specifier2 } from "module" ;
 *   import defaultSpecifier from "module" ;
 *   import "module" ;  (side-effect import)
 */
export function parseImportDeclaration(this: IParserInternal): IImportDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Consume 'import' keyword
  this._advance();

  const specifiers: IIdentifierNode[] = [];
  let source: ILiteralNode | null = null;

  // Check for side-effect import: import 'module';
  if (this._check('STRING')) {
    const sourceToken = this._advance();
    source = {
      type: ASTNodeType.LITERAL,
      value: sourceToken.value,
      raw: `"${sourceToken.value}"`,
      location: {
        start: {
          line: sourceToken.line,
          column: sourceToken.column,
          offset: sourceToken.start,
        },
        end: {
          line: sourceToken.line,
          column: sourceToken.column + sourceToken.value.length + 2, // +2 for quotes
          offset: sourceToken.end,
        },
      },
    };

    // Consume semicolon
    this._match('SEMICOLON');

    const endToken = this._getCurrentToken() || sourceToken;

    return {
      type: ASTNodeType.IMPORT_DECLARATION,
      specifiers,
      source,
      location: {
        start: {
          line: startToken.line,
          column: startToken.column,
          offset: startToken.start,
        },
        end: {
          line: endToken.line,
          column: endToken.column,
          offset: endToken.end,
        },
      },
    };
  }

  // Check for named imports: { name1, name2 }
  if (this._check('LBRACE')) {
    this._advance(); // consume {

    // Parse specifiers (handle empty case and trailing comma)
    while (!this._check('RBRACE') && !this._isAtEnd()) {
      const specToken = this._expect('IDENTIFIER', 'Expected import specifier');
      specifiers.push({
        type: ASTNodeType.IDENTIFIER,
        name: specToken.value,
        location: {
          start: {
            line: specToken.line,
            column: specToken.column,
            offset: specToken.start,
          },
          end: {
            line: specToken.line,
            column: specToken.column + specToken.value.length,
            offset: specToken.end,
          },
        },
      });

      // If no comma, we're done
      if (!this._match('COMMA')) {
        break;
      }
    }

    this._expect('RBRACE', 'Expected } after import specifiers');
  } else if (this._check('IDENTIFIER')) {
    // Default import: import name from 'module'
    const specToken = this._advance();
    specifiers.push({
      type: ASTNodeType.IDENTIFIER,
      name: specToken.value,
      location: {
        start: {
          line: specToken.line,
          column: specToken.column,
          offset: specToken.start,
        },
        end: {
          line: specToken.line,
          column: specToken.column + specToken.value.length,
          offset: specToken.end,
        },
      },
    });
  }

  // Expect 'from' keyword
  const fromToken = this._getCurrentToken();
  if (!fromToken || fromToken.value !== 'from') {
    this._addError({
      code: 'MISSING_FROM',
      message: "Expected 'from' after import specifiers",
      location: fromToken
        ? {
            start: {
              line: fromToken.line,
              column: fromToken.column,
              offset: fromToken.start,
            },
            end: {
              line: fromToken.line,
              column: fromToken.column + fromToken.value.length,
              offset: fromToken.end,
            },
          }
        : {
            start: { line: startToken.line, column: startToken.column, offset: startToken.start },
            end: { line: startToken.line, column: startToken.column, offset: startToken.end },
          },
    });

    // Try to recover - skip to semicolon
    while (!this._check('SEMICOLON') && !this._isAtEnd()) {
      this._advance();
    }
    this._match('SEMICOLON');

    return {
      type: ASTNodeType.IMPORT_DECLARATION,
      specifiers,
      source: {
        type: ASTNodeType.LITERAL,
        value: '',
        raw: '""',
        location: {
          start: { line: startToken.line, column: startToken.column, offset: startToken.start },
          end: { line: startToken.line, column: startToken.column, offset: startToken.end },
        },
      },
      location: {
        start: {
          line: startToken.line,
          column: startToken.column,
          offset: startToken.start,
        },
        end: {
          line: startToken.line,
          column: startToken.column,
          offset: startToken.end,
        },
      },
    };
  }

  this._advance(); // consume 'from'

  // Parse module source (string literal)
  const sourceToken = this._expect('STRING', 'Expected module path after from');
  source = {
    type: ASTNodeType.LITERAL,
    value: sourceToken.value,
    raw: `"${sourceToken.value}"`,
    location: {
      start: {
        line: sourceToken.line,
        column: sourceToken.column,
        offset: sourceToken.start,
      },
      end: {
        line: sourceToken.line,
        column: sourceToken.column + sourceToken.value.length + 2, // +2 for quotes
        offset: sourceToken.end,
      },
    },
  };

  // Consume semicolon
  this._match('SEMICOLON');

  const endToken = this._getCurrentToken() || sourceToken;

  return {
    type: ASTNodeType.IMPORT_DECLARATION,
    specifiers,
    source,
    location: {
      start: {
        line: startToken.line,
        column: startToken.column,
        offset: startToken.start,
      },
      end: {
        line: endToken.line,
        column: endToken.column,
        offset: endToken.end,
      },
    },
  };
}
