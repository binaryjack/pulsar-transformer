/**
 * Shared Parameter Parsing Functions
 *
 * Strategy Pattern inspired by TypeScript/Babel:
 * - Shared parsing logic (DRY principle)
 * - Strategy pattern for extensibility
 * - Debug tracker injection for observability
 *
 * KEY FIX: This module provides THE SINGLE SOURCE OF TRUTH for parameter parsing.
 * Both parse-function-declaration.ts and parse-component-declaration.ts use this.
 */

import { TokenTypeEnum } from '../../lexer/lexer.types.js';
import type { IParser } from '../parser.js';

/**
 * Shared parameter parsing function.
 * This is what TypeScript does - shared functions, not duplicated code.
 *
 * @param parser The parser instance (IParser)
 * @returns Array of parameter nodes
 */
export function parseParameterList(parser: IParser): any[] {
  const params: any[] = [];

  if (!parser.match(TokenTypeEnum.RPAREN)) {
    do {
      const param = parseParameter(parser);
      params.push(param);

      if (parser.match(TokenTypeEnum.COMMA)) {
        parser.advance();
      }
    } while (!parser.match(TokenTypeEnum.RPAREN));
  }

  return params;
}

/**
 * Parse a single parameter with type annotation.
 *
 * This is the KEY method that fixes the bug:
 * - parse-function-declaration.ts was calling this.parseTypeAnnotation() ✅
 * - parse-component-declaration.ts was manually parsing IDENTIFIER only ❌
 *
 * Now BOTH use this function, which calls parseTypeAnnotation().
 */
export function parseParameter(parser: IParser): any {
  // Parse parameter pattern (can be identifier or destructuring)
  let pattern: any;

  if (parser.match(TokenTypeEnum.LBRACE)) {
    // Object destructuring: {id}
    const patternStart = parser.peek().start;
    parser.advance();

    const properties: any[] = [];

    while (!parser.match(TokenTypeEnum.RBRACE) && !parser.isAtEnd()) {
      const keyToken = parser.expect(TokenTypeEnum.IDENTIFIER);

      // Check for default value: { key = 'default' }
      let defaultValue = null;
      if (parser.match(TokenTypeEnum.EQUALS)) {
        parser.advance(); // consume =
        defaultValue = parser.parsePrimaryExpression();
      }

      properties.push({
        type: 'Property',
        key: {
          type: 'Identifier',
          name: keyToken.value,
          start: keyToken.start,
          end: keyToken.end,
        },
        value: {
          type: 'Identifier',
          name: keyToken.value,
          start: keyToken.start,
          end: keyToken.end,
        },
        shorthand: true,
        defaultValue,
        start: keyToken.start,
        end: keyToken.end,
      });

      if (parser.match(TokenTypeEnum.COMMA)) {
        parser.advance();
      }
    }

    const patternEnd = parser.peek().end;
    parser.expect(TokenTypeEnum.RBRACE);

    pattern = {
      type: 'ObjectPattern',
      properties,
      start: patternStart,
      end: patternEnd,
    };
  } else {
    // Simple identifier
    const paramToken = parser.expect(TokenTypeEnum.IDENTIFIER);
    pattern = {
      type: 'Identifier',
      name: paramToken.value,
      start: paramToken.start,
      end: paramToken.end,
    };
  }

  // Optional parameter: name?: Type
  // Parse the '?' token BEFORE the type annotation
  let optional = false;
  if (parser.match(TokenTypeEnum.QUESTION)) {
    optional = true;
    parser.advance(); // consume ?
  }

  // Type annotation: param: Type
  // THIS is the fix - call parseTypeAnnotation() for ALL contexts
  let typeAnnotation = undefined;
  if (parser.match(TokenTypeEnum.COLON)) {
    parser.advance(); // consume :

    // Call the SHARED parseTypeAnnotation() method
    // This handles ALL type syntax: T[], A | B, {key: Type}, etc.
    typeAnnotation = parser.parseTypeAnnotation();
  }

  return {
    type: 'Parameter',
    pattern,
    optional,
    typeAnnotation,
    start: pattern.start,
    end: typeAnnotation?.end || pattern.end,
  };
}

/**
 * Strategy interface for extensibility.
 * Different contexts can implement different behaviors.
 */
export interface IParameterParsingStrategy {
  /**
   * Parse parameter list for this context.
   * @param parser The parser instance
   * @returns Array of parameter nodes
   */
  parseParameterList(parser: IParser): any[];
}

/**
 * Strategy for function parameters.
 */
export class FunctionParameterStrategy implements IParameterParsingStrategy {
  parseParameterList(parser: IParser): any[] {
    // Use the shared implementation
    return parseParameterList(parser);
  }
}

/**
 * Strategy for component parameters.
 */
export class ComponentParameterStrategy implements IParameterParsingStrategy {
  parseParameterList(parser: IParser): any[] {
    // Use the shared implementation
    // Components have the same parameter syntax as functions
    return parseParameterList(parser);
  }
}

/**
 * Strategy for arrow function parameters.
 */
export class ArrowFunctionParameterStrategy implements IParameterParsingStrategy {
  parseParameterList(parser: IParser): any[] {
    // Use the shared implementation
    return parseParameterList(parser);
  }
}

/**
 * Factory for creating parameter parsing strategies.
 * This provides the Strategy pattern while keeping shared logic.
 */
export class ParameterParserStrategyFactory {
  private static functionStrategy = new FunctionParameterStrategy();
  private static componentStrategy = new ComponentParameterStrategy();
  private static arrowFunctionStrategy = new ArrowFunctionParameterStrategy();

  static forFunction(): IParameterParsingStrategy {
    return this.functionStrategy;
  }

  static forComponent(): IParameterParsingStrategy {
    return this.componentStrategy;
  }

  static forArrowFunction(): IParameterParsingStrategy {
    return this.arrowFunctionStrategy;
  }
}
