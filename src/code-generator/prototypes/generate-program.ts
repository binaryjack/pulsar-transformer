/**
 * CodeGenerator.prototype.generateProgram
 * Generate complete TypeScript program
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateProgram = function (this: ICodeGenerator): string {
  const parts: string[] = [];

  // First pass: generate body to collect imports
  const bodyCode: string[] = [];

  for (const stmt of this.ast.body) {
    const code = this.generateStatement(stmt);
    if (code) {
      bodyCode.push(code);
    }
  }

  // Generate imports (original + collected runtime imports)
  const importsCode = this.generateImports();
  if (importsCode) {
    parts.push(importsCode);
    parts.push(''); // Empty line after imports
  }

  // Add body
  parts.push(...bodyCode);

  return parts.join('\n');
};
