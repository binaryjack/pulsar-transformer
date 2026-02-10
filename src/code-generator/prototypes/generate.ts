/**
 * CodeGenerator.prototype.generate
 * Main entry point - generates TypeScript code from AST
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.generate = function (this: ICodeGenerator): string {
  return this.generateProgram();
};
