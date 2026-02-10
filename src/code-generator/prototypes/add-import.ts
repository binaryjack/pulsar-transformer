/**
 * CodeGenerator.prototype.addImport
 * Track imports needed for generated code
 */

import type { ICodeGenerator } from '../code-generator.js';
import { CodeGenerator } from '../code-generator.js';

CodeGenerator.prototype.addImport = function (this: ICodeGenerator, name: string): void {
  this.imports.add(name);
};
