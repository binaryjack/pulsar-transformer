/**
 * Transformer Module
 *
 * Exports IR transformation utilities.
 */

export { visitIRNode } from './ir-visitor.js';
export type { IVisitorMap, VisitorFunction } from './ir-visitor.js';
export { transformReactivity } from './reactivity-transformer.js';
export { escapeStringLiteral, escapeUnicode, needsUnicodeEscape } from './unicode-escaper.js';
