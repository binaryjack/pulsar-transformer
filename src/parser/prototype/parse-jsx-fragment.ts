/**
 * Parse JSX Fragment
 *
 * Parses JSX fragment syntax: <>children</>
 *
 * @example
 * <>
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 * </>
 */

import type { IPSRFragmentNode } from '../ast/index.js';
import { ASTNodeType } from '../ast/index.js';
import type { IParserInternal } from '../parser.types.js';

/**
 * Parse JSX fragment
 *
 * Grammar:
 *   < > Children* < / >
 */
export function parseJSXFragment(this: IParserInternal): IPSRFragmentNode {
  const startToken = this._getCurrentToken()!;

  // Consume '<'
  this._expect('LT', 'Expected "<"');

  // Expect '>' for opening fragment tag
  this._expect('GT', 'Expected ">" for fragment opening');

  // Parse children
  const children: any[] = [];

  while (!this._isClosingFragment() && !this._isAtEnd()) {
    const child = this._parsePSRChild(undefined);
    if (child) {
      children.push(child);
    }
  }

  // Parse closing fragment tag: </>
  this._expect('LESS_THAN_SLASH', 'Expected "</" for fragment closing');
  this._expect('GT', 'Expected ">" after fragment closing');

  const endToken = this._getCurrentToken() || startToken;

  return {
    type: ASTNodeType.PSR_FRAGMENT,
    children,
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

/**
 * Check if current position is at closing fragment tag: </>
 */
export function _isClosingFragment(this: IParserInternal): boolean {
  return this._check('LESS_THAN_SLASH') && this._peek(1)?.type === 'GT';
}
