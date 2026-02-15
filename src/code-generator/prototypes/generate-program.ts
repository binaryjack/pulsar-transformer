/**
 * CodeGenerator.prototype.generateProgram
 * Generate complete TypeScript program
 */

import { getTracerManager } from '../../debug/tracer/core/tracer-manager.js';
import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generateProgram = function (this: ICodeGenerator): string {
  const tracer = getTracerManager();
  const parts: string[] = [];

  // First pass: generate body to collect imports
  const bodyCode: string[] = [];
  const statementResults: { type: string; success: boolean; length: number }[] = [];

  for (const stmt of this.ast.body) {
    const code = this.generateStatement(stmt);

    // DEBUG: Check for dollar sign in generated statement
    if (code && code.includes('item.price')) {
      console.log('[GENERATEPROGRAM-DEBUG] Statement code:', code);
      console.log("[GENERATEPROGRAM-DEBUG] Contains [$':", code.includes("['$'"));
      const match = code.match(/\[[^\]]*item\.price/);
      if (match) {
        console.log('[GENERATEPROGRAM-DEBUG] Array pattern:', match[0]);
      }
    }

    // DEBUG: Check if this statement contains product.price
    if (code && code.includes('product.price')) {
      const match = code.match(/`[^`]*product\.price[^`]*`/);
      if (match) {
        console.log('[GENERATEPROGRAM-DEBUG] Statement with product.price:', match[0]);
        console.log(
          '[GENERATEPROGRAM-DEBUG] Char codes:',
          Array.from(match[0]).map((c) => c.charCodeAt(0))
        );
      }
    }

    // Track each statement generation result
    statementResults.push({
      type: stmt.type,
      success: !!code && code.length > 0,
      length: code ? code.length : 0,
    });

    if (code) {
      bodyCode.push(code);
    } else {
      // Track failed code generation
      if (tracer.isEnabled()) {
        tracer.trace('codegen', {
          type: 'statement.empty',
          statementType: stmt.type,
        } as any);
      }
    }
  }

  // Trace generation summary
  if (tracer.isEnabled()) {
    const totalStatements = this.ast.body.length;
    const successful = statementResults.filter((r) => r.success).length;
    const failed = totalStatements - successful;

    tracer.trace('codegen', {
      type: 'program.generation-summary',
      totalStatements,
      successful,
      failed,
      results: statementResults,
    } as any);
  }

  // Generate imports (original + collected runtime imports)
  const importsCode = this.generateImports();
  if (importsCode) {
    parts.push(importsCode);
    parts.push(''); // Empty line after imports
  }

  // Add body
  parts.push(...bodyCode);

  const finalCode = parts.join('\n');

  // Trace final output metrics
  if (tracer.isEnabled()) {
    tracer.trace('codegen', {
      type: 'program.complete',
      outputLength: finalCode.length,
      importCount: this.imports.size,
      statementCount: bodyCode.length,
    } as any);
  }

  return finalCode;
};
