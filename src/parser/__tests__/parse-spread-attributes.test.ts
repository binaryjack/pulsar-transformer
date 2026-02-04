/**
 * Tests for JSX Spread Attributes parsing (Phase 12)
 *
 * Tests spread attribute syntax: {...props}
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../ast/ast-node-types.js';
import { createParser } from '../create-parser.js';

describe('Phase 12: JSX Spread Attributes', () => {
  describe('Basic spread attributes', () => {
    it('should parse element with single spread attribute', () => {
      const parser = createParser();
      const source = '<button {...props}>Click</button>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(ast.tagName).toBe('button');
      expect(ast.attributes).toHaveLength(1);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[0].argument.type).toBe(ASTNodeType.IDENTIFIER);
      expect(ast.attributes[0].argument.name).toBe('props');
    });

    it('should parse element with multiple spread attributes', () => {
      const parser = createParser();
      const source = '<div {...baseProps} {...extraProps}></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_ELEMENT);
      const spreads = ast.attributes.filter(
        (a: any) => a.type === ASTNodeType.PSR_SPREAD_ATTRIBUTE
      );
      expect(spreads).toHaveLength(2);
      expect(spreads[0].argument.name).toBe('baseProps');
      expect(spreads[1].argument.name).toBe('extraProps');
    });

    it('should parse spread attribute in self-closing tag', () => {
      const parser = createParser();
      const source = '<Input {...fieldProps} />';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(ast.selfClosing).toBe(true);
      expect(ast.attributes).toHaveLength(1);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
    });
  });

  describe('Mixed attributes', () => {
    it('should parse spread with regular attributes', () => {
      const parser = createParser();
      const source = '<button className="btn" {...props} disabled={loading}>Click</button>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(ast.attributes).toHaveLength(3);

      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[0].name).toBe('className');

      expect(ast.attributes[1].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);

      expect(ast.attributes[2].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[2].name).toBe('disabled');
    });

    it('should parse spread before regular attributes', () => {
      const parser = createParser();
      const source = '<div {...defaults} className="override"></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes).toHaveLength(2);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[1].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
    });

    it('should parse spread after regular attributes', () => {
      const parser = createParser();
      const source = '<div className="base" {...overrides}></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes).toHaveLength(2);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[1].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
    });

    it('should parse interleaved spread and regular attributes', () => {
      const parser = createParser();
      const source = '<div a="1" {...spread1} b="2" {...spread2} c="3"></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes).toHaveLength(5);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[1].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[2].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[3].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[4].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
    });
  });

  describe('Complex spread expressions', () => {
    it('should parse spread with member expression', () => {
      const parser = createParser();
      const source = '<div {...obj.props}></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[0].argument.type).toBe(ASTNodeType.MEMBER_EXPRESSION);
    });

    it('should parse spread with call expression', () => {
      const parser = createParser();
      const source = '<div {...getProps()}></div>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[0].argument.type).toBe(ASTNodeType.CALL_EXPRESSION);
    });
  });

  describe('Spread in fragments', () => {
    it('should parse spread attributes in fragment children', () => {
      const parser = createParser();
      const source = '<><div {...props}>Content</div></>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const element = ast.children.find((c: any) => c.type === ASTNodeType.PSR_ELEMENT);
      expect(element.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
    });

    it('should parse multiple elements with spreads in fragment', () => {
      const parser = createParser();
      const source = `
        <>
          <div {...divProps}></div>
          <span {...spanProps}></span>
        </>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.type).toBe(ASTNodeType.PSR_FRAGMENT);
      const elements = ast.children.filter((c: any) => c.type === ASTNodeType.PSR_ELEMENT);
      expect(elements.length).toBeGreaterThanOrEqual(2);
      expect(elements[0].attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(elements[1].attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
    });
  });

  describe('Real-world patterns', () => {
    it('should parse button with spread and override', () => {
      const parser = createParser();
      const source = '<button {...buttonProps} onClick={handleClick}>Submit</button>';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.attributes).toHaveLength(2);
      expect(ast.attributes[0].type).toBe(ASTNodeType.PSR_SPREAD_ATTRIBUTE);
      expect(ast.attributes[1].type).toBe(ASTNodeType.PSR_ATTRIBUTE);
      expect(ast.attributes[1].name).toBe('onClick');
    });

    it('should parse input with defaults and overrides', () => {
      const parser = createParser();
      const source = '<input type="text" {...inputProps} disabled={isDisabled()} />';
      const program = parser.parse(source); const ast = program.body[0];

      expect(ast.selfClosing).toBe(true);
      expect(ast.attributes).toHaveLength(3);
    });

    it('should parse complex component with multiple spreads', () => {
      const parser = createParser();
      const source = `
        <Card
          {...baseProps}
          className="custom"
          {...conditionalProps}
          onClick={handler}
          {...finalOverrides}
        >
          Content
        </Card>
      `;
      const program = parser.parse(source); const ast = program.body[0];

      const spreads = ast.attributes.filter(
        (a: any) => a.type === ASTNodeType.PSR_SPREAD_ATTRIBUTE
      );
      const regular = ast.attributes.filter((a: any) => a.type === ASTNodeType.PSR_ATTRIBUTE);

      expect(spreads).toHaveLength(3);
      expect(regular).toHaveLength(2);
    });
  });
});
