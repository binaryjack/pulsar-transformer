/**
 * Tests for HTML Entity Decoder
 *
 * Verifies decoding of named, decimal, and hexadecimal HTML entities.
 */

import { describe, expect, it } from 'vitest';
import { decodeHTMLEntities, hasHTMLEntities } from '../decode-html-entities.js';

describe('decodeHTMLEntities()', () => {
  describe('Named Entities', () => {
    it('should decode common entities', () => {
      expect(decodeHTMLEntities('&lt;')).toBe('<');
      expect(decodeHTMLEntities('&gt;')).toBe('>');
      expect(decodeHTMLEntities('&amp;')).toBe('&');
      expect(decodeHTMLEntities('&quot;')).toBe('"');
      expect(decodeHTMLEntities('&apos;')).toBe("'");
      expect(decodeHTMLEntities('&nbsp;')).toBe('\u00A0');
    });

    it('should decode HTML tags with entities', () => {
      expect(decodeHTMLEntities('&lt;script&gt;')).toBe('<script>');
      expect(decodeHTMLEntities('&lt;div class=&quot;test&quot;&gt;')).toBe('<div class="test">');
    });

    it('should decode multiple entities in text', () => {
      expect(decodeHTMLEntities('&nbsp;&nbsp;Hello&nbsp;World')).toBe(
        '\u00A0\u00A0Hello\u00A0World'
      );
      expect(decodeHTMLEntities('a &lt; b &amp;&amp; c &gt; d')).toBe('a < b && c > d');
    });

    it('should decode extended entities', () => {
      expect(decodeHTMLEntities('&copy;')).toBe('©');
      expect(decodeHTMLEntities('&reg;')).toBe('®');
      expect(decodeHTMLEntities('&trade;')).toBe('™');
      expect(decodeHTMLEntities('&euro;')).toBe('€');
      expect(decodeHTMLEntities('&pound;')).toBe('£');
      expect(decodeHTMLEntities('&yen;')).toBe('¥');
      expect(decodeHTMLEntities('&deg;')).toBe('°');
    });

    it('should decode mathematical symbols', () => {
      expect(decodeHTMLEntities('&ne;')).toBe('≠');
      expect(decodeHTMLEntities('&le;')).toBe('≤');
      expect(decodeHTMLEntities('&ge;')).toBe('≥');
      expect(decodeHTMLEntities('&infin;')).toBe('∞');
      expect(decodeHTMLEntities('&plusmn;')).toBe('±');
      expect(decodeHTMLEntities('&times;')).toBe('×');
      expect(decodeHTMLEntities('&divide;')).toBe('÷');
    });

    it('should decode arrows', () => {
      expect(decodeHTMLEntities('&larr;')).toBe('←');
      expect(decodeHTMLEntities('&uarr;')).toBe('↑');
      expect(decodeHTMLEntities('&rarr;')).toBe('→');
      expect(decodeHTMLEntities('&darr;')).toBe('↓');
    });

    it('should decode Greek letters', () => {
      expect(decodeHTMLEntities('&alpha;')).toBe('α');
      expect(decodeHTMLEntities('&beta;')).toBe('β');
      expect(decodeHTMLEntities('&gamma;')).toBe('γ');
      expect(decodeHTMLEntities('&pi;')).toBe('π');
    });

    it('should be case-insensitive for named entities', () => {
      expect(decodeHTMLEntities('&LT;')).toBe('<');
      expect(decodeHTMLEntities('&GT;')).toBe('>');
      expect(decodeHTMLEntities('&AMP;')).toBe('&');
    });
  });

  describe('Decimal Character References', () => {
    it('should decode decimal entities', () => {
      expect(decodeHTMLEntities('&#60;')).toBe('<');
      expect(decodeHTMLEntities('&#62;')).toBe('>');
      expect(decodeHTMLEntities('&#38;')).toBe('&');
      expect(decodeHTMLEntities('&#34;')).toBe('"');
      expect(decodeHTMLEntities('&#39;')).toBe("'");
    });

    it('should decode high Unicode code points', () => {
      expect(decodeHTMLEntities('&#128512;')).toBe('😀'); // Grinning face
      expect(decodeHTMLEntities('&#128515;')).toBe('😃'); // Smiling face
      expect(decodeHTMLEntities('&#128525;')).toBe('😍'); // Smiling face with heart-eyes
    });

    it('should decode multiple decimal entities', () => {
      expect(decodeHTMLEntities('&#72;&#101;&#108;&#108;&#111;')).toBe('Hello');
    });
  });

  describe('Hexadecimal Character References', () => {
    it('should decode lowercase hex entities', () => {
      expect(decodeHTMLEntities('&#x3c;')).toBe('<');
      expect(decodeHTMLEntities('&#x3e;')).toBe('>');
      expect(decodeHTMLEntities('&#x26;')).toBe('&');
      expect(decodeHTMLEntities('&#x22;')).toBe('"');
      expect(decodeHTMLEntities('&#x27;')).toBe("'");
    });

    it('should decode uppercase hex entities', () => {
      expect(decodeHTMLEntities('&#x3C;')).toBe('<');
      expect(decodeHTMLEntities('&#x3E;')).toBe('>');
      expect(decodeHTMLEntities('&#x26;')).toBe('&');
    });

    it('should decode uppercase X in hex entities', () => {
      expect(decodeHTMLEntities('&#X3C;')).toBe('<');
      expect(decodeHTMLEntities('&#X3E;')).toBe('>');
    });

    it('should decode emojis with hex', () => {
      expect(decodeHTMLEntities('&#x1F600;')).toBe('😀');
      expect(decodeHTMLEntities('&#x1F603;')).toBe('😃');
    });

    it('should decode multiple hex entities', () => {
      expect(decodeHTMLEntities('&#x48;&#x65;&#x6c;&#x6c;&#x6f;')).toBe('Hello');
    });
  });

  describe('Mixed Entities', () => {
    it('should decode mix of named and numeric entities', () => {
      expect(decodeHTMLEntities('&lt;div&#62;&#x48;ello&nbsp;World&lt;/div&gt;')).toBe(
        '<div>Hello\u00A0World</div>'
      );
    });

    it('should decode complex JSX content', () => {
      const input = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const expected = '<script>alert("XSS")</script>';
      expect(decodeHTMLEntities(input)).toBe(expected);
    });
  });

  describe('Edge Cases', () => {
    it('should return unchanged text without entities', () => {
      expect(decodeHTMLEntities('Hello World')).toBe('Hello World');
      expect(decodeHTMLEntities('No entities here!')).toBe('No entities here!');
    });

    it('should preserve unknown entities', () => {
      expect(decodeHTMLEntities('&unknown;')).toBe('&unknown;');
      expect(decodeHTMLEntities('&xyz123;')).toBe('&xyz123;');
    });

    it('should handle malformed entities', () => {
      expect(decodeHTMLEntities('&lt')).toBe('&lt'); // Missing semicolon
      expect(decodeHTMLEntities('&;')).toBe('&;'); // Empty entity
      expect(decodeHTMLEntities('&#;')).toBe('&#;'); // Empty numeric
    });

    it('should handle invalid numeric references', () => {
      expect(decodeHTMLEntities('&#999999999999;')).toBe('&#999999999999;'); // Out of range
      expect(decodeHTMLEntities('&#xFFFFFFF;')).toBe('&#xFFFFFFF;'); // Out of range hex
    });

    it('should handle ampersands not part of entities', () => {
      expect(decodeHTMLEntities('Fish & Chips')).toBe('Fish & Chips');
      expect(decodeHTMLEntities('A && B')).toBe('A && B');
    });

    it('should handle empty string', () => {
      expect(decodeHTMLEntities('')).toBe('');
    });

    it('should decode entities at boundaries', () => {
      expect(decodeHTMLEntities('&lt;start')).toBe('<start');
      expect(decodeHTMLEntities('end&gt;')).toBe('end>');
      expect(decodeHTMLEntities('&lt;')).toBe('<');
    });
  });

  describe('Performance Optimization', () => {
    it('should skip processing if no ampersand', () => {
      const text = 'No entities here at all!';
      const result = decodeHTMLEntities(text);
      expect(result).toBe(text);
      // Should return same reference (no processing)
      expect(result).toBe(text);
    });
  });
});

describe('hasHTMLEntities()', () => {
  it('should detect named entities', () => {
    expect(hasHTMLEntities('&lt;')).toBe(true);
    expect(hasHTMLEntities('&gt;')).toBe(true);
    expect(hasHTMLEntities('&amp;')).toBe(true);
  });

  it('should detect decimal entities', () => {
    expect(hasHTMLEntities('&#60;')).toBe(true);
    expect(hasHTMLEntities('&#123;')).toBe(true);
  });

  it('should detect hex entities', () => {
    expect(hasHTMLEntities('&#x3c;')).toBe(true);
    expect(hasHTMLEntities('&#X3C;')).toBe(true);
  });

  it('should return false for text without entities', () => {
    expect(hasHTMLEntities('Hello World')).toBe(false);
    expect(hasHTMLEntities('No entities')).toBe(false);
  });

  it('should return false for standalone ampersands', () => {
    expect(hasHTMLEntities('Fish & Chips')).toBe(false);
    expect(hasHTMLEntities('A && B')).toBe(false);
  });
});
