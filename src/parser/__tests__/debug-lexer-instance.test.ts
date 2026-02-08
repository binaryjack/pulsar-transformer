/**
 * Debug test to check lexer instance
 */

import { describe, expect, it } from 'vitest';
import { createParser } from '../create-parser.js';

describe('Debug Lexer Instance', () => {
  it('should have _lexer property on parser', () => {
    const parser = createParser() as any;

    console.log('parser:', typeof parser);
    console.log('_lexer:', typeof parser._lexer);
    console.log('_lexer value:', parser._lexer);
    console.log('_lexer.enterTypeContext:', typeof parser._lexer?.enterTypeContext);

    expect(parser._lexer).toBeDefined();
    expect(parser._lexer.enterTypeContext).toBeDefined();
  });

  it('should have _lexer after parse()', () => {
    const parser = createParser() as any;

    parser.parse('function test(x: number) {}');

    console.log('After parse - _lexer:', typeof parser._lexer);
    console.log('After parse - _lexer value:', parser._lexer);
    console.log('After parse - enterTypeContext:', typeof parser._lexer?.enterTypeContext);

    expect(parser._lexer).toBeDefined();
    expect(parser._lexer.enterTypeContext).toBeDefined();
  });
});
