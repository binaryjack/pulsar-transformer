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

import type { IIdentifierNode, IImportDeclarationNode, ILiteralNode } from '../ast/index.js'
import { ASTNodeType } from '../ast/index.js'
import type { IParserInternal } from '../parser.types.js'

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

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseImportDeclaration: START', {
      currentToken: startToken.type,
      position: this._current,
    });
  }

  // Consume 'import' keyword
  this._advance();

  if (this._logger) {
    this._logger.log('parser', 'debug', 'parseImportDeclaration: After advance', {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  const specifiers: IIdentifierNode[] = [];
  let source: ILiteralNode | null = null;
  let isTypeOnly = false;

  // Check for type-only import: import type { Foo } from './types'
  if (this._check('TYPE')) {
    const nextToken = this._tokens[this._current + 1];
    if (nextToken?.type === 'LBRACE') {
      isTypeOnly = true;
      this._advance(); // consume 'type'
    }
  }

  // Check for side-effect import: import 'module';
  if (this._check('STRING')) {
    const sourceToken = this._advance();
    source = {
      type: ASTNodeType.LITERAL,
      value: sourceToken!.value,
      raw: `"${sourceToken!.value}"`,
      location: {
        start: {
          line: sourceToken!.line,
          column: sourceToken!.column,
          offset: sourceToken!.start,
        },
        end: {
          line: sourceToken!.line,
          column: sourceToken!.column + sourceToken!.value.length + 2, // +2 for quotes
          offset: sourceToken!.end,
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
      importKind: 'side-effect',
      location: {
        start: {
          line: startToken!.line,
          column: startToken!.column,
          offset: startToken!.start,
        },
        end: {
          line: endToken!.line,
          column: endToken!.column,
          offset: endToken!.end,
        },
      },
    };
  }

  // Track import kind
  let importKind: 'named' | 'default' | 'side-effect' | 'namespace' | 'mixed' = 'named';

  // Check for namespace import FIRST (import * as name)
  if (this._check('ASTERISK')) {
    // Namespace import: import * as name from 'module'
    importKind = 'namespace';
    this._advance(); // consume *

    // 'as' keyword can be either AS token or contextual keyword
    if (!this._match('AS')) {
      // Try as contextual keyword
      const asToken = this._expect('IDENTIFIER', 'Expected as after * in namespace import');
      if (asToken.value !== 'as') {
        this._addError({
          code: 'PSR-E001',
          message: 'Expected as after * in namespace import',
          location: { line: asToken.line, column: asToken.column },
          token: asToken,
        });
      }
    }

    const specToken = this._expect('IDENTIFIER', 'Expected identifier after as');
    specifiers.push({
      type: ASTNodeType.IDENTIFIER,
      name: specToken!.value,
      location: {
        start: {
          line: specToken!.line,
          column: specToken!.column,
          offset: specToken!.start,
        },
        end: {
          line: specToken!.line,
          column: specToken!.column + specToken!.value.length,
          offset: specToken!.end,
        },
      },
    });
  }
  // Check for default import (could be alone or followed by named imports)
  else if (this._check('IDENTIFIER')) {
    // Default import: import name from 'module'
    // OR mixed: import name, { named } from 'module'
    const specToken = this._advance();
    specifiers.push({
      type: ASTNodeType.IDENTIFIER,
      name: specToken!.value,
      location: {
        start: {
          line: specToken!.line,
          column: specToken!.column,
          offset: specToken!.start,
        },
        end: {
          line: specToken!.line,
          column: specToken!.column + specToken!.value.length,
          offset: specToken!.end,
        },
      },
    });

    // Check for comma indicating mixed import
    if (this._match('COMMA')) {
      // Mixed import - both default and named
      importKind = 'mixed';
      this._expect('LBRACE', 'Expected { after comma in mixed import');

      // Parse named imports
      while (!this._check('RBRACE') && !this._isAtEnd()) {
        const namedToken = this._expect('IDENTIFIER', 'Expected import specifier');

        // Check for alias: import { foo as bar }
        let alias: string | undefined;
        if (this._match('AS')) {
          const aliasToken = this._expect('IDENTIFIER', 'Expected identifier after as');
          alias = aliasToken!.value;
        }

        specifiers.push({
          type: ASTNodeType.IDENTIFIER,
          name: namedToken!.value,
          alias,
          location: {
            start: {
              line: namedToken!.line,
              column: namedToken!.column,
              offset: namedToken!.start,
            },
            end: {
              line: namedToken!.line,
              column: namedToken!.column + namedToken!.value.length,
              offset: namedToken!.end,
            },
          },
        });

        // If no comma, we're done
        if (!this._match('COMMA')) {
          break;
        }
      }

      this._expect('RBRACE', 'Expected } after named import specifiers');
    } else {
      // Pure default import
      importKind = 'default';
    }
  } else if (this._check('LBRACE')) {
    // Named imports: { name1, name2 }
    this._advance(); // consume {
    importKind = 'named';



    // Parse specifiers (handle empty case and trailing comma)
    let loopCount = 0;
    while (!this._check('RBRACE') && !this._isAtEnd()) {
      loopCount++;
      if (this._logger && loopCount % 10 === 0) {
        this._logger.log('parser', 'warn', `parseImportDeclaration: Loop iteration ${loopCount}`, {
          currentToken: this._getCurrentToken()?.type,
          position: this._current,
        });
      }

      if (loopCount > 100) {
        throw new Error(
          `parseImportDeclaration: Exceeded 100 iterations in named import loop at position ${this._current}`
        );
      }

      if (this._logger && loopCount <= 5) {
        this._logger.log(
          'parser',
          'debug',
          `parseImportDeclaration: Loop ${loopCount}, about to parse specifier`,
          {
            currentToken: this._getCurrentToken()?.type,
            tokenValue: this._getCurrentToken()?.value,
            position: this._current,
          }
        );
      }

      // Check for inline type: import { type Foo, Bar }
      let isSpecifierTypeOnly = false;
      if (this._check('TYPE')) {
        const nextToken = this._tokens[this._current + 1];
        if (nextToken?.type === 'IDENTIFIER') {
          isSpecifierTypeOnly = true;
          this._advance(); // consume 'type'
        }
      }

      if (this._logger && loopCount <= 5) {
        this._logger.log('parser', 'debug', `parseImportDeclaration: About to expect IDENTIFIER`, {
          currentToken: this._getCurrentToken()?.type,
          position: this._current,
        });
      }

      const specToken = this._expect('IDENTIFIER', 'Expected import specifier');

      // Check for alias: import { foo as bar }
      let alias: string | undefined;
      if (this._match('AS')) {
        const aliasToken = this._expect('IDENTIFIER', 'Expected identifier after as');
        alias = aliasToken!.value;
      }

      specifiers.push({
        type: ASTNodeType.IDENTIFIER,
        name: specToken!.value,
        alias,
        isTypeOnly: isSpecifierTypeOnly,
        location: {
          start: {
            line: specToken!.line,
            column: specToken!.column,
            offset: specToken!.start,
          },
          end: {
            line: specToken!.line,
            column: specToken!.column + specToken!.value.length,
            offset: specToken!.end,
          },
        },
      });

      // If no comma, we're done
      if (this._logger && loopCount <= 5) {
        this._logger.log(
          'parser',
          'debug',
          `parseImportDeclaration: After adding specifier, checking for comma`,
          {
            currentToken: this._getCurrentToken()?.type,
            tokenValue: this._getCurrentToken()?.value,
            position: this._current,
          }
        );
      }

      if (!this._match('COMMA')) {
        if (this._logger && loopCount <= 5) {
          this._logger.log(
            'parser',
            'debug',
            `parseImportDeclaration: No comma found, breaking loop`,
            {
              currentToken: this._getCurrentToken()?.type,
              position: this._current,
            }
          );
        }
        break;
      }

      if (this._logger && loopCount <= 5) {
        this._logger.log(
          'parser',
          'debug',
          `parseImportDeclaration: Comma found, continuing loop`,
          {
            currentToken: this._getCurrentToken()?.type,
            position: this._current,
          }
        );
      }
    }

    if (this._logger) {
      this._logger.log('parser', 'debug', `parseImportDeclaration: After loop, expecting RBRACE`, {
        currentToken: this._getCurrentToken()?.type,
        tokenValue: this._getCurrentToken()?.value,
        position: this._current,
      });
    }

    this._expect('RBRACE', 'Expected } after import specifiers');

    if (this._logger) {
      this._logger.log('parser', 'debug', `parseImportDeclaration: After RBRACE consume`, {
        currentToken: this._getCurrentToken()?.type,
        tokenValue: this._getCurrentToken()?.value,
        position: this._current,
      });
    }

    if (this._logger) {
      this._logger.log('parser', 'debug', `parseImportDeclaration: EXITING named imports block`, {
        currentToken: this._getCurrentToken()?.type,
        tokenValue: this._getCurrentToken()?.value,
        position: this._current,
      });
    }
  } else if (this._check('IDENTIFIER')) {
    // This branch is now unreachable as IDENTIFIER is handled first above
    // Keeping for safety but default imports are handled earlier
    importKind = 'default';
    const specToken = this._advance();
    specifiers.push({
      type: ASTNodeType.IDENTIFIER,
      name: specToken!.value,
      location: {
        start: {
          line: specToken!.line,
          column: specToken!.column,
          offset: specToken!.start,
        },
        end: {
          line: specToken!.line,
          column: specToken!.column + specToken!.value.length,
          offset: specToken!.end,
        },
      },
    });
  }

  // Expect 'from' keyword
  if (this._logger) {
    this._logger.log(
      'parser',
      'debug',
      `parseImportDeclaration: About to check for 'from' keyword`,
      {
        currentToken: this._getCurrentToken()?.type,
        tokenValue: this._getCurrentToken()?.value,
        position: this._current,
      }
    );
  }

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseImportDeclaration: RIGHT BEFORE try block`);
  }

  try {
    const fromToken = this._getCurrentToken();

    if (this._logger) {
      this._logger.log('parser', 'debug', `parseImportDeclaration: Got fromToken, checking value`, {
        tokenType: fromToken?.type,
        tokenValue: fromToken?.value,
        condition: fromToken?.value !== 'from',
      });
    }

    if (fromToken?.value !== 'from') {
      this._addError({
        code: 'MISSING_FROM',
        message: "Expected 'from' after import specifiers",
        location: (fromToken
          ? {
              start: {
                line: fromToken.line,
                column: fromToken.column,
              },
              end: {
                line: fromToken.line,
                column: fromToken!.column + fromToken!.value.length,
              },
            }
          : {
              start: { line: startToken!.line, column: startToken!.column },
              end: { line: startToken!.line, column: startToken!.column },
            }) as any,
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
            start: {
              line: startToken!.line,
              column: startToken!.column,
              offset: startToken!.start,
            },
            end: { line: startToken!.line, column: startToken!.column, offset: startToken!.end },
          },
        },
        location: {
          start: {
            line: startToken!.line,
            column: startToken!.column,
            offset: startToken!.start,
          },
          end: {
            line: startToken!.line,
            column: startToken!.column,
            offset: startToken!.end,
          },
        },
      };
    }
  } catch (error) {
    if (this._logger) {
      this._logger.error('parser', 'Exception in FROM check', error as Error);
    }
    throw error;
  }

  if (this._logger) {
    this._logger.log(
      'parser',
      'debug',
      `parseImportDeclaration: FROM check passed, about to consume`,
      {
        currentToken: this._getCurrentToken()?.type,
        position: this._current,
      }
    );
  }

  this._advance(); // consume 'from'

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseImportDeclaration: After consuming FROM`, {
      currentToken: this._getCurrentToken()?.type,
      position: this._current,
    });
  }

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseImportDeclaration: About to call _expect('STRING')`, {
      currentToken: this._getCurrentToken()?.type,
      tokenValue: this._getCurrentToken()?.value,
      position: this._current,
    });
  }

  // Parse module source (string literal)
  const sourceToken = this._expect('STRING', 'Expected module path after from');

  if (this._logger) {
    this._logger.log('parser', 'debug', `parseImportDeclaration: After _expect('STRING')`, {
      sourceTokenValue: sourceToken?.value,
      position: this._current,
    });
  }

  source = {
    type: ASTNodeType.LITERAL,
    value: sourceToken!.value,
    raw: `"${sourceToken!.value}"`,
    location: {
      start: {
        line: sourceToken!.line,
        column: sourceToken!.column,
        offset: sourceToken!.start,
      },
      end: {
        line: sourceToken!.line,
        column: sourceToken!.column + sourceToken!.value.length + 2, // +2 for quotes
        offset: sourceToken!.end,
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
    importKind,
    isTypeOnly,
    location: {
      start: {
        line: startToken!.line,
        column: startToken!.column,
        offset: startToken!.start,
      },
      end: {
        line: endToken!.line,
        column: endToken!.column,
        offset: endToken!.end,
      },
    },
  };
}
