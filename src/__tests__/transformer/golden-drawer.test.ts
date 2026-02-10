/**
 * Golden Fixture Test - Drawer Component
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { createCodeGenerator } from '../../code-generator/index.js';
import { createLexer } from '../../lexer/index.js';
import { createParser } from '../../parser/index.js';
import { createTransformer } from '../../transformer/index.js';

describe('Golden Fixture - Drawer', () => {
  it('should transform Drawer.psr through full pipeline', () => {
    // Read the golden fixture
    const fixturePath = join(process.cwd(), 'tests/fixtures/real-psr/03-drawer.psr');
    const source = readFileSync(fixturePath, 'utf-8');

    // Run full pipeline: Lexer → Parser → Transformer → CodeGenerator
    const lexer = createLexer(source, 'drawer.psr');
    const tokens = lexer.scanTokens();

    const parser = createParser(tokens, 'drawer.psr');
    const ast = parser.parse();

    const transformer = createTransformer(ast, { sourceFile: 'drawer.psr' });
    const transformResult = transformer.transform();

    // Debug: log the transformed AST
    console.log('\n=== Transformed AST Body ===');
    const exportDecls = transformResult.ast.body.filter(
      (n: any) => n.type === 'ExportNamedDeclaration'
    );
    console.log(
      'Export declarations:',
      JSON.stringify(
        exportDecls.map((n: any) => ({
          type: n.type,
          declarationType: n.declaration?.type,
          declarationName: n.declaration?.name?.name || n.declaration?.declarations?.[0]?.id?.name,
        })),
        null,
        2
      )
    );

    // Verify transformed AST structure
    expect(transformResult.ast.type).toBe('Program');
    expect(transformResult.ast.body.length).toBeGreaterThan(0);

    // Check imports were added
    const imports = transformResult.ast.body.filter(
      (node: any) => node.type === 'ImportDeclaration'
    );
    expect(imports.length).toBeGreaterThan(0);

    // Find the transformed component (inside ExportNamedDeclaration)
    const exportDecl: any = transformResult.ast.body.find(
      (node: any) =>
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration' &&
        node.declaration?.declarations?.[0]?.id?.name === 'Drawer'
    );
    expect(exportDecl).toBeDefined();

    const componentDecl = exportDecl?.declaration;
    expect(componentDecl).toBeDefined();
    expect(componentDecl?.kind).toBe('const');

    // Drawer uses arrow function syntax, not component syntax, so no $REGISTRY wrapping
    const arrowFn = componentDecl?.declarations?.[0]?.init;
    expect(arrowFn?.type).toBe('ArrowFunctionExpression');
    const body = arrowFn?.body;
    expect(body?.type).toBe('BlockStatement');
    expect(body?.body?.length).toBeGreaterThan(0);

    // Verify imports tracked (no $REGISTRY for arrow function components)
    expect(transformResult.context.usedImports.has('useEffect')).toBe(true);
    expect(transformResult.context.usedImports.has('t_element')).toBe(true);

    // Verify no errors
    expect(transformResult.context.errors.length).toBe(0);

    // Generate code to see output (CodeGenerator still uses old approach)
    const generator = createCodeGenerator(transformResult.ast);
    const code = generator.generate();

    // Log output for inspection
    console.log('\n=== Transformed AST ===');
    console.log(JSON.stringify(componentDecl, null, 2).substring(0, 500));
    console.log('\n=== Used Imports ===');
    console.log(Array.from(transformResult.context.usedImports));
    console.log('\n=== Generated Code (CodeGenerator uses old approach) ===');
    console.log(code.substring(0, 500));
  });
});
