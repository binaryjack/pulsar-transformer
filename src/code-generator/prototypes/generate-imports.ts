/**
 * CodeGenerator.prototype.generateImports
 * Generate import statements including runtime imports
 */

import type { IImportDeclaration } from '../../parser/parser.types.js';
import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateImports = function (this: ICodeGenerator): string {
  // Group imports by source and type
  const importsBySource = new Map<string, { types: Set<string>; values: Set<string> }>();

  // Collect imports from original AST
  for (const stmt of this.ast.body) {
    if (stmt.type === 'ImportDeclaration') {
      const importDecl = stmt as IImportDeclaration;
      const source = importDecl.source.value;

      if (!importsBySource.has(source)) {
        importsBySource.set(source, { types: new Set(), values: new Set() });
      }

      const imports = importsBySource.get(source)!;

      for (const spec of importDecl.specifiers) {
        const isTypeImport = importDecl.typeOnly || spec.typeOnly;
        const importName = spec.imported.name;

        if (isTypeImport) {
          imports.types.add(importName);
        } else {
          imports.values.add(importName);
        }
      }
    }
  }

  // Add runtime imports (always values, never types)
  if (this.imports.size > 0) {
    const runtimeSource = '@pulsar-framework/pulsar.dev';
    if (!importsBySource.has(runtimeSource)) {
      importsBySource.set(runtimeSource, { types: new Set(), values: new Set() });
    }

    const imports = importsBySource.get(runtimeSource)!;
    for (const imp of this.imports) {
      imports.values.add(imp);
    }
  }

  // Generate consolidated import statements with sorted specifiers
  const parts: string[] = [];
  for (const [source, { types, values }] of importsBySource) {
    // Generate type-only import if there are type imports
    if (types.size > 0) {
      const sortedTypes = Array.from(types).sort();
      parts.push(`import type { ${sortedTypes.join(', ')} } from '${source}';`);
    }

    // Generate value import if there are value imports
    if (values.size > 0) {
      const sortedValues = Array.from(values).sort();
      parts.push(`import { ${sortedValues.join(', ')} } from '${source}';`);
    }
  }

  return parts.join('\n');
};
