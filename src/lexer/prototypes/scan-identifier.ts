/**
 * Lexer.prototype.scanIdentifier
 * Scans identifier or keyword
 */

import { Lexer } from '../lexer.js'
import type { ILexer } from '../lexer.types.js'
import { isAlphaNumeric, LexerStateEnum, TokenTypeEnum } from '../lexer.types.js'

Lexer.prototype.scanIdentifier = function (this: ILexer): void {
  const start = this.pos;

  // First char already validated as isAlpha
  this.advance();

  // Continue while alphanumeric
  while (!this.isAtEnd() && isAlphaNumeric(this.peek())) {
    this.advance();
  }

  // Extract identifier text
  const text = this.source.substring(start, this.pos);

  // Check if keyword
  let keywordType = this.isKeyword(text);

  // Context-aware keyword handling: "component" is ONLY a keyword outside JSX
  // In JSX attributes like <Route component={Foo} />, treat as identifier
  if (keywordType === TokenTypeEnum.COMPONENT) {
    const currentState = this.getState();
    if (currentState === LexerStateEnum.InsideJSX) {
      console.log(`[LEXER-DEBUG] "component" found in InsideJSX state → treating as IDENTIFIER`);
      keywordType = null; // Treat as identifier in JSX context
    } else {
      console.log(`[LEXER-DEBUG] "component" found in ${currentState} state → treating as COMPONENT keyword`);
    }
  }

  if (keywordType) {
    this.addToken(keywordType, text);
  } else {
    this.addToken(TokenTypeEnum.IDENTIFIER, text);
  }
};
