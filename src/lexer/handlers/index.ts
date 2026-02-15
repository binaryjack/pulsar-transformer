/**
 * Initialize all token handlers
 * This replaces the monolithic switch statement with a registry pattern
 */

import { registerHandler } from './handler-registry.js';
import { handleLessThan } from './handle-less-than.js';
import { handleGreaterThan } from './handle-greater-than.js';
import { handleLeftBrace, handleRightBrace, handleLeftParen, handleRightParen, handleLeftBracket, handleRightBracket } from './handle-delimiters.js';
import { handleQuote, handleBacktick } from './handle-strings.js';
import {
  handlePlus,
  handleMinus,
  handleStar,
  handlePercent,
  handleEquals,
  handleExclamation,
  handleAmpersand,
  handlePipe,
  handleQuestion,
  handleDot,
  handleSlash,
  handleSemicolon,
  handleComma,
  handleColon,
} from './handle-operators.js';

/**
 * Register all token handlers
 * Called once during lexer initialization
 */
export function initializeTokenHandlers(): void {
  // JSX and comparison
  registerHandler('<', handleLessThan);
  registerHandler('>', handleGreaterThan);

  // Delimiters
  registerHandler('{', handleLeftBrace);
  registerHandler('}', handleRightBrace);
  registerHandler('(', handleLeftParen);
  registerHandler(')', handleRightParen);
  registerHandler('[', handleLeftBracket);
  registerHandler(']', handleRightBracket);

  // Strings
  registerHandler('"', handleQuote);
  registerHandler("'", handleQuote);
  registerHandler('`', handleBacktick);

  // Operators
  registerHandler('+', handlePlus);
  registerHandler('-', handleMinus);
  registerHandler('*', handleStar);
  registerHandler('%', handlePercent);
  registerHandler('=', handleEquals);
  registerHandler('!', handleExclamation);
  registerHandler('&', handleAmpersand);
  registerHandler('|', handlePipe);
  registerHandler('?', handleQuestion);
  registerHandler('.', handleDot);
  registerHandler('/', handleSlash);

  // Punctuation
  registerHandler(';', handleSemicolon);
  registerHandler(',', handleComma);
  registerHandler(':', handleColon);
}
