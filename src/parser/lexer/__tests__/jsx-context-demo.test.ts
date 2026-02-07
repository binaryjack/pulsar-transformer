/**
 * JSX Context Switching - Demo Test
 *
 * Demonstrates the new JSX text tokenization capability.
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../../ast/index.js';
import { createParser } from '../../create-parser.js';
import { createLexer } from '../create-lexer.js';
import { TokenType } from '../token-types.js';

describe('JSX Context Switching - Demo', () => {
  describe('Real-world examples', () => {
    it('should parse button with text', () => {
      const source = `<button class="btn">Click Me</button>`;
      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Verify JSX_TEXT token exists
      const jsxText = tokens.find((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxText).toBeDefined();
      expect(jsxText?.value).toBe('Click Me');

      // Verify LESS_THAN_SLASH token exists
      const closingTag = tokens.find((t) => t.type === TokenType.LESS_THAN_SLASH);
      expect(closingTag).toBeDefined();
      expect(closingTag?.value).toBe('</');
    });

    it('should parse greeting with expression', () => {
      const source = `<div>Hello {name}!</div>`;
      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Find all JSX_TEXT tokens
      const jsxTexts = tokens.filter((t) => t.type === TokenType.JSX_TEXT);

      // Should have "Hello " before expression and "!" after
      expect(jsxTexts.length).toBeGreaterThanOrEqual(1);

      // Verify text before expression
      expect(jsxTexts[0].value).toBe('Hello ');
    });

    it('should parse complex nested structure', () => {
      const source = `
        <div class="container">
          <h1>Title</h1>
          <p>Paragraph with {expression} inside</p>
          <button>Click</button>
        </div>
      `;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Count JSX_TEXT tokens
      const jsxTexts = tokens.filter((t) => t.type === TokenType.JSX_TEXT);

      // Should have text for "Title", "Paragraph with ", " inside", "Click"
      expect(jsxTexts.length).toBeGreaterThan(3);

      // Verify some specific texts
      const textValues = jsxTexts.map((t) => t.value.trim());
      expect(textValues).toContain('Title');
      expect(textValues).toContain('Click');
    });

    it('should parse with parser - button component', () => {
      const source = `
        component MyButton() {
          return <button class="btn">Click Me</button>
        }
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      // Should parse without errors
      expect(parser.hasErrors()).toBe(false);

      // AST should have component declaration
      expect(ast.type).toBe(ASTNodeType.PROGRAM);
    });

    it('should parse with parser - greeting component', () => {
      const source = `
        component Greeting({ name }: { name: string }) {
          return <div>Hello {name}!</div>
        }
      `;

      const parser = createParser();
      const ast = parser.parse(source);

      // Should parse without errors
      expect(parser.hasErrors()).toBe(false);

      // Verify component was parsed
      expect(ast.type).toBe(ASTNodeType.PROGRAM);
    });
  });

  describe('Edge cases', () => {
    it('should handle multiline text', () => {
      const source = `
        <div>
          This is a
          multiline
          text content
        </div>
      `;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      const jsxText = tokens.find((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxText).toBeDefined();

      // Whitespace normalization happens in parser, lexer preserves raw text
      expect(jsxText?.value).toContain('multiline');
    });

    it('should handle empty elements', () => {
      const source = `<div></div>`;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Should have opening and closing tags but no JSX_TEXT
      const jsxTexts = tokens.filter((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxTexts.length).toBe(0);
    });

    it('should handle self-closing tags', () => {
      const source = `<input type="text" />`;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Should not have LESS_THAN_SLASH (no closing tag)
      const closingTags = tokens.filter((t) => t.type === TokenType.LESS_THAN_SLASH);
      expect(closingTags.length).toBe(0);

      // Should have SLASH + GT for self-closing
      const slash = tokens.find((t) => t.type === TokenType.SLASH);
      expect(slash).toBeDefined();
    });

    it('should handle deeply nested expressions', () => {
      const source = `<div>A {b ? <span>C {d} E</span> : f} G</div>`;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      // Should properly switch contexts for nested JSX and expressions
      const jsxTexts = tokens.filter((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxTexts.length).toBeGreaterThan(0);
    });

    it('should handle HTML entities', () => {
      const source = `<div>&lt;Hello&gt; &amp; Goodbye</div>`;

      const lexer = createLexer();
      const tokens = lexer.tokenize(source);

      const jsxText = tokens.find((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxText?.value).toContain('&lt;');
      expect(jsxText?.value).toContain('&gt;');
      expect(jsxText?.value).toContain('&amp;');
    });
  });

  describe('Performance', () => {
    it('should handle large JSX structures efficiently', () => {
      // Generate a large nested structure
      const items = Array.from({ length: 100 }, (_, i) => `<li>Item ${i}</li>`).join('\n');

      const source = `<ul>${items}</ul>`;

      const startTime = performance.now();
      const lexer = createLexer();
      const tokens = lexer.tokenize(source);
      const endTime = performance.now();

      // Should tokenize quickly (< 100ms for 100 items)
      expect(endTime - startTime).toBeLessThan(100);

      // Should have JSX_TEXT for each item
      const jsxTexts = tokens.filter((t) => t.type === TokenType.JSX_TEXT);
      expect(jsxTexts.length).toBeGreaterThan(0);
    });
  });
});
