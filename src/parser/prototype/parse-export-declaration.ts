/**
 * Parse Export Declaration
 *
 * Parses export statements in PSR files.
 *
 * @example
 * export { foo, bar };
 * export { foo as bar };
 * export const x = 1;
 * export default Component;
 * export * from './utils';
 * export { foo } from './utils';
 */

import type { IExportDeclarationNode, IIdentifierNode, ILiteralNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse export declaration
 *
 * Grammar:
 *   export { specifier1, specifier2 };
 *   export { specifier as alias };
 *   export const name = value;
 *   export default expression;
 *   export * from "module";
 *   export { foo } from "module";
 */
export function parseExportDeclaration(this: IParserInternal): IExportDeclarationNode {
  const startToken = this._getCurrentToken()!;

  // Consume 'export' keyword
  this._advance();

  let declaration: any = null;
  const specifiers: IIdentifierNode[] = [];
  let source: ILiteralNode | null = null;
  let exportKind: 'named' | 'default' | 'all' = 'named';
  let isTypeOnly = false;

  // Check for type-only export: export type { Foo } from './types'
  if (this._check('TYPE')) {
    const nextToken = this._tokens[this._current + 1];
    if (nextToken && nextToken!.type === 'LBRACE') {
      isTypeOnly = true;
      this._advance(); // consume 'type'
    }
  }

  // Check for default export: export default ...
  if (this._check('DEFAULT')) {
    this._advance(); // consume 'default'
    exportKind = 'default';

    // For now, just consume the rest until semicolon
    // TODO: Properly parse the default export expression
    while (!this._check('SEMICOLON') && !this._isAtEnd()) {
      this._advance();
    }
    this._match('SEMICOLON');

    const endToken = this._getCurrentToken() || startToken;

    return {
      type: ASTNodeType.EXPORT_DECLARATION,
      declaration: null,
      specifiers: [],
      source: null,
      exportKind,
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

  // Check for export * from 'module'
  if (this._check('ASTERISK')) {
    this._advance(); // consume *
    exportKind = 'all';

    // Check for 'as name' (namespace re-export)
    if (this._match('AS')) {
      const nameToken = this._expect('IDENTIFIER', 'Expected identifier after as');
      specifiers.push({
        type: ASTNodeType.IDENTIFIER,
        name: nameToken!.value,
        location: {
          start: {
            line: nameToken!.line,
            column: nameToken!.column,
            offset: nameToken!.start,
          },
          end: {
            line: nameToken!.line,
            column: nameToken!.column + nameToken!.value.length,
            offset: nameToken!.end,
          },
        },
      });
    }

    // Expect 'from'
    const fromToken = this._getCurrentToken();
    if (!fromToken || fromToken!.value !== 'from') {
      this._addError({
        code: 'MISSING_FROM',
        message: "Expected 'from' after export *",
        location: (fromToken
          ? {
              start: {
                line: fromToken!.line,
                column: fromToken!.column,
              },
              end: {
                line: fromToken!.line,
                column: fromToken!.column + fromToken!.value.length,
              },
            }
          : {
              start: {
                line: startToken!.line,
                column: startToken!.column,
              },
              end: { line: startToken!.line, column: startToken!.column },
            }) as any,
      });
    } else {
      this._advance(); // consume 'from'
    }

    // Parse module source
    const sourceToken = this._expect('STRING', 'Expected module path after from');
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
          column: sourceToken!.column + sourceToken!.value.length + 2,
          offset: sourceToken!.end,
        },
      },
    };

    this._match('SEMICOLON');

    const endToken = this._getCurrentToken() || sourceToken;

    return {
      type: ASTNodeType.EXPORT_DECLARATION,
      declaration: null,
      specifiers,
      source,
      exportKind,
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

  // Check for named exports: export { foo, bar }
  if (this._check('LBRACE')) {
    this._advance(); // consume {
    exportKind = 'named';

    // Parse specifiers
    while (!this._check('RBRACE') && !this._isAtEnd()) {
      // Check for inline type: export { type Foo, Bar }
      let isSpecifierTypeOnly = false;
      if (this._check('TYPE')) {
        const nextToken = this._tokens[this._current + 1];
        if (nextToken && nextToken!.type === 'IDENTIFIER') {
          isSpecifierTypeOnly = true;
          this._advance(); // consume 'type'
        }
      }

      const specToken = this._expect('IDENTIFIER', 'Expected export specifier');

      // Check for alias: export { foo as bar }
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

      if (!this._match('COMMA')) {
        break;
      }
    }

    this._expect('RBRACE', 'Expected } after export specifiers');

    // Check for 'from' (re-export)
    const fromToken = this._getCurrentToken();
    if (fromToken && fromToken!.value === 'from') {
      this._advance(); // consume 'from'

      const sourceToken = this._expect('STRING', 'Expected module path after from');
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
            column: sourceToken!.column + sourceToken!.value.length + 2,
            offset: sourceToken!.end,
          },
        },
      };
    }

    this._match('SEMICOLON');
  }

  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.EXPORT_DECLARATION,
    declaration,
    specifiers,
    source,
    exportKind,
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
