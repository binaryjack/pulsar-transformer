/**
 * Unit Tests - Unicode Escaper
 */

import { describe, expect, it } from 'vitest';
import { escapeStringLiteral, escapeUnicode, needsUnicodeEscape } from '../unicode-escaper.js';

describe('Unicode Escaper', () => {
  describe('needsUnicodeEscape', () => {
    it('should return false for ASCII text', () => {
      expect(needsUnicodeEscape('Hello World')).toBe(false);
      expect(needsUnicodeEscape('ABC123')).toBe(false);
      expect(needsUnicodeEscape('!@#$%^&*()')).toBe(false);
    });

    it('should return true for Tamil characters', () => {
      expect(needsUnicodeEscape('தமிழ்')).toBe(true);
    });

    it('should return true for Chinese characters', () => {
      expect(needsUnicodeEscape('中文')).toBe(true);
    });

    it('should return true for emoji', () => {
      expect(needsUnicodeEscape('😀')).toBe(true);
    });

    it('should return true for mixed content with unicode', () => {
      expect(needsUnicodeEscape('Hello தமிழ்')).toBe(true);
    });

    it('should allow common escape sequences', () => {
      expect(needsUnicodeEscape('Hello\nWorld')).toBe(false);
      expect(needsUnicodeEscape('Hello\tWorld')).toBe(false);
      expect(needsUnicodeEscape('Hello\rWorld')).toBe(false);
    });
  });

  describe('escapeUnicode', () => {
    it('should escape Tamil characters', () => {
      const result = escapeUnicode('தமிழ்');
      expect(result).toBe('\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD');
    });

    it('should escape Chinese characters', () => {
      const result = escapeUnicode('中文');
      expect(result).toBe('\\u4E2D\\u6587');
    });

    it('should escape emoji with surrogate pairs', () => {
      const result = escapeUnicode('😀');
      expect(result).toBe('\\uD83D\\uDE00');
    });

    it('should preserve ASCII characters', () => {
      const result = escapeUnicode('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should handle mixed content', () => {
      const result = escapeUnicode('Hello தமிழ்');
      expect(result).toContain('Hello');
      expect(result).toContain('\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD');
    });

    it('should escape special JavaScript characters', () => {
      const result = escapeUnicode('He said "Hello"');
      expect(result).toBe('He said \\"Hello\\"');
    });

    it('should escape backslashes', () => {
      const result = escapeUnicode('Path\\to\\file');
      expect(result).toBe('Path\\\\to\\\\file');
    });

    it('should handle common escape sequences', () => {
      const result = escapeUnicode('Line1\nLine2\tTab');
      expect(result).toBe('Line1\\nLine2\\tTab');
    });
  });

  describe('escapeStringLiteral', () => {
    it('should wrap and escape Tamil text', () => {
      const result = escapeStringLiteral('தமிழ்');
      expect(result).toBe('"\\u0BA4\\u0BAE\\u0BBF\\u0BB4\\u0BCD"');
    });

    it('should wrap ASCII without unicode escaping', () => {
      const result = escapeStringLiteral('Hello World');
      expect(result).toBe('"Hello World"');
    });

    it('should escape quotes in ASCII', () => {
      const result = escapeStringLiteral('He said "Hello"');
      expect(result).toBe('"He said \\"Hello\\""');
    });

    it('should handle mixed content with unicode', () => {
      const result = escapeStringLiteral('Hello 中文');
      expect(result).toContain('"Hello');
      expect(result).toContain('\\u4E2D\\u6587"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(needsUnicodeEscape('')).toBe(false);
      expect(escapeUnicode('')).toBe('');
      expect(escapeStringLiteral('')).toBe('""');
    });

    it('should handle multiple emoji', () => {
      const result = escapeUnicode('😀🎉');
      expect(result).toContain('\\uD83D\\uDE00');
      expect(result).toContain('\\uD83C\\uDF89');
    });

    it('should handle complex Unicode (Hebrew + Arabic + Chinese)', () => {
      const text = 'שלום مرحبا 你好';
      expect(needsUnicodeEscape(text)).toBe(true);
      const result = escapeUnicode(text);
      expect(result).toMatch(/\\u[0-9A-F]{4}/);
    });
  });
});
