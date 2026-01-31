import { ITransformationContext } from '../../context/transformation-context.types.js';
import { IElementGeneratorInternal } from './element-generator.types.js';
import { generateChildren } from './prototype/generate-children.js';
import { generateComponentCall } from './prototype/generate-component-call.js';
import { generateDynamicElement } from './prototype/generate-dynamic-element.js';
import { generateDynamicProps } from './prototype/generate-dynamic-props.js';
import { generateEventListeners } from './prototype/generate-event-listeners.js';
import { generateFragment } from './prototype/generate-fragment.js';
import { generateRefAssignment } from './prototype/generate-ref-assignment.js';
import { generateRegistryElement } from './prototype/generate-registry-element.js';
import { generateStaticElement } from './prototype/generate-static-element.js';
import { generate } from './prototype/generate.js';

/**
 * Generates TypeScript AST nodes from JSX IR
 * Follows prototype-based pattern as per architecture requirements
 *
 * Properties:
 * - context: readonly - transformation context (immutable)
 * - varCounter: mutable - incremented for unique variable names (safe: single-threaded transformation)
 */
export const ElementGenerator = function (
  this: IElementGeneratorInternal,
  context: ITransformationContext
) {
  // Store the transformation context (readonly)
  Object.defineProperty(this, 'context', {
    value: context,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  // Counter for unique variable names (mutable - required for code generation)
  // Safe because transformer runs single-threaded per file
  Object.defineProperty(this, 'varCounter', {
    value: 0,
    writable: true,
    configurable: false,
    enumerable: false,
  });
} as any as { new (context: ITransformationContext): IElementGeneratorInternal };

// Attach prototype methods
Object.assign(ElementGenerator.prototype, {
  generate,
  generateStaticElement,
  generateDynamicElement,
  generateRegistryElement,
  generateComponentCall,
  generateEventListeners,
  generateChildren,
  generateDynamicProps,
  generateFragment,
  generateRefAssignment,
});
