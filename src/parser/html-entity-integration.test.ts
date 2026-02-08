/**
 * Integration Tests - HTML Entity Decoding in JSX
 *
 * Verifies that HTML entities in JSX text content are properly decoded
 * during parsing.
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../ast/index.js';
import { createLexer } from '../lexer/index.js';
import { Parser } from '../parser.js';

describe('HTML Entity Decoding in JSX', () => {
  /**
   * Helper to parse PSR code
   */
  function parsePSR(code: string) {
    const lexer = createLexer();
    const tokens = lexer.tokenize(code);
    const parser = new Parser(tokens, code);
    return parser.parse();
  }

  describe('Named Entities', () => {
    it('should decode &lt; and &gt; in JSX text', () => {
      const code = '<div>&lt;script&gt;</div>';
      const ast = parsePSR(code);

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const element = ast.body[0];
      expect(element.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(element.tagName).toBe('div');
      expect(element.children).toHaveLength(1);

      const text = element.children[0];
      expect(text.type).toBe(ASTNodeType.LITERAL);
      expect(text.value).toBe('<script>');
    });

    it('should decode &amp; in JSX text', () => {
      const code = '<div>Fish &amp; Chips</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('Fish & Chips');
    });

    it('should decode &quot; and &apos;', () => {
      const code = '<div>&quot;Hello&quot; &apos;World&apos;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('"Hello" \'World\'');
    });

    it('should decode &nbsp; as non-breaking space', () => {
      const code = '<div>&nbsp;&nbsp;Hello</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('\u00A0\u00A0Hello');
    });

    it('should decode extended entities', () => {
      const code = '<div>&copy; 2026 &reg; &trade;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('© 2026 ® ™');
    });

    it('should decode mathematical symbols', () => {
      const code = '<div>a &ne; b &amp;&amp; c &le; d</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('a ≠ b && c ≤ d');
    });

    it('should decode arrows', () => {
      const code = '<div>&larr; &rarr; &uarr; &darr;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('← → ↑ ↓');
    });
  });

  describe('Numeric Entities', () => {
    it('should decode decimal entities', () => {
      const code = '<div>&#60;div&#62;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('<div>');
    });

    it('should decode hexadecimal entities', () => {
      const code = '<div>&#x3C;span&#x3E;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('<span>');
    });

    it('should decode uppercase hex entities', () => {
      const code = '<div>&#X3C;&#X3E;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('<>');
    });

    it('should decode emojis with numeric entities', () => {
      const code = '<div>&#128512; &#x1F603;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('😀 😃');
    });
  });

  describe('Mixed Content', () => {
    it('should decode entities with regular text', () => {
      const code = '<div>Hello &amp; goodbye &lt;world&gt;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('Hello & goodbye <world>');
    });

    it('should decode entities in multiline text', () => {
      const code = `<div>
        Line 1 &lt;tag&gt;
        Line 2 &amp; more
      </div>`;
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toContain('<tag>');
      expect(text.value).toContain('& more');
    });

    it('should handle entities mixed with expressions', () => {
      const code = '<div>&lt;start&gt; {expr} &lt;end&gt;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      expect(element.children).toHaveLength(3);

      const text1 = element.children[0];
      expect(text1.type).toBe(ASTNodeType.LITERAL);
      expect(text1.value).toBe('<start>');

      const expr = element.children[1];
      expect(expr.type).toBe(ASTNodeType.IDENTIFIER);

      const text2 = element.children[2];
      expect(text2.type).toBe(ASTNodeType.LITERAL);
      expect(text2.value).toBe('<end>');
    });
  });

  describe('Nested Elements', () => {
    it('should decode entities in nested elements', () => {
      const code = '<div><span>&lt;nested&gt;</span></div>';
      const ast = parsePSR(code);

      const div = ast.body[0];
      expect(div.children).toHaveLength(1);

      const span = div.children[0];
      expect(span.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(span.children).toHaveLength(1);

      const text = span.children[0];
      expect(text.value).toBe('<nested>');
    });

    it('should decode entities in multiple children', () => {
      const code = '<div><p>&lt;</p><p>&gt;</p></div>';
      const ast = parsePSR(code);

      const div = ast.body[0];
      expect(div.children).toHaveLength(2);

      const p1 = div.children[0];
      expect(p1.children[0].value).toBe('<');

      const p2 = div.children[1];
      expect(p2.children[0].value).toBe('>');
    });
  });

  describe('Edge Cases', () => {
    it('should preserve unknown entities', () => {
      const code = '<div>&unknown;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('&unknown;');
    });

    it('should handle malformed entities gracefully', () => {
      const code = '<div>&lt without semicolon</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      // Should keep malformed entity as-is
      expect(text.value).toContain('&lt');
    });

    it('should not decode entities in expressions', () => {
      const code = '<div>{a < b && c > d}</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const expr = element.children[0];

      // Expression should be parsed as operators, not entities
      expect(expr.type).toBe(ASTNodeType.LOGICAL_EXPRESSION);
    });

    it('should decode empty element with entities', () => {
      const code = '<div>&nbsp;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('\u00A0');
    });
  });

  describe('Real-World Examples', () => {
    it('should decode XSS prevention example', () => {
      const code = '<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('<script>alert("XSS")</script>');
    });

    it('should decode code snippet with operators', () => {
      const code = '<code>if (a &lt; b &amp;&amp; c &gt; d)</code>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('if (a < b && c > d)');
    });

    it('should decode copyright notice', () => {
      const code = '<footer>&copy; 2026 Company &trade;. All rights reserved &reg;.</footer>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('© 2026 Company ™. All rights reserved ®.');
    });

    it('should decode mathematical formula', () => {
      const code = '<p>x &ne; 0 &amp;&amp; y &le; 100</p>';
      const ast = parsePSR(code);

      const element = ast.body[0];
      const text = element.children[0];
      expect(text.value).toBe('x ≠ 0 && y ≤ 100');
    });
  });
});
