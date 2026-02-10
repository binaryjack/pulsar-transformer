/**
 * CodeGenerator.prototype.indent
 * Get current indentation string
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.indent = function (this: ICodeGenerator): string {
  return this.options.indent!.repeat(this.indentLevel);
};
