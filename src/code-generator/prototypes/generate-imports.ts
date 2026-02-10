/**
 * CodeGenerator.prototype.generateImports
 * Generate import statements including runtime imports
 */

import type { IImportDeclaration } from '../../parser/parser.types.js';
import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateImports = function (this: ICodeGenerator): string {
  // Group imports by source
  const importsBySource = new Map<string, Set<string>>();

  // Collect imports from original AST
  for (const stmt of this.ast.body) {
    if (stmt.type === 'ImportDeclaration') {
      const importDecl = stmt as IImportDeclaration;
      const source = importDecl.source.value;

      if (!importsBySource.has(source)) {
        importsBySource.set(source, new Set());
      }

      const specifiers = importsBySource.get(source)!;
      for (const spec of importDecl.specifiers) {
        specifiers.add(spec.imported.name);
      }
    }
  }

  // Add runtime imports
  if (this.imports.size > 0) {
    const runtimeSource = '@pulsar-framework/pulsar.dev';
    if (!importsBySource.has(runtimeSource)) {
      importsBySource.set(runtimeSource, new Set());
    }

    const specifiers = importsBySource.get(runtimeSource)!;
    for (const imp of this.imports) {
      specifiers.add(imp);
    }
  }

  // Generate consolidated import statements with sorted specifiers
  const parts: string[] = [];
  for (const [source, specifiers] of importsBySource) {
    const sortedSpecifiers = Array.from(specifiers).sort();
    parts.push(`import { ${sortedSpecifiers.join(', ')} } from '${source}';`);
  }

  return parts.join('\n');
};
