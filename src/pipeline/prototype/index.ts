/**
 * Pipeline Prototype Methods
 *
 * Attaches methods to Pipeline prototype.
 */

import { Pipeline } from '../pipeline.js';
import { getConfig } from './get-config.js';
import { transform } from './transform.js';

// Attach public methods
Pipeline.prototype.transform = transform;
Pipeline.prototype.getConfig = getConfig;
