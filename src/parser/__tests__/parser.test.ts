/**
 * Parser Tests
 * 
 * Tests for PSR Parser AST construction.
 */

import { describe, it, expect } from 'vitest';
import { createParser } from '../create-parser';
import { ASTNodeType } from '../ast';
import type {
  IProgramNode,
  IComponentDeclarationNode,
  IPSRElementNode,
  IPSRSignalBindingNode,
} from '../ast';

describe('createParser', () => {
  describe('basic parsing', () => {
    it('should create parser instance', () => {
      const parser = createParser();
      expect(parser).toBeDefined();
      expect(parser.parse).toBeInstanceOf(Function);
    });

    it('should parse empty program', () => {
      const parser = createParser();
      const ast = parser.parse('') as IProgramNode;

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toEqual([]);
    });
  });

  describe('component parsing', () => {
    it('should parse simple component declaration', () => {
      const parser = createParser();
      const source = `component MyButton() { return <button>Click</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.type).toBe(ASTNodeType.COMPONENT_DECLARATION);
      expect(component.name.name).toBe('MyButton');
      expect(component.params).toEqual([]);
    });

    it('should parse component with parameters', () => {
      const parser = createParser();
      const source = `component Button(label) { return <button>$(label)</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.type).toBe(ASTNodeType.COMPONENT_DECLARATION);
      expect(component.name.name).toBe('Button');
      expect(component.params).toHaveLength(1);
      expect(component.params[0].name).toBe('label');
    });

    it('should parse component with multiple parameters', () => {
      const parser = createParser();
      const source = `component Card(title, content, footer) { return <div>Test</div>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.params).toHaveLength(3);
      expect(component.params[0].name).toBe('title');
      expect(component.params[1].name).toBe('content');
      expect(component.params[2].name).toBe('footer');
    });

    it('should parse component with return statement', () => {
      const parser = createParser();
      const source = `component MyButton() { return <button>Click</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.returnStatement).toBeDefined();
      expect(component.returnStatement?.type).toBe(ASTNodeType.RETURN_STATEMENT);
    });
  });

  describe('PSR element parsing', () => {
    it('should parse simple element', () => {
      const parser = createParser();
      const source = `component MyButton() { return <button>Click</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(element.tagName).toBe('button');
      expect(element.selfClosing).toBe(false);
    });

    it('should parse self-closing element', () => {
      const parser = createParser();
      const source = `component MyInput() { return <input />; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.type).toBe(ASTNodeType.PSR_ELEMENT);
      expect(element.tagName).toBe('input');
      expect(element.selfClosing).toBe(true);
      expect(element.children).toEqual([]);
    });

    it('should parse element with attributes', () => {
      const parser = createParser();
      const source = `component MyButton() { return <button class="btn">Click</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.attributes).toHaveLength(1);
      expect(element.attributes[0].name).toBe('class');
      expect(element.attributes[0].isStatic).toBe(true);
    });

    it('should parse nested elements', () => {
      const parser = createParser();
      const source = `component Card() { return <div><h1>Title</h1><p>Content</p></div>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.tagName).toBe('div');
      expect(element.children).toHaveLength(2);
    });
  });

  describe('signal binding parsing', () => {
    it('should parse signal binding in element', () => {
      const parser = createParser();
      const source = `component Counter() { return <div>$(count)</div>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.children).toHaveLength(1);
      const signalBinding = element.children[0] as IPSRSignalBindingNode;
      expect(signalBinding.type).toBe(ASTNodeType.PSR_SIGNAL_BINDING);
      expect(signalBinding.identifier.name).toBe('count');
    });

    it('should parse multiple signal bindings', () => {
      const parser = createParser();
      const source = `component User() { return <div>$(firstName) $(lastName)</div>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      const returnStmt = component.returnStatement!;
      const element = returnStmt.argument as IPSRElementNode;

      expect(element.children.length).toBeGreaterThanOrEqual(2);
      const signals = element.children.filter(
        (child) => child.type === ASTNodeType.PSR_SIGNAL_BINDING
      );
      expect(signals).toHaveLength(2);
    });
  });

  describe('variable declaration parsing', () => {
    it('should parse const declaration', () => {
      const parser = createParser();
      const source = `const count = 0;`;
      const ast = parser.parse(source) as IProgramNode;

      expect(ast.body).toHaveLength(1);
      const varDecl = ast.body[0];
      expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect((varDecl as any).kind).toBe('const');
      expect((varDecl as any).id.name).toBe('count');
    });

    it('should parse let declaration', () => {
      const parser = createParser();
      const source = `let isOpen = createSignal(false);`;
      const ast = parser.parse(source) as IProgramNode;

      const varDecl = ast.body[0];
      expect((varDecl as any).kind).toBe('let');
      expect((varDecl as any).id.name).toBe('isOpen');
    });
  });

  describe('expression parsing', () => {
    it('should parse call expression', () => {
      const parser = createParser();
      const source = `const signal = createSignal(0);`;
      const ast = parser.parse(source) as IProgramNode;

      const varDecl = ast.body[0] as any;
      expect(varDecl.init.type).toBe(ASTNodeType.CALL_EXPRESSION);
      expect(varDecl.init.callee.name).toBe('createSignal');
      expect(varDecl.init.arguments).toHaveLength(1);
    });

    it('should parse number literal', () => {
      const parser = createParser();
      const source = `const num = 42;`;
      const ast = parser.parse(source) as IProgramNode;

      const varDecl = ast.body[0] as any;
      expect(varDecl.init.type).toBe(ASTNodeType.LITERAL);
      expect(varDecl.init.value).toBe(42);
    });

    it('should parse string literal', () => {
      const parser = createParser();
      const source = `const str = "hello";`;
      const ast = parser.parse(source) as IProgramNode;

      const varDecl = ast.body[0] as any;
      expect(varDecl.init.type).toBe(ASTNodeType.LITERAL);
      expect(varDecl.init.value).toBe('hello');
    });
  });

  describe('error handling', () => {
    it('should track parsing errors', () => {
      const parser = createParser({ collectErrors: true });

      // Invalid syntax - missing closing brace
      const source = `component MyButton() { return <button>Click</button>;`;

      try {
        parser.parse(source);
      } catch (err) {
        // Expected to throw
      }

      expect(parser.hasErrors()).toBe(true);
      expect(parser.getErrors().length).toBeGreaterThan(0);
    });

    it('should provide error location', () => {
      const parser = createParser({ collectErrors: true });
      const source = `component MyButton(`;

      try {
        parser.parse(source);
      } catch (err) {
        // Expected
      }

      const errors = parser.getErrors();
      if (errors.length > 0) {
        expect(errors[0].location).toBeDefined();
        expect(errors[0].location.line).toBeGreaterThan(0);
      }
    });
  });

  describe('position tracking', () => {
    it('should track node locations', () => {
      const parser = createParser();
      const source = `component MyButton() { return <button>Click</button>; }`;
      const ast = parser.parse(source) as IProgramNode;

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.location).toBeDefined();
      expect(component.location.start.line).toBe(1);
      expect(component.location.start.column).toBeGreaterThan(0);
    });

    it('should return current position', () => {
      const parser = createParser();
      const position = parser.getPosition();

      expect(position).toBeDefined();
      expect(position.start).toBeDefined();
      expect(position.end).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should parse complete PSR component', () => {
      const parser = createParser();
      const source = `
        component Counter() {
          const count = createSignal(0);
          return <div>
            <button>$(count)</button>
          </div>;
        }
      `;

      const ast = parser.parse(source) as IProgramNode;
      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body.length).toBeGreaterThan(0);

      const component = ast.body[0] as IComponentDeclarationNode;
      expect(component.type).toBe(ASTNodeType.COMPONENT_DECLARATION);
      expect(component.name.name).toBe('Counter');
    });

    it('should parse component with multiple statements', () => {
      const parser = createParser();
      const source = `
        component Card(title, content) {
          const isOpen = createSignal(false);
          const toggle = createSignal();
          return <div>$(title)</div>;
        }
      `;

      const ast = parser.parse(source) as IProgramNode;
      const component = ast.body[0] as IComponentDeclarationNode;

      expect(component.body.length).toBeGreaterThan(1);
    });
  });
});
