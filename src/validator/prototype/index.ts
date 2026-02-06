/**
 * Validator Prototype Methods
 *
 * Attach all prototype methods to Validator.
 */

import { Validator } from '../validator.js';
import { addRule } from './add-rule.js';
import { getRules } from './get-rules.js';
import { validate } from './validate.js';

// Attach prototype methods
Validator.prototype.validate = validate;
Validator.prototype.addRule = addRule;
Validator.prototype.getRules = getRules;
