/**
 * Transformer Tests - Component transformation
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { createTransformer } from '../../transformer/index.js';

describe('Transformer - Component Declaration', () => {
  it('should transform basic component to const export', () => {
    const source = `
      component Counter() {
        return <div>Test</div>;
      }
    `;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    const transformer = createTransformer(ast);
    const result = transformer.transform();

    // Check program structure
    expect(result.ast.type).toBe('Program');
    expect(result.ast.body.length).toBeGreaterThan(0);

    // Find the transformed component (should be after imports)
    const componentDecl = result.ast.body.find((node: any) => node.type === 'VariableDeclaration');

    expect(componentDecl).toBeDefined();
    expect(componentDecl?.declarations?.[0]?.id?.name).toBe('Counter');
    expect(componentDecl?.kind).toBe('const');
  });

  it('should wrap component body in $REGISTRY.execute', () => {
    const source = `
      component Counter() {
        return <div>Test</div>;
      }
    `;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    const transformer = createTransformer(ast);
    const result = transformer.transform();

    const componentDecl: any = result.ast.body.find(
      (node: any) => node.type === 'VariableDeclaration'
    );

    // Get the arrow function
    const arrowFunction = componentDecl?.declarations?.[0]?.init;
    expect(arrowFunction?.type).toBe('ArrowFunctionExpression');

    // Check body has return statement
    const body = arrowFunction?.body;
    expect(body?.type).toBe('BlockStatement');
    expect(body?.body?.[0]?.type).toBe('ReturnStatement');

    // Check return statement has $REGISTRY.execute call
    const returnStmt = body?.body?.[0];
    const callExpr = returnStmt?.argument;
    expect(callExpr?.type).toBe('CallExpression');
    expect(callExpr?.callee?.type).toBe('MemberExpression');
    expect(callExpr?.callee?.object?.name).toBe('$REGISTRY');
    expect(callExpr?.callee?.property?.name).toBe('execute');

    // Check arguments
    expect(callExpr?.arguments?.length).toBe(2);
    expect(callExpr?.arguments?.[0]?.value).toBe('component:Counter');
    expect(callExpr?.arguments?.[1]?.type).toBe('ArrowFunctionExpression');
  });

  it('should add $REGISTRY and t_element imports', () => {
    const source = `
      component Counter() {
        return <div>Test</div>;
      }
    `;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    const transformer = createTransformer(ast);
    const result = transformer.transform();

    // Check imports were added
    const imports = result.ast.body.filter((node: any) => node.type === 'ImportDeclaration');
    expect(imports.length).toBeGreaterThan(0);

    // Check context tracked imports
    expect(result.context.usedImports.has('$REGISTRY')).toBe(true);
    expect(result.context.usedImports.has('t_element')).toBe(true);
  });

  it('should preserve component parameters', () => {
    const source = `
      component Counter({id, label}: ICounterProps) {
        return <div>{label}</div>;
      }
    `;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    const transformer = createTransformer(ast);
    const result = transformer.transform();

    const componentDecl: any = result.ast.body.find(
      (node: any) => node.type === 'VariableDeclaration'
    );

    const arrowFunction = componentDecl?.declarations?.[0]?.init;
    expect(arrowFunction?.params?.length).toBe(1);
  });

  it('should track reactivity function imports', () => {
    const source = `
      component Counter() {
        const [count, setCount] = createSignal(0);
        useEffect(() => {
          console.log(count());
        });
        return <div>{count()}</div>;
      }
    `;

    const lexer = createLexer(source);
    const tokens = lexer.scanTokens();
    const parser = createParser(tokens);
    const ast = parser.parse();

    const transformer = createTransformer(ast);
    const result = transformer.transform();

    // Check context tracked reactivity functions
    expect(result.context.usedImports.has('createSignal')).toBe(true);
    expect(result.context.usedImports.has('useEffect')).toBe(true);
    expect(result.context.usedImports.has('$REGISTRY')).toBe(true);
    expect(result.context.usedImports.has('t_element')).toBe(true);
  });
});
