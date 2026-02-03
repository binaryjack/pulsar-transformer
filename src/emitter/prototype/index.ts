/**
 * Import Tracker Prototype Methods
 *
 * Attaches ImportTracker methods only.
 */

import { ImportTracker } from '../import-tracker.js';

// Import tracker methods
import { addImport } from './add-import.js';
import { _formatImport } from './format-import.js';
import { generateImports } from './generate-imports.js';
import { getImports } from './get-imports.js';
import { hasImport } from './has-import.js';

// Attach ImportTracker public methods
ImportTracker.prototype.addImport = addImport;
ImportTracker.prototype.getImports = getImports;
ImportTracker.prototype.hasImport = hasImport;
ImportTracker.prototype.generateImports = generateImports;

// Attach ImportTracker private helper (non-enumerable)
Object.defineProperty(ImportTracker.prototype, '_formatImport', {
  value: _formatImport,
  writable: true,
  enumerable: false,
  configurable: true,
});
