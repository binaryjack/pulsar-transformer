export { ElementGenerator } from './element-generator.js';
export type { IElementGenerator, SElementGenerator } from './element-generator.types.js';

// Export keyed map reconciliation
export { generateKeyedReconciliation } from './prototype/generate-keyed-map.js';
export type { IKeyedReconciliationOptions } from './prototype/generate-keyed-map.js';

// Export registry-enhanced generators
export {
  generateComponentCallWithRegistry,
  generateStaticElementWithRegistry,
} from './prototype/generate-with-registry.js';
