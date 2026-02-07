/**
 * Unicode Handler Tests
 *
 * Tests for unicode escape/unescape functionality.
 */

import { describe, expect, it } from 'vitest';
import {
  analyzeUnicode,
  escapeUnicode,
  getCodePoint,
  needsUnicodeEscape,
  unescapeUnicode,
} from '../src/unicode-handler.js';

describe('Unicode Handler', () => {
  describe('needsUnicodeEscape()', () => {
    it('should return false for ASCII text', () => {
      expect(needsUnicodeEscape('hello world')).toBe(false);
      expect(needsUnicodeEscape('123')).toBe(false);
      expect(needsUnicodeEscape('ABC')).toBe(false);
    });

    it('should return true for control characters', () => {
      expect(needsUnicodeEscape('\0')).toBe(true); // NULL
      expect(needsUnicodeEscape('\n')).toBe(true); // LF
      expect(needsUnicodeEscape('\r')).toBe(true); // CR
      expect(needsUnicodeEscape('\t')).toBe(true); // TAB
    });

    it('should return true for DELETE and C1 controls', () => {
      expect(needsUnicodeEscape('\x7F')).toBe(true); // DELETE
      expect(needsUnicodeEscape('\x80')).toBe(true); // C1 start
      expect(needsUnicodeEscape('\x9F')).toBe(true); // C1 end
    });

    it('should return true for high unicode', () => {
      expect(needsUnicodeEscape('中文')).toBe(true);
      expect(needsUnicodeEscape('தமிழ்')).toBe(true);
      expect(needsUnicodeEscape('Привет')).toBe(true);
    });

    it('should return true for emoji (astral plane)', () => {
      expect(needsUnicodeEscape('😀')).toBe(true);
      expect(needsUnicodeEscape('🚀')).toBe(true);
      expect(needsUnicodeEscape('❤️')).toBe(true);
    });

    it('should return true for quotes and backslashes', () => {
      expect(needsUnicodeEscape('"')).toBe(true);
      expect(needsUnicodeEscape('\\')).toBe(true);
    });
  });

  describe('escapeUnicode()', () => {
    it('should escape control characters', () => {
      expect(escapeUnicode('\0')).toBe('\\u0000');
      expect(escapeUnicode('\n')).toBe('\\u000A');
      expect(escapeUnicode('\r')).toBe('\\u000D');
      expect(escapeUnicode('\t')).toBe('\\u0009');
    });

    it('should escape DELETE', () => {
      expect(escapeUnicode('\x7F')).toBe('\\u007F');
    });

    it('should escape C1 controls', () => {
      expect(escapeUnicode('\x80')).toBe('\\u0080');
      expect(escapeUnicode('\x9F')).toBe('\\u009F');
    });

    it('should escape Chinese characters', () => {
      expect(escapeUnicode('中')).toBe('\\u4E2D');
      expect(escapeUnicode('文')).toBe('\\u6587');
    });

    it('should escape Tamil characters', () => {
      expect(escapeUnicode('த')).toBe('\\u0BA4');
      expect(escapeUnicode('ம')).toBe('\\u0BAE');
      expect(escapeUnicode('ி')).toBe('\\u0BBF');
      expect(escapeUnicode('ழ்')).toBe('\\u0BB4\\u0BCD');
    });

    it('should escape emoji (surrogate pairs)', () => {
      expect(escapeUnicode('😀')).toBe('\\uD83D\\uDE00');
      expect(escapeUnicode('🚀')).toBe('\\uD83D\\uDE80');
    });

    it('should escape quotes and backslashes', () => {
      expect(escapeUnicode('"')).toBe('\\u0022');
      expect(escapeUnicode('\\')).toBe('\\u005C');
    });

    it('should preserve ASCII text', () => {
      expect(escapeUnicode('hello')).toBe('hello');
      expect(escapeUnicode('123')).toBe('123');
    });

    it('should handle mixed content', () => {
      expect(escapeUnicode('Hello 世界')).toBe('Hello \\u4E16\\u754C');
      expect(escapeUnicode('Test\nLine')).toBe('Test\\u000ALine');
    });
  });

  describe('unescapeUnicode()', () => {
    it('should unescape control characters', () => {
      expect(unescapeUnicode('\\u0000')).toBe('\0');
      expect(unescapeUnicode('\\u000A')).toBe('\n');
      expect(unescapeUnicode('\\u000D')).toBe('\r');
    });

    it('should unescape Chinese characters', () => {
      expect(unescapeUnicode('\\u4E2D\\u6587')).toBe('中文');
    });

    it('should unescape Tamil characters', () => {
      expect(unescapeUnicode('\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD')).toBe('தமிழ்');
    });

    it('should unescape emoji (surrogate pairs)', () => {
      expect(unescapeUnicode('\\uD83D\\uDE00')).toBe('😀');
      expect(unescapeUnicode('\\uD83D\\uDE80')).toBe('🚀');
    });

    it('should preserve ASCII text', () => {
      expect(unescapeUnicode('hello')).toBe('hello');
      expect(unescapeUnicode('123')).toBe('123');
    });

    it('should handle mixed content', () => {
      expect(unescapeUnicode('Hello \\u4E16\\u754C')).toBe('Hello 世界');
    });
  });

  describe('analyzeUnicode()', () => {
    it('should analyze ASCII text', () => {
      const result = analyzeUnicode('hello');
      expect(result.requiresEscape).toBe(false);
      expect(result.hasControlChars).toBe(false);
      expect(result.hasHighUnicode).toBe(false);
      expect(result.hasAstralPlane).toBe(false);
    });

    it('should detect control characters', () => {
      const result = analyzeUnicode('hello\nworld');
      expect(result.requiresEscape).toBe(true);
      expect(result.hasControlChars).toBe(true);
      expect(result.hasLineBreak).toBe(true);
    });

    it('should detect high unicode', () => {
      const result = analyzeUnicode('中文');
      expect(result.requiresEscape).toBe(true);
      expect(result.hasHighUnicode).toBe(true);
      expect(result.charactersRequiringEscape).toEqual(['中', '文']);
    });

    it('should detect emoji', () => {
      const result = analyzeUnicode('😀');
      expect(result.requiresEscape).toBe(true);
      expect(result.hasAstralPlane).toBe(true);
    });

    it('should count graphemes correctly', () => {
      const result1 = analyzeUnicode('hello');
      expect(result1.graphemeCount).toBe(5);

      const result2 = analyzeUnicode('👨‍👩‍👧‍👦'); // Family emoji (1 grapheme, 7 code points)
      expect(result2.graphemeCount).toBe(1);

      const result3 = analyzeUnicode('நீ'); // Tamil "you" (2 graphemes, 2 code points)
      expect(result3.graphemeCount).toBe(2);
    });

    it('should count bytes correctly', () => {
      const result1 = analyzeUnicode('hello');
      expect(result1.byteLength).toBe(5);

      const result2 = analyzeUnicode('中文');
      expect(result2.byteLength).toBe(6); // 3 bytes each

      const result3 = analyzeUnicode('😀');
      expect(result3.byteLength).toBe(4);
    });
  });

  describe('getCodePoint()', () => {
    it('should get BMP code points', () => {
      expect(getCodePoint('A', 0)).toBe(0x41);
      expect(getCodePoint('中', 0)).toBe(0x4e2d);
    });

    it('should get astral plane code points (surrogate pairs)', () => {
      expect(getCodePoint('😀', 0)).toBe(0x1f600);
      expect(getCodePoint('🚀', 0)).toBe(0x1f680);
    });

    it('should handle strings with multiple characters', () => {
      const str = 'A😀B';
      expect(getCodePoint(str, 0)).toBe(0x41); // A
      expect(getCodePoint(str, 1)).toBe(0x1f600); // 😀
      expect(getCodePoint(str, 3)).toBe(0x42); // B
    });
  });

  describe('roundtrip tests', () => {
    it('should roundtrip Chinese text', () => {
      const original = '你好世界';
      const escaped = escapeUnicode(original);
      const unescaped = unescapeUnicode(escaped);
      expect(unescaped).toBe(original);
    });

    it('should roundtrip Tamil text', () => {
      const original = 'தமிழ்';
      const escaped = escapeUnicode(original);
      const unescaped = unescapeUnicode(escaped);
      expect(unescaped).toBe(original);
    });

    it('should roundtrip emoji', () => {
      const original = '😀🚀❤️';
      const escaped = escapeUnicode(original);
      const unescaped = unescapeUnicode(escaped);
      expect(unescaped).toBe(original);
    });

    it('should roundtrip mixed content', () => {
      const original = 'Hello 世界! 😀\nNext line';
      const escaped = escapeUnicode(original);
      const unescaped = unescapeUnicode(escaped);
      expect(unescaped).toBe(original);
    });
  });
});
