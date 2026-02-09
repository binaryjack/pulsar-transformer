/**
 * Template Literals in JSX - Lexer Tests
 *
 * Comprehensive tests for template literal support in JSX attributes and expressions.
 * Tests the fix for proper template literal state preservation across JSX boundaries.
 *
 * Bug Reference: Template literals with ${} expressions in JSX attribute values
 * were not supported due to state tracking failure at JSX expression boundaries.
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../create-lexer.js';
import { TokenType } from '../token-types.js';

describe('Template Literals in JSX', () => {
  describe('Simple template literals in JSX attributes', () => {
    it('should tokenize simple template literal in JSX attribute', () => {
      const lexer = createLexer();
      const source = '<div style={`color: red`} />';
      const tokens = lexer.tokenize(source);

      // Find the template literal token
      const templateToken = tokens.find((t) => t.type === TokenType.TEMPLATE_LITERAL);
      expect(templateToken).toBeDefined();
      expect(templateToken?.value).toBe('color: red');
    });

    it('should tokenize template literal with expression in JSX attribute', () => {
      const lexer = createLexer();
      const source = '<div style={`color: ${color}`} />';
      const tokens = lexer.tokenize(source);

      // Should have TEMPLATE_HEAD, expression tokens, and TEMPLATE_TAIL
      const templateHeadIdx = tokens.findIndex((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHeadIdx).toBeGreaterThan(-1);
      expect(tokens[templateHeadIdx].value).toBe('color: ');

      // Find TEMPLATE_TAIL
      const templateTailIdx = tokens.findIndex((t) => t.type === TokenType.TEMPLATE_TAIL);
      expect(templateTailIdx).toBeGreaterThan(templateHeadIdx);
      expect(tokens[templateTailIdx].value).toBe('');
    });

    it('should tokenize template literal with multiple expressions in JSX attribute', () => {
      const lexer = createLexer();
      const source = '<div style={`font-size: ${size}px; color: ${color}`} />';
      const tokens = lexer.tokenize(source);

      // Should have TEMPLATE_HEAD, expressions, TEMPLATE_MIDDLE, expressions, TEMPLATE_TAIL
      const templateTokens = tokens.filter(
        (t) =>
          t.type === TokenType.TEMPLATE_HEAD ||
          t.type === TokenType.TEMPLATE_MIDDLE ||
          t.type === TokenType.TEMPLATE_TAIL
      );

      expect(templateTokens.length).toBeGreaterThanOrEqual(3);
      expect(templateTokens[0].type).toBe(TokenType.TEMPLATE_HEAD);
      expect(templateTokens[0].value).toBe('font-size: ');
    });
  });

  describe('Nested expressions in template literals', () => {
    it('should handle ternary operator in template literal expression', () => {
      const lexer = createLexer();
      const source = '<div class={`btn ${isActive ? "active" : "inactive"}`} />';
      const tokens = lexer.tokenize(source);

      // Should successfully tokenize without hanging
      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Verify template structure
      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead).toBeDefined();
      expect(templateHead?.value).toBe('btn ');
    });

    it('should handle function calls in template literal expressions', () => {
      const lexer = createLexer();
      const source = '<div title={`Result: ${getResult()}`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead?.value).toBe('Result: ');
    });

    it('should handle object property access in template literal expressions', () => {
      const lexer = createLexer();
      const source = '<div style={`padding: ${config.spacing}px`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead?.value).toBe('padding: ');
    });
  });

  describe('Complex nested structures', () => {
    it('should handle template literal with nested template literal in expression', () => {
      const lexer = createLexer();
      // Nested template: outer template has expression containing inner template
      const source = '<div data-text={`Outer: ${`Inner: ${value}`}`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Should have multiple template tokens for nested structure
      const templateTokens = tokens.filter(
        (t) =>
          t.type === TokenType.TEMPLATE_HEAD ||
          t.type === TokenType.TEMPLATE_MIDDLE ||
          t.type === TokenType.TEMPLATE_TAIL ||
          t.type === TokenType.TEMPLATE_LITERAL
      );
      expect(templateTokens.length).toBeGreaterThan(2);
    });

    it('should handle multiple JSX attributes with template literals', () => {
      const lexer = createLexer();
      const source =
        '<div class={`btn-${type}`} style={`color: ${color}`} data-id={`item-${id}`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Should have 3 sets of template tokens
      const templateHeads = tokens.filter((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHeads.length).toBe(3);
    });

    it('should handle template literal in JSX child expression', () => {
      const lexer = createLexer();
      const source = '<div>{`Hello ${name}!`}</div>';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead?.value).toBe('Hello ');
    });
  });

  describe('Edge cases', () => {
    it('should distinguish ${ (template expression) from $( (signal binding)', () => {
      const lexer = createLexer();
      const source = '<div class={`active-${state}`} onClick={$(handleClick)} />';
      const tokens = lexer.tokenize(source);

      // Should have both TEMPLATE_HEAD and SIGNAL_BINDING
      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead).toBeDefined();
      expect(templateHead?.value).toBe('active-');

      const signalBinding = tokens.find((t) => t.type === TokenType.SIGNAL_BINDING);
      expect(signalBinding).toBeDefined();
      expect(signalBinding?.value).toBe('$(handleClick)');
    });

    it('should handle template literal with escaped backtick', () => {
      const lexer = createLexer();
      const source = '<div data-text={`Value: \\`${value}\\``} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    it('should handle empty template literal expression', () => {
      const lexer = createLexer();
      const source = '<div class={`prefix-${}`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead?.value).toBe('prefix-');
    });

    it('should handle template literal with only expression', () => {
      const lexer = createLexer();
      const source = '<div class={`${className}`} />';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHead?.value).toBe('');
    });
  });

  describe('JSX context depth tracking', () => {
    it('should preserve template state across JSX expression boundaries', () => {
      const lexer = createLexer();
      // This is the critical test - template literal in attribute value
      // that spans JSX expression boundary
      const source = '<button style={`padding: ${size}px`}>Click</button>';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Verify template structure is correct
      const templateHead = tokens.find((t) => t.type === TokenType.TEMPLATE_HEAD);
      const templateTail = tokens.find((t) => t.type === TokenType.TEMPLATE_TAIL);

      expect(templateHead).toBeDefined();
      expect(templateHead?.value).toBe('padding: ');
      expect(templateTail).toBeDefined();
      expect(templateTail?.value).toBe('px');
    });

    it('should handle deeply nested JSX with template literals', () => {
      const lexer = createLexer();
      const source =
        '<div><span class={`text-${size}`}><em style={`color: ${color}`}>Text</em></span></div>';
      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Should have 2 template heads (one for each template literal)
      const templateHeads = tokens.filter((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHeads.length).toBe(2);
    });
  });

  describe('Real-world examples', () => {
    it('should tokenize navigation button with dynamic styles (from main.psr)', () => {
      const lexer = createLexer();
      // Simplified version of the reported issue
      const source = `<button 
        onClick={goHome}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: currentPath() === '/' ? '#3b82f6' : '#2a2a2a',
          border: '2px solid #3b82f6',
          color: 'white',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentPath() === '/' ? 'bold' : 'normal',
          transition: 'all 0.2s'
        }}>
        🏠 Home
      </button>`;

      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    it('should tokenize template literal style with template expressions', () => {
      const lexer = createLexer();
      const source = `<div style={\`
        display: flex;
        gap: \${spacing}px;
        background: \${theme.background};
        color: \${theme.foreground};
      \`} />`;

      const tokens = lexer.tokenize(source);

      expect(tokens).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);

      // Should have TEMPLATE_HEAD, TEMPLATE_MIDDLE tokens for multi-expression template
      const templateHeads = tokens.filter((t) => t.type === TokenType.TEMPLATE_HEAD);
      expect(templateHeads.length).toBeGreaterThan(0);
    });
  });
});
