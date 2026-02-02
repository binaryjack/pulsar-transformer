/**
 * Prototype Method Attachment
 *
 * Attaches all prototype methods to TransformationReporter.
 * Import this file to ensure methods are available on instances.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import { TransformationReporter } from '../transformation-reporter.js';
import { addError } from './add-error.js';
import { addWarning } from './add-warning.js';
import { clear } from './clear.js';
import { displayErrors } from './display-errors.js';
import { displayWarnings } from './display-warnings.js';
import { getErrors } from './get-errors.js';
import { getWarnings } from './get-warnings.js';
import { hasErrors } from './has-errors.js';
import { hasWarnings } from './has-warnings.js';

// Attach methods to prototype
TransformationReporter.prototype.addError = addError;
TransformationReporter.prototype.addWarning = addWarning;
TransformationReporter.prototype.hasErrors = hasErrors;
TransformationReporter.prototype.hasWarnings = hasWarnings;
TransformationReporter.prototype.getErrors = getErrors;
TransformationReporter.prototype.getWarnings = getWarnings;
TransformationReporter.prototype.displayErrors = displayErrors;
TransformationReporter.prototype.displayWarnings = displayWarnings;
TransformationReporter.prototype.clear = clear;
