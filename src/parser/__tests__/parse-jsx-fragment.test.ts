/**
 * Tests for JSX Fragment parsing (Phase 12)
 *
 * Tests JSX fragment syntax: <>...</>
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { createParser } from '../create-parser.js';

describe('Phase 12: JSX Fragment Parsing', () => {
  describe('Basic fragments', () => {
    it('should parse empty fragment', () => {
      const parser = createParser();
      const source = '<></>';
      const program = parser.parse(source);
      const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children).toEqual([]);
    });

    it('should parse fragment with single text child', () => {
      const parser = createParser();
      const source = '<>Hello</>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0].value).toBe('Hello');
    });

    it('should parse fragment with single element child', () => {
      const parser = createParser();
      const source = '<><div>Content</div></>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0].type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(ast.children[0].tagName).toBe('div');
    });

    it('should parse fragment with multiple children', () => {
      const parser = createParser();
      const source = `
        <>
          <div>First</div>
          <span>Second</span>
          <p>Third</p>
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children.length).toBeGreaterThanOrEqual(3);

      const elements = ast.children.filter((c: any) => c.type === ASTNodeType.PSR_ELEMENT);
      expect(elements).toHaveLength(3);
      expect(elements[0].tagName).toBe('div');
      expect(elements[1].tagName).toBe('span');
      expect(elements[2].tagName).toBe('p');
    });
  });

  describe('Nested fragments', () => {
    it('should parse nested fragments', () => {
      const parser = createParser();
      const source = `
        <>
          <>
            <div>Nested</div>
          </>
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const innerFragment = ast.children.find((c: any) => c.type === ASTNodeType.PSR_FRAGMENT);
      expect(innerFragment).toBeDefined();
      expect(innerFragment.children[0].type).toBe(ASTNodeType.PSR_ELEMENT);
    });

    it('should parse multiple nested fragments', () => {
      const parser = createParser();
      const source = `
        <>
          <><div>First</div></>
          <><span>Second</span></>
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const fragments = ast.children.filter((c: any) => c.type === ASTNodeType.PSR_FRAGMENT);
      expect(fragments.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fragment with expressions', () => {
    it('should parse fragment with expression child', () => {
      const parser = createParser();
      const source = '<>{count()}</>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0].type).toBe(ASTNodeType.CALL_EXPRESSION);
    });

    it('should parse fragment with multiple expressions', () => {
      const parser = createParser();
      const source = '<>{firstName()} {lastName()}</>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const calls = ast.children.filter((c: any) => c.type === ASTNodeType.CALL_EXPRESSION);
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fragment with mixed content', () => {
    it('should parse fragment with mixed text and elements', () => {
      const parser = createParser();
      const source = '<>Text before<div>Element</div>Text after</>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      expect(ast.children.length).toBeGreaterThanOrEqual(3);
    });

    it('should parse fragment with elements and expressions', () => {
      const parser = createParser();
      const source = '<><div>{count()}</div>{loading()}<span>Done</span></>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const elements = ast.children.filter((c: any) => c.type === ASTNodeType.PSR_ELEMENT);
      expect(elements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fragment edge cases', () => {
    it('should parse fragment with whitespace', () => {
      const parser = createParser();
      const source = `
        <>
          
          
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      // Whitespace handling may vary
    });

    it('should parse fragment as element child', () => {
      const parser = createParser();
      const source = '<div><><span>Fragment inside element</span></></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(ast.tagName).toBe('div');
      const fragment = ast.children.find((c: any) => c.type === ASTNodeType.PSR_FRAGMENT);
      expect(fragment).toBeDefined();
    });

    it('should parse deeply nested fragments', () => {
      const parser = createParser();
      const source = `
        <>
          <>
            <>
              <div>Deep</div>
            </>
          </>
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      // Verify nesting depth
      let current = ast;
      let depth = 0;
      while (current.type === ASTNodeType.PSR_FRAGMENT && depth < 5) {
        const nextFragment = current.children.find((c: any) => c.type === ASTNodeType.PSR_FRAGMENT);
        if (!nextFragment) break;
        current = nextFragment;
        depth++;
      }
      expect(depth).toBeGreaterThanOrEqual(2);
    });
  });
});
